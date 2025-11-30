import { UnifiedFile, SecurityAnalysisResult, SecurityIssue, FileSignatureAlert } from '../types/security';
import { readZip } from './zipReader';
import { validateSignature } from './fileSignatures';
import { scanContent } from './textScanner';
import { calculateScore } from './scoring';

export const analyzeSecurity = async (zipFile: File): Promise<SecurityAnalysisResult> => {
  
  // 1. Unpack
  const { files, tree, ascii } = await readZip(zipFile);

  const issues: SecurityIssue[] = [];
  const alerts: FileSignatureAlert[] = [];
  const extensionCounts: { [key: string]: number } = {};
  
  let totalLoc = 0;
  let maxDepth = 0;

  // 2. Scan Files
  files.forEach(file => {
    if (file.depth > maxDepth) maxDepth = file.depth;
    
    extensionCounts[file.extension] = (extensionCounts[file.extension] || 0) + 1;

    // A. Signature Check
    if (file.binary) {
      const sigAlert = validateSignature(file.path, file.binary, file.extension);
      if (sigAlert) alerts.push(sigAlert);
    }

    // B. Large File / Unusual Check
    if (file.size > 1024 * 1024 * 5) { // 5MB
       alerts.push({ path: file.path, issue: "large-file", details: `File is large (${(file.size/1024/1024).toFixed(2)}MB)` });
    }

    // C. Text Analysis
    if (file.type === 'text' && file.content) {
      const lines = file.content.split('\n').length;
      totalLoc += lines;
      
      if (lines > 20000) {
        alerts.push({ path: file.path, issue: "large-file", details: `Text file has > 20k lines (${lines})` });
      }

      const fileIssues = scanContent(file.path, file.content);
      issues.push(...fileIssues);
    }
  });

  // 3. Zip Bomb Detection (Heuristic)
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  if (zipFile.size > 0) {
      const ratio = totalSize / zipFile.size;
      if (ratio > 100) {
          alerts.push({ path: "ROOT", issue: "zip-bomb-indicator", details: `Extreme compression ratio detected (${ratio.toFixed(0)}x).` });
      }
  }

  // 4. Score
  const score = calculateScore(issues, alerts);

  return {
    files,
    tree,
    issues,
    alerts,
    score,
    asciiTree: ascii,
    stats: {
      totalFiles: files.length,
      totalFolders: files.filter(f => f.path.includes('/')).length, // approximate
      totalSize,
      totalLoc,
      maxDepth,
      extensions: extensionCounts
    }
  };
};
