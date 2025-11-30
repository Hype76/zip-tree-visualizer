import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from './Button';

interface TreeDisplayProps {
  content: string;
}

export const TreeDisplay: React.FC<TreeDisplayProps> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!content) return null;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-400">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Structure Preview</span>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleCopy}
          className="!py-1.5 !px-3 !text-xs"
          icon={copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        >
          {copied ? 'Copied' : 'Copy Structure'}
        </Button>
      </div>
      
      <div className="relative flex-1 overflow-auto custom-scrollbar group">
        <pre className="p-6 font-mono text-sm leading-relaxed text-blue-100/90 whitespace-pre tab-4 select-text selection:bg-blue-500/30">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
};