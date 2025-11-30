import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, Download, Search, FileJson, Printer, Folder, FolderOpen, FileCode, FileImage, File as FileIcon, Eye, Terminal, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { TreeProcessingResult, TreeNode } from '../types';
import { generateAscii, filterTree } from '../services/zipProcessor';

interface TreeDisplayProps {
  data: TreeProcessingResult;
  fileName: string;
}

// Helper to get icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'json':
    case 'html':
    case 'css':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
      return <FileImage className="w-4 h-4 text-purple-400" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-slate-400" />;
    default:
      return <FileIcon className="w-4 h-4 text-slate-500" />;
  }
};

const InteractiveNode: React.FC<{ node: TreeNode; depth?: number; defaultOpen?: boolean }> = ({ node, depth = 0, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = node.children && node.children.length > 0;

  // Auto-expand if search is active (defaultOpen passed as true)
  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-colors
          hover:bg-slate-800/50 text-sm font-mono
        `}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <span className="opacity-70">
          {hasChildren ? (
            isOpen ? <FolderOpen className="w-4 h-4 text-amber-400" /> : <Folder className="w-4 h-4 text-amber-500" />
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        <span className={`${hasChildren ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
          {node.name}
        </span>
      </div>
      
      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child, i) => (
            <InteractiveNode key={`${child.name}-${i}`} node={child} depth={depth + 1} defaultOpen={defaultOpen} />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeDisplay: React.FC<TreeDisplayProps> = ({ data, fileName }) => {
  const [copied, setCopied] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'ascii'>('visual');
  
  // Computed states
  const filteredRoot = searchTerm.trim() ? filterTree(data.structure, searchTerm) : data.structure;
  const displayAscii = searchTerm.trim() 
    ? `.\n${generateAscii(filteredRoot)}` 
    : data.treeString;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayAscii);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyForAI = async () => {
    try {
      const prompt = `I am working on a project with the following file structure. Please analyze the architecture based on these file names and paths:\n\nProject: ${fileName}\n\n${displayAscii}`;
      await navigator.clipboard.writeText(prompt);
      setAiCopied(true);
      setTimeout(() => setAiCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy AI prompt: ', err);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([displayAscii], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}_structure.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const { treeString, structure, ...metrics } = data;
    const exportData = {
        fileName,
        generatedAt: new Date().toISOString(),
        metrics,
    };
    const file = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}_audit.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!data) return null;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden tree-content">
      
      {/* Header / Toolbar */}
      <div className="flex flex-col gap-4 px-4 py-3 bg-slate-800/50 border-b border-slate-800 no-print">
        
        {/* Top Row: Title + View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                <button 
                    onClick={() => setViewMode('visual')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'visual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Eye className="w-3.5 h-3.5" />
                    Visual Tree
                </button>
                <button 
                    onClick={() => setViewMode('ascii')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'ascii' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Terminal className="w-3.5 h-3.5" />
                    ASCII / Text
                </button>
            </div>
          </div>

          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md py-1.5 pl-9 pr-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/50">
            <Button 
                variant="primary" 
                onClick={handleCopyForAI}
                className="!py-1.5 !px-3 !text-xs !bg-indigo-600 hover:!bg-indigo-500 !border-indigo-500"
                icon={aiCopied ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            >
                {aiCopied ? 'Copied Context' : 'Copy for AI Prompt'}
            </Button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden md:block"></div>

            <Button 
                variant="secondary" 
                onClick={handlePrint}
                className="!py-1.5 !px-3 !text-xs hidden md:inline-flex"
                icon={<Printer className="w-3 h-3" />}
            >
                PDF
            </Button>
            <Button 
                variant="secondary" 
                onClick={handleDownloadJson}
                className="!py-1.5 !px-3 !text-xs hidden md:inline-flex"
                icon={<FileJson className="w-3 h-3" />}
            >
                JSON
            </Button>
            <Button 
                variant="secondary" 
                onClick={handleDownloadTxt}
                className="!py-1.5 !px-3 !text-xs"
                icon={<Download className="w-3 h-3" />}
            >
                .TXT
            </Button>
            <Button 
                variant="secondary" 
                onClick={handleCopy}
                className="!py-1.5 !px-3 !text-xs"
                icon={copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            >
                {copied ? 'Copied' : 'Copy Text'}
            </Button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="relative flex-1 overflow-auto custom-scrollbar group bg-slate-950/30 tree-scroll-area">
        {viewMode === 'ascii' ? (
             <pre className="p-6 font-mono text-sm leading-relaxed text-blue-100/90 whitespace-pre tab-4 select-text selection:bg-blue-500/30">
                <code>{displayAscii}</code>
            </pre>
        ) : (
            <div className="p-4 min-w-[300px]">
                {filteredRoot.map((node, i) => (
                    <InteractiveNode 
                        key={`${node.name}-${i}`} 
                        node={node} 
                        // If searching, default to open so users see the results
                        defaultOpen={!!searchTerm.trim()} 
                    />
                ))}
                {filteredRoot.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <p>No files matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};