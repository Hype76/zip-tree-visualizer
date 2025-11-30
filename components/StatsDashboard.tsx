import React from 'react';
import { TreeProcessingResult } from '../types';
import { Code, Layers, Activity, Hash, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface StatsDashboardProps {
  data: TreeProcessingResult;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ data }) => {
  // Take top 5 extensions, group rest as "other"
  const topExtensions = data.extensionBreakdown.slice(0, 5);
  const otherExtensions = data.extensionBreakdown.slice(5);
  
  const displayExtensions = [...topExtensions];
  if (otherExtensions.length > 0) {
    const otherCount = otherExtensions.reduce((acc, curr) => acc + curr.count, 0);
    const otherSize = otherExtensions.reduce((acc, curr) => acc + curr.size, 0);
    const otherLines = otherExtensions.reduce((acc, curr) => acc + curr.lines, 0);
    displayExtensions.push({ extension: 'other', count: otherCount, size: otherSize, lines: otherLines });
  }

  const StatCard = ({ label, value, sub, icon: Icon, color, subColor }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-start justify-between hover:border-slate-700 transition-colors">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-slate-100">{value}</h4>
        {sub && <p className={`text-xs mt-1 ${subColor || 'text-slate-400'}`}>{sub}</p>}
      </div>
      <div className={`p-2 rounded-md bg-opacity-10 ${color}`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  const isRisk = data.security.riskScore > 0;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total LOC" 
          value={data.totalLoc.toLocaleString()} 
          sub="Lines of Code"
          icon={Code} 
          color="bg-blue-500 text-blue-500" 
        />
        <StatCard 
          label="Complexity" 
          value={data.complexityScore.toLocaleString()} 
          sub="Est. Control Flow"
          icon={Activity} 
          color="bg-purple-500 text-purple-500" 
        />
        <StatCard 
          label="Security" 
          value={isRisk ? "Risk" : "Clean"} 
          sub={isRisk ? `${data.security.sensitiveFiles.length} Alerts Found` : "No Secrets Found"}
          icon={isRisk ? ShieldAlert : CheckCircle2} 
          color={isRisk ? "bg-red-500 text-red-500" : "bg-emerald-500 text-emerald-500"} 
          subColor={isRisk ? "text-red-400 font-medium" : "text-emerald-400"}
        />
        <StatCard 
          label="Depth" 
          value={data.maxDepth} 
          sub="Max nested levels"
          icon={Layers} 
          color="bg-amber-500 text-amber-500" 
        />
      </div>

      {/* File Type Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">File Type Breakdown</h3>
        </div>
        
        {/* Visual Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex mb-4">
          {displayExtensions.map((ext, i) => {
            const width = (ext.count / data.fileCount) * 100;
            // distinct colors for top items
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-600'];
            return (
              <div 
                key={ext.extension} 
                style={{ width: `${width}%` }} 
                className={`${colors[i % colors.length]} h-full`}
                title={`${ext.extension}: ${ext.count} files`}
              />
            );
          })}
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayExtensions.map((ext, i) => {
             const dotColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500'];
             
             return (
              <div key={ext.extension} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                  <span className="text-sm font-bold text-slate-200 uppercase">.{ext.extension}</span>
                </div>
                <div className="text-xs text-slate-400 pl-4 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="text-slate-300">{ext.count}</span>
                  </div>
                  {ext.lines > 0 && (
                    <div className="flex justify-between">
                      <span>LOC:</span>
                      <span className="text-slate-300">{ext.lines.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};