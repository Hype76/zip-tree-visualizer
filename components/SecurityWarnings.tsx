import React from 'react';
import { SecurityAnalysisResult } from '../types/security';
import { ShieldAlert, AlertOctagon } from 'lucide-react';

export const SecurityWarnings: React.FC<{ result: SecurityAnalysisResult }> = ({ result }) => {
  const highPriority = result.issues.filter(i => i.category === 'danger' || i.category === 'secret');
  const alerts = result.alerts;

  if (highPriority.length === 0 && alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      {alerts.map((alert, i) => (
        <div key={i} className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-amber-400 text-sm font-semibold">Anomaly Detected: {alert.issue}</h4>
            <p className="text-amber-200/70 text-xs">{alert.details}</p>
            <p className="text-amber-500/50 text-[10px] font-mono mt-1">{alert.path}</p>
          </div>
        </div>
      ))}

      {highPriority.slice(0, 5).map((issue, i) => (
         <div key={`iss-${i}`} className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex items-start gap-3">
           <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
           <div>
             <h4 className="text-red-400 text-sm font-semibold">Security Threat: {issue.issue}</h4>
             <p className="text-red-200/70 text-xs font-mono">{issue.path}:{issue.line}</p>
             {issue.context && (
                <div className="mt-1 bg-black/30 p-1 rounded text-[10px] font-mono text-red-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
                    {issue.context}
                </div>
             )}
           </div>
         </div>
      ))}
      
      {highPriority.length > 5 && (
        <div className="text-center text-xs text-red-400 italic">
            + {highPriority.length - 5} more critical issues found. Check full report.
        </div>
      )}
    </div>
  );
};