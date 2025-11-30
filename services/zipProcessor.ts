import JSZip from 'jszip';
import { TreeNode, TreeProcessingResult } from '../types';

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
 * Converts a JSZip object into a nested TreeNode structure
 */
const buildTreeStructure = (zip: JSZip): TreeNode[] => {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode[]>();

  // Initialize root level in map
  map.set('', root);

  const entries = Object.keys(zip.files).sort();

  entries.forEach((path) => {
    // Remove trailing slash for folders to standardize processing
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const parts = cleanPath.split('/');
    const fileName = parts.pop() || '';
    
    // We intentionally ignore parentPath variable if unused to satisfy linter
    // const parentPath = parts.join('/');

    let currentLevel = root;
    
    parts.forEach((part) => {
      // Check if this folder already exists at this level
      let existingFolder = currentLevel.find(n => n.name === part && n.children);
      
      if (!existingFolder) {
        existingFolder = { name: part, children: [] };
        currentLevel.push(existingFolder);
      }
      
      // Move deeper
      if (existingFolder.children) {
        currentLevel = existingFolder.children;
      }
    });

    const isDir = zip.files[path].dir;
    const alreadyExists = currentLevel.find(n => n.name === fileName);
    
    if (!alreadyExists) {
        // If it is a directory, it has children. If a file, it does not.
        currentLevel.push({ 
            name: fileName, 
            children: isDir ? [] : undefined 
        });
    } else if (isDir && !alreadyExists.children) {
        (alreadyExists as any).children = [];
    }
  });

  return root;
};

/**
 * Recursive function to generate ASCII string from TreeNode
 */
const generateAscii = (nodes: TreeNode[], prefix = ''): string => {
  let output = '';
  // Sort before displaying
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

export const processZipFile = async (file: File): Promise<TreeProcessingResult> => {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0; // Uncompressed size

    // NOTE: The first argument is relativePath. We prefix with _ to indicate to TS it is unused.
    contents.forEach((_relativePath, zipEntry) => {
        if (!zipEntry.dir) {
            fileCount++;
            totalSize += (zipEntry as any)._data.uncompressedSize || 0;
        } else {
            folderCount++;
        }
    });

    const treeStructure = buildTreeStructure(contents);
    const treeString = `.\n${generateAscii(treeStructure)}`;

    return {
      treeString,
      fileCount,
      folderCount,
      totalSize
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