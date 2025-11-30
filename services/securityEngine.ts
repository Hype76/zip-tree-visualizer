import { SecurityAnalysisResult, SecurityIssue, FileSignatureAlert, UnifiedFile } from '../types/security';
import { readZip, buildTree, generateAsciiTree } from './zipReader';
import { validateSignature } from './fileSignatures';
import { scanContent } from './textScanner';
import { calculateScore } from './scoring';
import { fetchGitHubRepo } from './githubFetcher';

// Shared Analysis Logic
const runSecurityScan = async (
    files: UnifiedFile[], 
    sourceType: 'zip' | 'github',
    totalSizeInput?: number
): Promise<SecurityAnalysisResult> => {

    const tree = buildTree(files);
    const ascii = generateAsciiTree(tree);
    
    const issues: SecurityIssue[] = [];
    const alerts: FileSignatureAlert[] = [];
    const extensionCounts: { [key: string]: number } = {};
    
    let totalLoc = 0;
    let maxDepth = 0;
    let totalComplexity = 0;
    let scannedFilesCount = 0;

    files.forEach(file => {
        if (file.depth > maxDepth) maxDepth = file.depth;
        
        extensionCounts[file.extension] = (extensionCounts[file.extension] || 0) + 1;

        // A. Signature Check (Only possible if binary loaded)
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
            scannedFilesCount++;
            const lines = file.content.split('\n').length;
            totalLoc += lines;
            
            // Calculate Complexity (Heuristic)
            const complexityPatterns = [
                /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, 
                /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\?\s*:/g, /&&/g, /\|\|/g
            ];
            let complexity = 0;
            complexityPatterns.forEach(p => {
                const matches = file.content!.match(p);
                if (matches) complexity += matches.length;
            });
            totalComplexity += complexity;
            
            if (lines > 20000) {
                alerts.push({ path: file.path, issue: "large-file", details: `Text file has > 20k lines (${lines})` });
            }

            const fileIssues = scanContent(file.path, file.content);
            issues.push(...fileIssues);
        }
    });

    // 3. Zip Bomb / Size Checks
    const totalSize = totalSizeInput || files.reduce((acc, f) => acc + f.size, 0);

    // 4. Score
    const score = calculateScore(issues, alerts);

    return {
        sourceType,
        files,
        tree,
        issues,
        alerts,
        score,
        asciiTree: ascii,
        stats: {
            totalFiles: files.length,
            totalFolders: files.filter(f => f.path.includes('/')).length, 
            totalSize,
            totalLoc,
            complexity: totalComplexity,
            maxDepth,
            extensions: extensionCounts
        }
    };
};

export const analyzeZip = async (zipFile: File): Promise<SecurityAnalysisResult> => {
    const { files } = await readZip(zipFile);
    return runSecurityScan(files, 'zip', zipFile.size);
};

export const analyzeGitHub = async (url: string, token?: string, progressCallback?: (msg: string) => void): Promise<SecurityAnalysisResult> => {
    const { files, repoSize } = await fetchGitHubRepo(url, token, progressCallback);
    const result = await runSecurityScan(files, 'github', repoSize);
    return result;
};