import JSZip from 'jszip';
import { TreeNode, TreeProcessingResult, FileTypeStat, SecurityAudit } from '../types';

/**
 * Sorts nodes: Folders first (alphabetical), then files (alphabetical)
 */
const sortNodes = (a: TreeNode, b: TreeNode): number => {
  const aIsFolder = !!a.children;
  const bIsFolder = !!b.children;

  if (aIsFolder && !bIsFolder) return -1;
  if (!aIsFolder && bIsFolder) return 1;
  return a.name.localeCompare(b.name);
};

/**
 * Converts a JSZip object into a nested TreeNode structure with full paths
 */
const buildTreeStructure = (zip: JSZip): TreeNode[] => {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode[]>();

  map.set('', root);

  const entries = Object.keys(zip.files).sort();

  entries.forEach((path) => {
    // Remove trailing slash for folders to get clean name
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const parts = cleanPath.split('/');
    const fileName = parts.pop() || '';
    
    // Ensure we can traverse to this node
    let currentLevel = root;
    let currentPathBuilder = '';

    parts.forEach((part) => {
      currentPathBuilder = currentPathBuilder ? `${currentPathBuilder}/${part}` : part;
      let existingFolder = currentLevel.find(n => n.name === part && n.children);
      
      if (!existingFolder) {
        existingFolder = { name: part, path: currentPathBuilder, children: [] };
        currentLevel.push(existingFolder);
      }
      
      if (existingFolder.children) {
        currentLevel = existingFolder.children;
      }
    });

    const isDir = zip.files[path].dir;
    const alreadyExists = currentLevel.find(n => n.name === fileName);
    const fullNodePath = cleanPath;
    
    if (!alreadyExists) {
        currentLevel.push({ 
            name: fileName, 
            path: fullNodePath,
            children: isDir ? [] : undefined 
        });
    } else if (isDir && !alreadyExists.children) {
        (alreadyExists as any).children = [];
        // Ensure path is correct even if created implicitly earlier
        alreadyExists.path = fullNodePath;
    }
  });

  return root;
};

export const generateAscii = (nodes: TreeNode[], prefix = ''): string => {
  let output = '';
  const sortedNodes = [...nodes].sort(sortNodes);

  sortedNodes.forEach((node, index) => {
    const isLast = index === sortedNodes.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');

    output += `${prefix}${marker}${node.name}${node.children ? '/' : ''}\n`;

    if (node.children) {
      output += generateAscii(node.children, newPrefix);
    }
  });

  return output;
};

// Heuristic complexity check: counts control flow keywords
const calculateComplexity = (content: string): number => {
  const complexityPatterns = [
    /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, 
    /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\?\s*:/g, /&&/g, /\|\|/g
  ];
  
  let score = 0;
  complexityPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) score += matches.length;
  });
  return score;
};

const isTextFile = (filename: string): boolean => {
  const textExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'md', 'txt', 
    'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'xml', 'yaml', 'yml', 'env', 'gitignore'
  ];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return textExtensions.includes(ext);
};

const SENSITIVE_FILES = [
  /\.env(\..+)?$/,
  /id_rsa/,
  /\.pem$/,
  /\.key$/,
  /credentials\.json$/,
  /secrets\./,
  /\.git\//,
  /wp-config\.php/
];

const checkSensitiveFilename = (path: string): boolean => {
  return SENSITIVE_FILES.some(regex => regex.test(path));
};

export const extractFileContent = async (file: File, path: string): Promise<string> => {
  try {
    const zip = new JSZip();
    await zip.loadAsync(file);
    const zipObj = zip.file(path);
    if (!zipObj) return "File not found in archive.";
    
    // Simple binary check based on extension
    if (!isTextFile(path)) {
        return "Binary file (image or compiled). Preview unavailable.";
    }

    const content = await zipObj.async('string');
    return content;
  } catch (e) {
    return "Error reading file content.";
  }
};

