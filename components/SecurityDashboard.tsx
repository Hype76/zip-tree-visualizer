import React from 'react';
import { SecurityAnalysisResult } from '../types/security';
import { ShieldCheck, ShieldAlert, Activity, Layers, Code, Hash, Download } from 'lucide-react';
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
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center justify-between h-full hover:border-slate-700 transition-all">
              <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Security Score</h3>
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

  const StatTile = ({ label, value, sub, icon: Icon, color }: any) => (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-md bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
               <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {sub && <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{sub}</span>}
          </div>
          <div>
              <div className="text-2xl font-bold text-slate-200">{value}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold mt-1">{label}</div>
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
                />
                <StatTile 
                    label="Complexity" 
                    value={stats.complexity.toLocaleString()} 
                    sub="EST. FLOW"
                    icon={Activity} 
                    color="text-purple-500" 
                />
                <StatTile 
                    label="Max Depth" 
                    value={stats.maxDepth} 
                    icon={Layers} 
                    color="text-amber-500" 
                />
                 <StatTile 
                    label="Secrets Found" 
                    value={score.summaryCounts.secrets} 
                    icon={ShieldAlert} 
                    color="text-red-500" 
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