export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export interface FileTypeStat {
  extension: string;
  count: number;
  size: number;
  lines: number;
}

export interface SecurityAudit {
  riskScore: number;
  sensitiveFiles: string[]; // Paths to files like .env, id_rsa
  keywordMatches: {
    todos: number;
    fixmes: number;
    hacks: number;
    secrets: number; // Occurrences of "password", "apikey", etc
  };
}

export interface TreeProcessingResult {
  treeString: string;
  structure: TreeNode[]; // Keeping the raw structure for filtering
  fileCount: number;
  folderCount: number;
  totalSize: number;
  totalLoc: number;
  complexityScore: number;
  extensionBreakdown: FileTypeStat[];
  maxDepth: number;
  security: SecurityAudit;
}