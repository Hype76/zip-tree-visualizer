import React from 'react';
import { SecurityAnalysisResult } from '../types/security';
import { ShieldCheck, ShieldAlert, FileText, Activity, Download } from 'lucide-react';
import { Button } from './Button';
import { generateJSONReport, generatePDFReport, generateTextReport } from '../services/reportGenerator';
import { AiPromptButton } from './AiPromptButton';

export const SecurityDashboard: React.FC<{ data: SecurityAnalysisResult }> = ({ data }) => {
  const { score, stats } = data;
  
  const ScoreCard = () => {
      let color = "text-emerald-500";
      let bg = "bg-emerald-500/10";
      if (score.status === 'warning') { color = "text-amber-500"; bg = "bg-amber-500/10"; }
      if (score.status === 'high-risk') { color = "text-red-500"; bg = "bg-red-500/10"; }

      return (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex items-center justify-between">
              <div>
                  <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Security Score</h3>
                  <div className={`text-4xl font-bold mt-2 ${color}`}>{score.score}/100</div>
                  <div className={`text-xs font-medium px-2 py-1 rounded mt-2 inline-block ${bg} ${color}`}>
                      {score.status.toUpperCase()}
                  </div>
              </div>
              <div className={`p-4 rounded-full ${bg}`}>
                  {score.status === 'clean' ? <ShieldCheck className={`w-8 h-8 ${color}`} /> : <ShieldAlert className={`w-8 h-8 ${color}`} />}
              </div>
          </div>
      );
  };

  const StatTile = ({ label, value, icon: Icon }: any) => (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-lg text-slate-400">
              <Icon className="w-5 h-5" />
          </div>
          <div>
              <div className="text-2xl font-bold text-slate-200">{value}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold">{label}</div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
        {/* Top Row: Score & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <ScoreCard />
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <StatTile label="Total LOC" value={stats.totalLoc.toLocaleString()} icon={FileText} />
                <StatTile label="Files" value={stats.totalFiles} icon={Activity} />
                <StatTile label="Secrets Found" value={score.summaryCounts.secrets} icon={ShieldAlert} />
                <StatTile label="Dangerous Calls" value={score.summaryCounts.dangerous} icon={Activity} />
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800/50">
            <div className="flex gap-2">
                <Button onClick={() => generatePDFReport(data)} variant="secondary" icon={<Download className="w-4 h-4"/>}>PDF Report</Button>
                <Button onClick={() => generateTextReport(data)} variant="secondary">TXT</Button>
                <Button onClick={() => generateJSONReport(data)} variant="secondary">JSON</Button>
            </div>
            <AiPromptButton result={data} />
        </div>
    </div>
  );
};
