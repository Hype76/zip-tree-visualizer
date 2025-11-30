import { UnifiedFile, TreeNode, FileCategory } from '../types/security';

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export const parseGitHubUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1];
    let branch = 'main';
    let subPath = '';

    if (pathParts.length > 3 && pathParts[2] === 'tree') {
      branch = pathParts[3];
      if (pathParts.length > 4) {
        subPath = pathParts.slice(4).join('/');
      }
    }

    return { owner, repo, branch, subPath };
  } catch (e) {
    return null;
  }
};

const getFileCategory = (ext: string): FileCategory => {
  const textExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md', 'txt', 'py', 'java', 'c', 'h', 'cpp', 'xml', 'yaml', 'yml', 'env', 'gitignore', 'svg', 'php', 'rb', 'go', 'rs'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico'];
  
  if (textExts.includes(ext)) return 'text';
  if (imageExts.includes(ext)) return 'image';
  return 'binary';
};

export const fetchGitHubRepo = async (
  url: string, 
  token?: string,
  progressCallback?: (msg: string) => void
): Promise<{ files: UnifiedFile[], repoSize: number }> => {
  
  const repoInfo = parseGitHubUrl(url);
  if (!repoInfo) throw new Error("Invalid GitHub URL. Use format: https://github.com/owner/repo");

  const { owner, repo, branch } = repoInfo;
  
  // 1. Fetch Tree
  progressCallback?.("Fetching repository structure...");
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const treeApiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const response = await fetch(treeApiUrl, { headers });

  if (response.status === 404) throw new Error("Repository or branch not found. Is it private?");
  if (response.status === 403) throw new Error("API Rate Limit exceeded. Please provide a GitHub Token or wait.");
  if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);

  const data = await response.json();
  
  if (data.truncated) {
    console.warn("Tree is truncated! Repo is too large.");
  }

  const treeItems: GitHubTreeItem[] = data.tree;
  const files: UnifiedFile[] = [];
  let repoSize = 0;

  // 2. Process Tree Metadata
  treeItems.forEach(item => {
    if (item.type === 'blob') {
      const ext = item.path.split('.').pop()?.toLowerCase() || '';
      const size = item.size || 0;
      repoSize += size;
      const type = getFileCategory(ext);

      // We use raw.githubusercontent.com for content fetching to avoid API rate limits on blob endpoints
      // Note: This works for public repos. Private repos need API + Token.
      const contentUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;

      files.push({
        path: item.path,
        name: item.path.split('/').pop() || item.path,
        extension: ext,
        size: size,
        type: type,
        depth: item.path.split('/').length,
        contentUrl: contentUrl
      });
    }
  });

  // 3. Smart Content Fetching (Partial Scan)
  // We can't fetch ALL files without hitting rate limits or being slow.
  // We will fetch the top 20 text files by "interest" (e.g. root files, source code) to give *some* data.
  // The rest will be lazy loaded by the UI.
  
  const textFiles = files.filter(f => f.type === 'text' && f.size < 500 * 1024); // < 500KB
  // prioritize known config files and source code
  const priorityFiles = textFiles.filter(f => 
    f.path.match(/(package\.json|tsconfig\.json|\.env|README|index\.|server\.|app\.)/i)
  ).slice(0, 10);
  
  const randomSample = textFiles
    .filter(f => !priorityFiles.includes(f))
    .slice(0, 10);

  const filesToFetch = [...priorityFiles, ...randomSample];

  if (filesToFetch.length > 0) {
    progressCallback?.(`Scanning ${filesToFetch.length} priority files...`);
    
    // Fetch in parallel batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < filesToFetch.length; i += BATCH_SIZE) {
        const batch = filesToFetch.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (f) => {
            try {
                const res = await fetch(f.contentUrl!, { 
                    headers: token ? { 'Authorization': `token ${token}` } : undefined 
                });
                if (res.ok) {
                    f.content = await res.text();
                }
            } catch (e) {
                console.warn(`Failed to fetch ${f.path}`, e);
            }
        }));
    }
  }

  return { files, repoSize };
};

export const fetchSingleFileContent = async (url: string, token?: string): Promise<string> => {
    const headers: HeadersInit = token ? { 'Authorization': `token ${token}` } : {};
    try {
        const res = await fetch(url, { headers });
        if (!res.ok) return `Error loading content: ${res.statusText}`;
        return await res.text();
    } catch (e) {
        return `Network error loading content.`;
    }
};