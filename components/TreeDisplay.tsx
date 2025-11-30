import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, Download, Search, FileJson, Printer, Folder, FolderOpen, FileCode, FileImage, File as FileIcon, Eye, Terminal, Sparkles, ChevronRight, Bot, Maximize2 } from 'lucide-react';
import { Button } from './Button';
import { TreeProcessingResult, TreeNode } from '../types';
import { generateAscii, filterTree, extractFileContent } from '../services/zipProcessor';

interface TreeDisplayProps {
  data: TreeProcessingResult;
  fileName: string;
  sourceFile?: File; // Needed for extraction
}

// --- Icons & UI Helpers ---

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': case 'js': case 'jsx': case 'json': case 'html': case 'css':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'png': case 'jpg': case 'jpeg': case 'svg': case 'gif':
      return <FileImage className="w-4 h-4 text-purple-400" />;
    case 'md': case 'txt': case 'env':
      return <FileText className="w-4 h-4 text-slate-400" />;
    default:
      return <FileIcon className="w-4 h-4 text-slate-500" />;
  }
};

const SyntaxHighlight = ({ content, ext }: { content: string, ext: string }) => {
  // Ultra-lightweight syntax highlighter to avoid huge dependencies
  // Just colors keywords and strings
  const lines = content.split('\n');
  
  return (
    <div className="font-mono text-xs md:text-sm leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} className="table-row">
            <span className="table-cell text-slate-600 select-none pr-4 text-right w-8">{i + 1}</span>
            <span className="table-cell whitespace-pre-wrap break-all">
                {line.split(/(\/\/.*$|'.*?'|".*?"|\b(?:import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type)\b)/g).map((part, j) => {
                    if (part.startsWith('//')) return <span key={j} className="text-slate-500 italic">{part}</span>;
                    if (part.startsWith("'") || part.startsWith('"')) return <span key={j} className="text-amber-300">{part}</span>;
                    if (/^(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type)$/.test(part)) 
                        return <span key={j} className="text-purple-400 font-semibold">{part}</span>;
                    return <span key={j} className="text-slate-300">{part}</span>;
                })}
            </span>
        </div>
      ))}
    </div>
  );
};

// --- Interactive Tree Node ---

