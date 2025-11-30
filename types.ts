export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export interface TreeProcessingResult {
  treeString: string;
  fileCount: number;
  folderCount: number;
  totalSize: number;
}
