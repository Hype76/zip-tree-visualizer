import React, { useState } from 'react';
import { SecurityAudit } from '../types';
import { AlertTriangle, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, FileWarning } from 'lucide-react';

interface SecurityReportProps {
  security: SecurityAudit;
}

export const SecurityReport: React.FC<SecurityReportProps> = ({ security }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isHighRisk = security.riskScore > 0;
  
  if (!isHighRisk && security.keywordMatches.todos === 0) return null;

  return (
    <div className={`rounded-lg border overflow-hidden transition-colors ${
      isHighRisk ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900 border-slate-800'
    }`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isHighRisk ? (
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
          ) : (
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
          
          <div>
            <h3 className={`font-semibold ${isHighRisk ? 'text-red-400' : 'text-slate-200'}`}>
              {isHighRisk ? 'Security Risks Detected' : 'Code Quality Notices'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Found {security.sensitiveFiles.length} sensitive files and {security.keywordMatches.todos} TODOs
            </p>
          </div>
        </div>
        
        <button className="text-slate-500">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-800/50 mt-2">
          
          {/* Sensitive Files List */}
          {security.sensitiveFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Sensitive Files (Review Immediately)
              </h4>
              <ul className="space-y-1">
                {security.sensitiveFiles.map((file, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-200/80 bg-red-950/40 px-3 py-1.5 rounded border border-red-900/30 font-mono">
                    <FileWarning className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{file}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keyword Matches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
             <KeywordBadge label="TODOs" count={security.keywordMatches.todos} color="text-amber-400 bg-amber-950/30 border-amber-900/50" />
             <KeywordBadge label="FIXMEs" count={security.keywordMatches.fixmes} color="text-orange-400 bg-orange-950/30 border-orange-900/50" />
             <KeywordBadge label="Hacks" count={security.keywordMatches.hacks} color="text-pink-400 bg-pink-950/30 border-pink-900/50" />
             <KeywordBadge label="Secrets?" count={security.keywordMatches.secrets} color="text-red-400 bg-red-950/30 border-red-900/50" />
          </div>
        </div>
      )}
    </div>
  );
};

const KeywordBadge = ({ label, count, color }: { label: string, count: number, color: string }) => (
  <div className={`flex flex-col items-center justify-center p-2 rounded border ${color}`}>
    <span className="text-xl font-bold">{count}</span>
    <span className="text-[10px] uppercase font-medium opacity-80">{label}</span>
  </div>
);