export const processZipFile = async (file: File): Promise<TreeProcessingResult> => {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0;
    let totalLoc = 0;
    let complexityScore = 0;
    let maxDepth = 0;

    const security: SecurityAudit = {
      riskScore: 0,
      sensitiveFiles: [],
      keywordMatches: { todos: 0, fixmes: 0, hacks: 0, secrets: 0 }
    };

    const extensionMap = new Map<string, FileTypeStat>();

    // Prepare async tasks for file analysis
    const fileAnalysisTasks: Promise<void>[] = [];

    contents.forEach((relativePath, zipEntry) => {
      // Calculate Depth
      const depth = relativePath.split('/').length;
      if (depth > maxDepth) maxDepth = depth;

      // Security: Check Filenames
      if (checkSensitiveFilename(relativePath)) {
        security.sensitiveFiles.push(relativePath);
        security.riskScore += 10;
      }

      if (zipEntry.dir) {
        folderCount++;
      } else {
        fileCount++;
        const size = (zipEntry as any)._data.uncompressedSize || 0;
        totalSize += size;

        const ext = relativePath.split('.').pop()?.toLowerCase() || 'other';
        
        if (!extensionMap.has(ext)) {
          extensionMap.set(ext, { extension: ext, count: 0, size: 0, lines: 0 });
        }
        const stat = extensionMap.get(ext)!;
        stat.count++;
        stat.size += size;

        // Only analyze content for text files smaller than 1MB to prevent browser hang
        if (isTextFile(relativePath) && size < 1024 * 1024) {
          const task = zipEntry.async('string').then(content => {
            const lines = content.split(/\r\n|\r|\n/).length;
            const complexity = calculateComplexity(content);
            
            totalLoc += lines;
            complexityScore += complexity;
            stat.lines += lines;

            // Security: Content scanning
            const lowerContent = content.toLowerCase();
            const todos = (lowerContent.match(/todo/g) || []).length;
            const fixmes = (lowerContent.match(/fixme/g) || []).length;
            const hacks = (lowerContent.match(/hack/g) || []).length;
            
            // Very basic secret scanning in content (high false positive potential, keeping it conservative)
            const possibleSecrets = (lowerContent.match(/api_key|access_key|secret_key/g) || []).length;

            security.keywordMatches.todos += todos;
            security.keywordMatches.fixmes += fixmes;
            security.keywordMatches.hacks += hacks;
            security.keywordMatches.secrets += possibleSecrets;

            if (possibleSecrets > 0) security.riskScore += (possibleSecrets * 2);
          });
          fileAnalysisTasks.push(task);
        }
      }
    });

    // Wait for all text files to be analyzed
    await Promise.all(fileAnalysisTasks);

    // Convert map to array and sort by count
    const extensionBreakdown = Array.from(extensionMap.values())
      .sort((a, b) => b.count - a.count);

    const structure = buildTreeStructure(contents);
    const treeString = `.\n${generateAscii(structure)}`;

    return {
      treeString,
      structure,
      fileCount,
      folderCount,
      totalSize,
      totalLoc,
      complexityScore,
      extensionBreakdown,
      maxDepth,
      security
    };

  } catch (error) {
    console.error("ZIP Processing Error:", error);
    throw new Error("Failed to process ZIP file. It may be corrupted or encrypted.");
  }
};

export const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Filter tree nodes based on search term
 */
export const filterTree = (nodes: TreeNode[], term: string): TreeNode[] => {
  if (!term) return nodes;
  const lowerTerm = term.toLowerCase();

  return nodes.reduce((acc: TreeNode[], node) => {
    const matchesSelf = node.name.toLowerCase().includes(lowerTerm);
    const filteredChildren = node.children ? filterTree(node.children, term) : undefined;
    const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

    if (matchesSelf || hasMatchingChildren) {
      acc.push({
        ...node,
        children: hasMatchingChildren ? filteredChildren : (matchesSelf ? node.children : [])
      });
    }
    return acc;
  }, []);
};