const InteractiveNode: React.FC<{ 
    node: TreeNode; 
    depth?: number; 
    defaultOpen?: boolean;
    selectedPath: string | null;
    onSelect: (node: TreeNode) => void;
}> = ({ node, depth = 0, defaultOpen = false, selectedPath, onSelect }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  // Auto-expand if searching
  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all border border-transparent
          ${isSelected ? 'bg-blue-600/20 border-blue-500/30 text-blue-200' : 'hover:bg-slate-800/50 text-slate-400'}
        `}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
            if (hasChildren) setIsOpen(!isOpen);
        }}
      >
        <span className="opacity-70">
          {hasChildren ? (
            isOpen ? <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-amber-400'}`} /> : <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-amber-500'}`} />
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        <span className={`text-sm font-mono truncate ${hasChildren ? 'font-medium' : ''} ${isSelected ? 'text-white' : ''}`}>
          {node.name}
        </span>
      </div>
      
      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child, i) => (
            <InteractiveNode 
                key={`${child.path}-${i}`} 
                node={child} 
                depth={depth + 1} 
                defaultOpen={defaultOpen} 
                selectedPath={selectedPath}
                onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

type AIFormat = 'gemini' | 'chatgpt' | 'claude';

export const TreeDisplay: React.FC<TreeDisplayProps> = ({ data, fileName, sourceFile }) => {
  const [copied, setCopied] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection & Preview State
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  
  // AI Prompt State
  const [aiFormat, setAiFormat] = useState<AIFormat>('gemini');
  const [showAiMenu, setShowAiMenu] = useState(false);

  // Computed states
  const filteredRoot = searchTerm.trim() ? filterTree(data.structure, searchTerm) : data.structure;
  
  // Load file content when selection changes
  useEffect(() => {
    const loadContent = async () => {
        if (!selectedNode || !selectedNode.path || !!selectedNode.children) {
            setFileContent(null);
            return;
        }

        if (!sourceFile) {
            setFileContent("Preview not available (Source file missing).");
            return;
        }

        setLoadingContent(true);
        const content = await extractFileContent(sourceFile, selectedNode.path);
        setFileContent(content);
        setLoadingContent(false);
    };
    loadContent();
  }, [selectedNode, sourceFile]);

  // Generate ASCII for the CURRENT context (Full tree or Subtree)
  const getContextAscii = () => {
    if (!selectedNode) return `.\n${generateAscii(data.structure)}`;
    
    // If a file is selected, show its parent folder context
    if (!selectedNode.children) return `.\n${generateAscii(data.structure)}`;

    // If folder selected, show subtree
    return `./${selectedNode.name}\n${generateAscii(selectedNode.children || [])}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getContextAscii());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyForAI = async () => {
    const tree = getContextAscii();
    const contextName = selectedNode ? (selectedNode.children ? `folder "${selectedNode.name}"` : `file "${selectedNode.name}"`) : `project "${fileName}"`;
    
    let prompt = "";

    if (aiFormat === 'claude') {
        prompt = `<context>\nI am working on the ${contextName}. Here is the file structure:\n\n<file_tree>\n${tree}\n</file_tree>\n</context>\n\nPlease analyze this architecture.`;
    } else if (aiFormat === 'chatgpt') {
        prompt = `I am working on a coding project. Here is the structure for ${contextName}:\n\n\`\`\`\n${tree}\n\`\`\`\n\nPlease provide an overview of this structure.`;
    } else {
        // Gemini / Standard
        prompt = `Analyze this file structure for ${contextName}:\n\n${tree}`;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setAiCopied(true);
      setTimeout(() => setAiCopied(false), 2000);
      setShowAiMenu(false);
    } catch (err) {
      console.error('Failed to copy AI prompt: ', err);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([getContextAscii()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}_structure.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!data) return null;

  return (
    <div className="w-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden h-[600px] tree-content">
      
      {/* --- Toolbar --- */}
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
                    <span 
                        className={i === arr.length - 1 ? 'font-bold text-blue-400' : ''}
                    >
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
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-md py-1.5 pl-8 pr-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
                />
            </div>
            
            {/* AI Copy Split Button */}
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

                {/* Dropdown */}
                {showAiMenu && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-50 py-1">
                        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Select Target AI</div>
                        {[
                            { id: 'gemini', label: 'Gemini / Generic', desc: 'Standard Text' },
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
                onClick={handleDownloadTxt}
                className="!py-1.5 !px-3 !text-xs hidden sm:inline-flex"
                icon={<Download className="w-3 h-3" />}
            >
                TXT
            </Button>
            <Button 
                variant="secondary" 
                onClick={handleCopy}
                className="!py-1.5 !px-3 !text-xs"
                icon={copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            >
                {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* --- Split View Content --- */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Tree View */}
          <div className="w-full md:w-1/3 bg-slate-950/30 border-r border-slate-800 overflow-y-auto custom-scrollbar p-2">
            {filteredRoot.map((node, i) => (
                <InteractiveNode 
                    key={`${node.path}-${i}`} 
                    node={node} 
                    defaultOpen={!!searchTerm.trim()} 
                    selectedPath={selectedNode?.path || null}
                    onSelect={setSelectedNode}
                />
            ))}
             {filteredRoot.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    No matching files
                </div>
            )}
          </div>

          {/* Right: Preview Pane */}
          <div className="hidden md:flex md:w-2/3 bg-slate-950 flex-col">
            {selectedNode ? (
                <>
                    {/* Preview Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            {getFileIcon(selectedNode.name)}
                            <span className="text-sm font-medium text-slate-200">{selectedNode.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            {selectedNode.children ? 'Folder' : selectedNode.path}
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-4 relative">
                        {loadingContent ? (
                            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-transparent"></span>
                                Loading preview...
                            </div>
                        ) : selectedNode.children ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 opacity-50">
                                <FolderOpen className="w-16 h-16 stroke-1" />
                                <p>Select a file to view contents</p>
                                <div className="text-xs border border-slate-700 rounded px-2 py-1 bg-slate-900">
                                    Contains {selectedNode.children.length} items
                                </div>
                            </div>
                        ) : (
                            fileContent ? (
                                <SyntaxHighlight content={fileContent} ext={selectedNode.name.split('.').pop() || ''} />
                            ) : (
                                <div className="text-center text-slate-500 mt-20">Unable to load content</div>
                            )
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                    <Maximize2 className="w-16 h-16 stroke-1 opacity-20" />
                    <p className="font-medium">Select a file to preview</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};