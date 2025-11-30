import JSZip from 'jszip';
import { UnifiedFile, TreeNode, FileCategory } from '../types/security';

// Helper: Determine file type
export const getFileCategory = (ext: string): FileCategory => {
  const textExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md', 'txt', 'py', 'java', 'c', 'h', 'cpp', 'xml', 'yaml', 'yml', 'env', 'gitignore', 'svg'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'];
  
  if (textExts.includes(ext)) return 'text';
  if (imageExts.includes(ext)) return 'image';
  return 'binary';
};

// Helper: Build visual tree
export const buildTree = (files: UnifiedFile[]): TreeNode[] => {
  const root: TreeNode[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let existingNode = currentLevel.find(n => n.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          fileData: isFile ? file : undefined
        };
        currentLevel.push(existingNode);
      }
      
      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  // Sort: Folders first, then files
  const sortRecursive = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    nodes.forEach(n => {
      if (n.children) sortRecursive(n.children);
    });
  };

  sortRecursive(root);
  return root;
};

// Helper: ASCII generation
export const generateAsciiTree = (nodes: TreeNode[], prefix = ''): string => {
  let output = '';
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    
    output += `${prefix}${marker}${node.name}\n`;
    if (node.children) {
      output += generateAsciiTree(node.children, newPrefix);
    }
  });
  return output;
};

export const readZip = async (file: File): Promise<{ files: UnifiedFile[], tree: TreeNode[], ascii: string }> => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const files: UnifiedFile[] = [];

  const entries = Object.keys(loadedZip.files).filter(path => !loadedZip.files[path].dir);
  
  const processEntry = async (path: string) => {
    const entry = loadedZip.files[path];
    const name = path.split('/').pop() || path;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const size = (entry as any)._data.uncompressedSize;
    const type = getFileCategory(ext);

    let content: string | undefined = undefined;
    let binary: Uint8Array | undefined = undefined;

    if (size < 10 * 1024 * 1024) { 
        binary = await entry.async('uint8array');
        
        if (type === 'text' && size < 2 * 1024 * 1024) {
             content = await entry.async('string');
        }
    }

    files.push({
        path,
        name,
        extension: ext,
        size,
        type,
        depth: path.split('/').length,
        binary,
        content
    });
  };

  await Promise.all(entries.map(processEntry));

  const tree = buildTree(files);
  const ascii = generateAsciiTree(tree);

  return { files, tree, ascii };
};