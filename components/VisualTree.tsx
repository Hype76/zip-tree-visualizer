import React, { useState } from 'react';
import { SecurityAnalysisResult, TreeNode, UnifiedFile, SecurityIssue } from '../types/security';
import { Folder, FolderOpen, FileCode, FileImage, File as FileIcon, ChevronRight, Search, AlertTriangle, Bot, Check, Copy, Maximize2, Loader2, FileText as FileTextIcon } from 'lucide-react';
import { Button } from './Button';

// --- Icons & UI Helpers ---

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': case 'json': case 'html': case 'css':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'png': case 'jpg': case 'jpeg': case 'svg': case 'gif':
      return <FileImage className="w-4 h-4 text-purple-400" />;
    case 'md': case 'txt': case 'env':
      return <FileTextIcon className="w-4 h-4 text-slate-400" />;
    default:
      return <FileIcon className="w-4 h-4 text-slate-500" />;
  }
};

// --- Syntax Highlighter (Polished) ---

const SyntaxHighlight = ({ content, issues }: { content: string, issues: SecurityIssue[] }) => {
  const lines = content.split('\n');
  
  return (
    <div className="font-mono text-xs md:text-sm leading-relaxed pb-20">
      {lines.map((line, i) => {
          const lineNum = i + 1;
          const lineIssues = issues.filter(issue => issue.line === lineNum);
          const hasIssue = lineIssues.length > 0;
          const maxSeverity = hasIssue ? (lineIssues.some(x => x.category === 'danger') ? 'danger' : 'warning') : null;

          return (
            <div key={i} className={`group relative table-row hover:bg-slate-800/30 ${hasIssue ? (maxSeverity === 'danger' ? 'bg-red-900/10' : 'bg-amber-900/10') : ''}`}>
                {/* Line Number */}
                <span className="table-cell text-slate-600 select-none pr-4 text-right w-10 align-top py-0.5 border-r border-slate-800/50 bg-slate-900/50">{lineNum}</span>
                
                {/* Code */}
                <span className="table-cell whitespace-pre-wrap break-all py-0.5 pl-4">
                    {line.split(/(\/\/.*$|'.*?'|".*?"|\b(?:import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type)\b)/g).map((part, j) => {
                        if (part.startsWith('//')) return <span key={j} className="text-slate-500 italic">{part}</span>;
                        if (part.startsWith("'") || part.startsWith('"')) return <span key={j} className="text-amber-300">{part}</span>;
                        if (/^(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type)$/.test(part)) 
                            return <span key={j} className="text-purple-400 font-semibold">{part}</span>;
                        return <span key={j} className="text-slate-300">{part}</span>;
                    })}
                </span>

                {/* Issue Marker Tooltip */}
                {hasIssue && (
                    <div className="absolute right-0 top-0 bottom-0 pr-2 flex items-center">
                        <div className="group/tooltip relative">
                            <AlertTriangle className={`w-4 h-4 ${maxSeverity === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                            <div className="hidden group-hover/tooltip:block absolute right-6 top-0 w-80 p-3 bg-slate-900 border border-slate-700 rounded shadow-xl z-50 text-xs">
                                {lineIssues.map((issue, k) => (
                                    <div key={k} className={`mb-2 last:mb-0 ${issue.category === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                                        <div className="font-bold uppercase text-[10px] mb-0.5 border-b border-white/10 pb-0.5 flex justify-between">
                                            <span>{issue.category}</span>
                                        </div>
                                        <div>{issue.issue}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          );
      })}
    </div>
  );
};

// --- Preview Component ---

const FilePreviewPane = ({ 
    file, 
    issues, 
    onFetch 
}: { 
    file: UnifiedFile, 
    issues: SecurityIssue[], 
    onFetch: () => void 
}) => {
    
    // Binary/Image Handling
    if (file.type === 'image') {
        if (file.binary) {
             const blob = new Blob([file.binary], { type: `image/${file.extension}` });
             const url = URL.createObjectURL(blob);
             return (
                <div className="flex flex-col items-center justify-center h-full p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    <img src={url} alt={file.name} className="max-w-full max-h-[400px] object-contain rounded shadow-lg" />
                    <p className="mt-4 text-slate-500 font-mono text-xs">{file.name}</p>
                </div>
             );
        } else if (file.contentUrl) {
            // Display remote image directly
            return (
                 <div className="flex flex-col items-center justify-center h-full p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    <img src={file.contentUrl} alt={file.name} className="max-w-full max-h-[400px] object-contain rounded shadow-lg" />
                    <p className="mt-4 text-slate-500 font-mono text-xs">{file.name} (Remote)</p>
                </div>
            )
        }
    }

    if (file.type === 'binary' || (file.type === 'unknown' && !file.content)) {
        return (
            <div className="p-8 font-mono text-xs text-slate-400 flex flex-col items-center justify-center h-full">
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 text-center max-w-md">
                    <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-medium mb-2">Binary File</h3>
                    <p className="text-slate-500 mb-4">Hex dump disabled.</p>
                </div>
            </div>
        );
    }

    // Lazy Load Check
    if (file.content === undefined && file.contentUrl) {
        // Trigger fetch on mount if visible? Or just show button?
        // Let's show a loading state if it's being fetched, or a button if waiting.
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                 <p className="text-slate-400">Content not loaded to save bandwidth.</p>
                 <Button onClick={onFetch} icon={<Loader2 className="w-4 h-4" />}>
                     Load File Content
                 </Button>
            </div>
        );
    }

    if (file.content !== undefined) {
        return <SyntaxHighlight content={file.content} issues={issues} />;
    }

    return <div className="p-8 text-center text-slate-500">Preview Unavailable</div>;
};

// --- Interactive Tree Node ---

const InteractiveNode: React.FC<{ 
    node: TreeNode; 
    depth?: number; 
    selectedPath: string | null;
    onSelect: (node: TreeNode) => void;
    issuesMap: Map<string, number>;
}> = ({ node, depth = 0, selectedPath, onSelect, issuesMap }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.fileData && selectedPath === node.fileData.path;
  const issueCount = node.fileData ? (issuesMap.get(node.fileData.path) || 0) : 0;

  const hasChildIssues = (n: TreeNode): boolean => {
      if (n.fileData && (issuesMap.get(n.fileData.path) || 0) > 0) return true;
      return n.children ? n.children.some(hasChildIssues) : false;
  };
  const warningInSubtree = hasChildren && hasChildIssues(node);

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 py-1 px-2 cursor-pointer transition-all border-l-2
          ${isSelected ? 'bg-blue-600/10 border-blue-500 text-blue-200' : 'border-transparent hover:bg-slate-800/50 text-slate-400'}
        `}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsOpen(!isOpen);
            onSelect(node);
        }}
      >
        <span className="opacity-70 flex-shrink-0">
          {hasChildren ? (
            isOpen ? <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-amber-400'}`} /> : <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-amber-500'}`} />
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        
        <span className={`text-sm font-mono truncate ${hasChildren ? 'font-medium' : ''} ${isSelected ? 'text-white' : ''}`}>
          {node.name}
        </span>

        {issueCount > 0 && (
             <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                {issueCount}
            </span>
        )}
        {warningInSubtree && !isOpen && issueCount === 0 && (
             <span className="ml-auto w-2 h-2 rounded-full bg-amber-500" title="Issues in folder"></span>
        )}
      </div>
      
      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child, i) => (
            <InteractiveNode 
                key={`${child.path}-${i}`} 
                node={child} 
                depth={depth + 1} 
                selectedPath={selectedPath}
                onSelect={onSelect}
                issuesMap={issuesMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

type AIFormat = 'gemini' | 'chatgpt' | 'claude';

export const VisualTree: React.FC<{ 
    data: SecurityAnalysisResult; 
    onFileContentRequest: (file: UnifiedFile) => void;
}> = ({ data, onFileContentRequest }) => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiCopied, setAiCopied] = useState(false);
  const [aiFormat, setAiFormat] = useState<AIFormat>('gemini');
  const [showAiMenu, setShowAiMenu] = useState(false);

  // Map issues for badges
  const issuesMap = new Map<string, number>();
  data.issues.forEach(i => issuesMap.set(i.path, (issuesMap.get(i.path) || 0) + 1));

  // Trigger lazy load if selected node has no content but has a URL
  React.useEffect(() => {
      if (selectedNode && selectedNode.fileData && selectedNode.fileData.content === undefined && selectedNode.fileData.contentUrl) {
          // We can optionally auto-fetch here, but let's leave it to the PreviewPane button to save API calls
          // unless it's a small file?
          // Let's just pass the request down
      }
  }, [selectedNode]);

  const handleCopyForAI = async () => {
    const contextName = selectedNode ? (selectedNode.children ? `folder "${selectedNode.name}"` : `file "${selectedNode.name}"`) : `project root`;
    const treeAscii = data.asciiTree; 
    
    let contentToCopy = "";
    if (selectedNode && selectedNode.fileData && selectedNode.fileData.content) {
        contentToCopy = selectedNode.fileData.content;
    } else {
        contentToCopy = treeAscii;
    }

    const issuesSummary = data.score.status !== 'clean' ? `\nSecurity Issues: ${data.issues.length} found. Score: ${data.score.score}/100.` : "";

    let prompt = "";
    if (aiFormat === 'claude') {
        prompt = `<context>\nI am analyzing the ${contextName}.\n${issuesSummary}\n\n<data>\n${contentToCopy}\n</data>\n</context>\n\nPlease analyze.`;
    } else if (aiFormat === 'chatgpt') {
        prompt = `I am analyzing ${contextName}. ${issuesSummary}\n\n\`\`\`\n${contentToCopy}\n\`\`\`\n\nPlease provide insights.`;
    } else {
        prompt = `Analyze this ${contextName}.\n${issuesSummary}\n\n${contentToCopy}`;
    }

    await navigator.clipboard.writeText(prompt);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
    setShowAiMenu(false);
  };

  return (
    <div className="w-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden h-[700px]">
      
      {/* Toolbar */}
      <div className="flex flex-col gap-4 px-4 py-3 bg-slate-800/50 border-b border-slate-800 no-print z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Breadcrumbs */}
          <div className="flex items-center overflow-hidden text-sm text-slate-400">
             <Folder className="w-4 h-4 mr-2 text-slate-500" />
             <span 
                className={`cursor-pointer hover:text-white transition-colors ${!selectedNode ? 'font-bold text-blue-400' : ''}`}
                onClick={() => setSelectedNode(null)}
             >
                root
             </span>
             {selectedNode && selectedNode.path.split('/').map((part, i, arr) => (
                <div key={i} className="flex items-center whitespace-nowrap">
                    <ChevronRight className="w-3 h-3 mx-1 text-slate-600" />
                    <span className={i === arr.length - 1 ? 'font-bold text-blue-400' : ''}>
                        {part}
                    </span>
                </div>
             ))}
          </div>

          <div className="flex items-center gap-2">
             <div className="relative md:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Find file..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-md py-1.5 pl-8 pr-3 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
            </div>
            
            <div className="relative flex items-center bg-indigo-600 rounded-md shadow-lg shadow-indigo-900/20 group">
                <button 
                    onClick={handleCopyForAI}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 rounded-l-md border-r border-indigo-700 transition-colors"
                >
                    {aiCopied ? <Check className="w-3 h-3" /> : <Bot className="w-3.5 h-3.5" />}
                    <span>Copy for {aiFormat === 'chatgpt' ? 'ChatGPT' : aiFormat === 'claude' ? 'Claude' : 'Gemini'}</span>
                </button>
                <button 
                    onClick={() => setShowAiMenu(!showAiMenu)}
                    className="px-1.5 py-1.5 hover:bg-indigo-500 rounded-r-md transition-colors text-white"
                >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAiMenu ? 'rotate-90' : ''}`} />
                </button>
                
                {showAiMenu && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-50 py-1">
                        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Select Target AI</div>
                        {[
                            { id: 'gemini', label: 'Gemini', desc: 'Standard Text' },
                            { id: 'chatgpt', label: 'ChatGPT', desc: 'Markdown Wrapper' },
                            { id: 'claude', label: 'Claude', desc: 'XML Tags' }
                        ].map((fmt) => (
                            <button
                                key={fmt.id}
                                onClick={() => { setAiFormat(fmt.id as AIFormat); setShowAiMenu(false); }}
                                className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-700 ${aiFormat === fmt.id ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'}`}
                            >
                                <span className="font-medium">{fmt.label}</span>
                                <span className="text-[10px] text-slate-500">{fmt.desc}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Button 
                variant="secondary" 
                onClick={async () => await navigator.clipboard.writeText(data.asciiTree)}
                className="!py-1.5 !px-3 !text-xs hidden sm:inline-flex"
                icon={<Copy className="w-3 h-3" />}
            >
                Copy Tree
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          <div className="w-full md:w-1/3 bg-slate-950/30 border-r border-slate-800 overflow-y-auto custom-scrollbar p-2">
            {data.tree.map((node, i) => (
                <InteractiveNode 
                    key={node.path + i} 
                    node={node} 
                    selectedPath={selectedNode?.fileData?.path || null}
                    onSelect={setSelectedNode}
                    issuesMap={issuesMap}
                />
            ))}
          </div>

          <div className="hidden md:flex md:w-2/3 bg-slate-950 flex-col relative">
            {selectedNode ? (
                <>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            {getFileIcon(selectedNode.name)}
                            <span className="text-sm font-medium text-slate-200">{selectedNode.name}</span>
                        </div>
                        {selectedNode.fileData && (
                            <div className="text-xs text-slate-500 font-mono">
                                {selectedNode.fileData.type.toUpperCase()} • {(selectedNode.fileData.size/1024).toFixed(1)} KB
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                        {selectedNode.fileData ? (
                            <FilePreviewPane 
                                file={selectedNode.fileData} 
                                issues={data.issues.filter(i => i.path === selectedNode.fileData!.path)} 
                                onFetch={() => onFileContentRequest(selectedNode.fileData!)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-2">
                                <FolderOpen className="w-16 h-16 stroke-1" />
                                <p>Folder Selected</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                    <Maximize2 className="w-16 h-16 stroke-1 opacity-20" />
                    <p className="font-medium">Select a file to preview code & security issues</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};