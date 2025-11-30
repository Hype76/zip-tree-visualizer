import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, Download, Search, FileJson, Printer } from 'lucide-react';
import { Button } from './Button';
import { TreeProcessingResult } from '../types';
import { generateAscii, filterTree } from '../services/zipProcessor';

interface TreeDisplayProps {
  data: TreeProcessingResult;
  fileName: string;
}

export const TreeDisplay: React.FC<TreeDisplayProps> = ({ data, fileName }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayContent, setDisplayContent] = useState(data.treeString);

  // Update display when search or data changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setDisplayContent(data.treeString);
      return;
    }
    const filteredRoot = filterTree(data.structure, searchTerm);
    const filteredString = `.\n${generateAscii(filteredRoot)}`;
    setDisplayContent(filteredString);
  }, [searchTerm, data]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([displayContent], {type: 'text/plain'});
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
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800 gap-3 no-print">
        
        {/* Left: Label + Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Tree View</span>
          </div>
          
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter files..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md py-1.5 pl-9 pr-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2 shrink-0">
            <Button 
                variant="secondary" 
                onClick={handlePrint}
                className="!py-1.5 !px-3 !text-xs hidden md:inline-flex"
                icon={<Printer className="w-3 h-3" />}
            >
                PDF / Print
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
                {copied ? 'Copied' : 'Copy'}
            </Button>
        </div>
      </div>
      
      <div className="relative flex-1 overflow-auto custom-scrollbar group bg-slate-950/30 tree-scroll-area">
        <pre className="p-6 font-mono text-sm leading-relaxed text-blue-100/90 whitespace-pre tab-4 select-text selection:bg-blue-500/30">
          <code>{displayContent}</code>
        </pre>
      </div>
    </div>
  );
};