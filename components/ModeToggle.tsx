import React from 'react';
import { UploadCloud, Github } from 'lucide-react';

interface ModeToggleProps {
  mode: 'zip' | 'github';
  setMode: (mode: 'zip' | 'github') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, setMode }) => {
  return (
    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit mx-auto mb-8">
      <button
        onClick={() => setMode('zip')}
        className={`
          flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all
          ${mode === 'zip' 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }
        `}
      >
        <UploadCloud className="w-4 h-4" />
        ZIP Archive
      </button>
      <button
        onClick={() => setMode('github')}
        className={`
          flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all
          ${mode === 'github' 
            ? 'bg-slate-700 text-white shadow-lg' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }
        `}
      >
        <Github className="w-4 h-4" />
        GitHub Repo
      </button>
    </div>
  );
};