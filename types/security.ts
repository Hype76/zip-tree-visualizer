export type FileCategory = "text" | "image" | "binary" | "unknown";

export interface UnifiedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  content?: string;
  binary?: Uint8Array;
  contentUrl?: string; // For GitHub raw fetching
  type: FileCategory;
  depth: number;
}

export interface SecurityIssue {
  path: string;
  line?: number;
  match?: string;
  category: "danger" | "warning" | "todo" | "secret" | "obfuscation";
  issue: string; // Human readable description
  context?: string;
}

export interface FileSignatureAlert {
  path: string;
  issue: "extension-mismatch" | "binary-mismatch" | "large-file" | "zip-bomb-indicator";
  details: string;
}

export interface SecurityScore {
  score: number; // 0-100
  status: "clean" | "warning" | "high-risk";
  summaryCounts: {
    secrets: number;
    dangerous: number;
    obfuscation: number;
    todos: number;
    mismatches: number;
    zipbomb: number;
  };
}

export interface SecurityAnalysisResult {
  sourceType: 'zip' | 'github';
  files: UnifiedFile[];
  tree: TreeNode[];
  issues: SecurityIssue[];
  alerts: FileSignatureAlert[];
  score: SecurityScore;
  stats: {
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    totalLoc: number;
    complexity: number;
    extensions: { [key: string]: number };
    maxDepth: number;
  };
  asciiTree: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: TreeNode[];
  fileData?: UnifiedFile;
  riskLevel?: "none" | "low" | "high";
}