import React from 'react';
import { SecurityAnalysisResult } from '../types/security';
import { ShieldCheck, ShieldAlert, Activity, Layers, Code, Hash, Download, Info } from 'lucide-react';
import { Button } from './Button';
import { generateJSONReport, generatePDFReport, generateTextReport } from '../services/reportGenerator';

export const SecurityDashboard: React.FC<{ data: SecurityAnalysisResult }> = ({ data }) => {
  const { score, stats } = data;
  
  // Prepare Extension Data for Bar Chart
  const extensions = Object.entries(stats.extensions)
    .map(([ext, count]) => ({ ext, count }))
    .sort((a, b) => b.count - a.count);
  
  const topExtensions = extensions.slice(0, 5);
  const otherCount = extensions.slice(5).reduce((acc, curr) => acc + curr.count, 0);
  
  const displayExtensions = [...topExtensions];
  if (otherCount > 0) displayExtensions.push({ ext: 'other', count: otherCount });

  const ScoreCard = () => {
      let color = "text-emerald-500";
      let bg = "bg-emerald-500/10";
      if (score.status === 'warning') { color = "text-amber-500"; bg = "bg-amber-500/10"; }
      if (score.status === 'high-risk') { color = "text-red-500"; bg = "bg-red-500/10"; }

      return (
          <div className="group relative bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center justify-between h-full hover:border-slate-700 transition-all cursor-help">
              
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                  <p className="font-semibold text-white mb-1">Health Score (0-100)</p>
                  Calculated by analyzing code quality, dangerous patterns (eval), hardcoded secrets, and file structure anomalies.
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-700"></div>
              </div>

              <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Security Score <Info className="w-3 h-3 text-slate-600" />
                  </h3>
                  <div className={`text-5xl font-bold mt-2 ${color}`}>{score.score}</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded mt-3 inline-block ${bg} ${color}`}>
                      {score.status.toUpperCase()}
                  </div>
              </div>
              <div className={`p-4 rounded-full ${bg} shadow-lg`}>
                  {score.status === 'clean' ? <ShieldCheck className={`w-10 h-10 ${color}`} /> : <ShieldAlert className={`w-10 h-10 ${color}`} />}
              </div>
          </div>
      );
  };

  const StatTile = ({ label, value, sub, icon: Icon, color, tooltip }: any) => (
      <div className="group relative bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-all cursor-help">
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-700"></div>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-md bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
               <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {sub && <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{sub}</span>}
          </div>
          <div>
              <div className="text-2xl font-bold text-slate-200">{value}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold mt-1 flex items-center gap-1">
                {label} <Info className="w-3 h-3 text-slate-700" />
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Score takes up 1 column on large screens */}
            <div className="lg:col-span-1">
                <ScoreCard />
            </div>

            {/* Stats take up 3 columns */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatTile 
                    label="Lines of Code" 
                    value={stats.totalLoc.toLocaleString()} 
                    icon={Code} 
                    color="text-blue-500" 
                    tooltip="Total number of code lines across all text files. A rough indicator of project size and scale."
                />
                <StatTile 
                    label="Complexity" 
                    value={stats.complexity.toLocaleString()} 
                    sub="EST. FLOW"
                    icon={Activity} 
                    color="text-purple-500" 
                    tooltip="Cyclomatic Complexity estimate. Based on the number of 'if', 'for', 'while' loops. Higher numbers indicate code that is harder to test and maintain."
                />
                <StatTile 
                    label="Max Depth" 
                    value={stats.maxDepth} 
                    icon={Layers} 
                    color="text-amber-500" 
                    tooltip="The deepest level of nested folders. High depth (8+) often indicates over-engineered or confusing file structures."
                />
                 <StatTile 
                    label="Secrets Found" 
                    value={score.summaryCounts.secrets} 
                    icon={ShieldAlert} 
                    color="text-red-500" 
                    tooltip="Potential hardcoded secrets detected (API Keys, Private Keys, Tokens). These should never be committed to code."
                />
            </div>
        </div>

        {/* File Type Distribution Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">File Breakdown</h3>
            <span className="text-xs text-slate-500 ml-auto">{stats.totalFiles} files total</span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex mb-4">
            {displayExtensions.map((item, i) => {
                const width = (item.count / stats.totalFiles) * 100;
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-600'];
                return (
                <div 
                    key={item.ext} 
                    style={{ width: `${width}%` }} 
                    className={`${colors[i % colors.length]} h-full border-r border-slate-900/20`}
                    title={`${item.ext}: ${item.count} files`}
                />
                );
            })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4">
            {displayExtensions.map((item, i) => {
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500'];
                return (
                <div key={item.ext} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                    <span className="text-xs font-bold text-slate-300 uppercase">.{item.ext}</span>
                    <span className="text-xs text-slate-500">({item.count})</span>
                </div>
                );
            })}
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800/50">
            <div className="flex gap-2">
                <Button onClick={() => generatePDFReport(data)} variant="secondary" icon={<Download className="w-4 h-4"/>}>PDF Report</Button>
                <Button onClick={() => generateTextReport(data)} variant="secondary">TXT Report</Button>
                <Button onClick={() => generateJSONReport(data)} variant="secondary">JSON Dump</Button>
            </div>
        </div>
    </div>
  );
};