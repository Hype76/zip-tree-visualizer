import React from 'react';
import { UnifiedFile, SecurityIssue } from '../types/security';
import { AlertTriangle } from 'lucide-react';

interface FilePreviewProps {
  file: UnifiedFile;
  issues: SecurityIssue[];
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, issues }) => {
  
  // 1. Image Preview
  if (file.type === 'image' && file.binary) {
    const blob = new Blob([file.binary], { type: `image/${file.extension}` });
    const url = URL.createObjectURL(blob);
    
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="border border-slate-700 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] p-2 rounded shadow-xl">
                <img src={url} alt={file.name} className="max-w-full max-h-[400px] object-contain" />
            </div>
            <p className="mt-4 text-slate-500 font-mono text-xs">{file.name} - {(file.size/1024).toFixed(2)} KB</p>
        </div>
    );
  }

  // 2. Binary Preview (Hex Dump)
  if (file.type === 'binary' || (file.type === 'unknown' && !file.content)) {
    const hexDump = file.binary 
        ? Array.from(file.binary.slice(0, 256)) // Show first 256 bytes
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ') 
        : "Binary content not loaded.";
        
    return (
        <div className="p-4 font-mono text-xs text-slate-400">
            <div className="bg-slate-900 p-4 rounded border border-slate-800 overflow-x-auto">
                <h4 className="text-slate-500 mb-2 uppercase tracking-wider">Hex Preview (First 256 Bytes)</h4>
                <div className="grid grid-cols-[auto_1fr] gap-4">
                    <div className="text-slate-600 select-none">
                        {Array.from({length: 16}).map((_, i) => (
                            <div key={i}>{(i * 16).toString(16).padStart(4, '0').toUpperCase()}</div>
                        ))}
                    </div>
                    <div className="whitespace-pre-wrap break-all w-full leading-relaxed">
                        {hexDump}
                    </div>
                </div>
            </div>
            <p className="mt-4 text-center text-slate-600">Binary File - View Restricted</p>
        </div>
    );
  }

  // 3. Text Preview with Security Markers
  if (file.content !== undefined) {
    const lines = file.content.split('\n');
    
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
                        <span className="table-cell text-slate-600 select-none pr-4 text-right w-10 align-top py-0.5">{lineNum}</span>
                        
                        {/* Code Content */}
                        <span className="table-cell whitespace-pre-wrap break-all py-0.5">
                            {/* Basic Syntax Highlighting */}
                            {line.split(/(\/\/.*$|'.*?'|".*?"|\b(?:import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type)\b)/g).map((part, j) => {
                                if (part.startsWith('//')) return <span key={j} className="text-slate-500 italic">{part}</span>;
                                if (part.startsWith("'") || part.startsWith('"')) return <span key={j} className="text-amber-300">{part}</span>;
                                if (/^(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type)$/.test(part)) 
                                    return <span key={j} className="text-purple-400 font-semibold">{part}</span>;
                                return <span key={j} className="text-slate-300">{part}</span>;
                            })}
                        </span>

                        {/* Issue Marker */}
                        {hasIssue && (
                            <div className="absolute right-0 top-0 bottom-0 pr-2 flex items-center">
                                <div className="group/tooltip relative">
                                    <AlertTriangle className={`w-4 h-4 ${maxSeverity === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                                    <div className="hidden group-hover/tooltip:block absolute right-6 top-0 w-64 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl z-50 text-xs">
                                        {lineIssues.map((issue, k) => (
                                            <div key={k} className={`mb-1 last:mb-0 ${issue.category === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                                                <span className="font-bold uppercase text-[10px]">{issue.category}:</span> {issue.issue}
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
  }

  return <div className="p-8 text-center text-slate-500">Preview Unavailable</div>;
};
