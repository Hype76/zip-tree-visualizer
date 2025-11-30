import React, { useState } from 'react';
import { Github, Loader2, Key } from 'lucide-react';
import { Button } from './Button';

interface GitHubInputProps {
  onAnalyze: (url: string, token?: string) => void;
  isLoading: boolean;
}

export const GitHubInput: React.FC<GitHubInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim(), token.trim() || undefined);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-800 rounded-lg">
           <Github className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Inspect Repository</h3>
          <p className="text-sm text-slate-500">Fetch and analyze code directly from GitHub</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Repository URL
          </label>
          <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            required
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600"
          />
        </div>

        <div>
          <button 
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 mb-2"
          >
            <Key className="w-3 h-3" />
            {showToken ? 'Hide Access Token' : 'Add Access Token (Optional)'}
          </button>
          
          {showToken && (
            <div className="animate-in slide-in-from-top-2 duration-300">
                <input 
                    type="password" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx (Increases rate limits)"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                    Required for private repos or large scans. Token is only used locally.
                </p>
            </div>
          )}
        </div>

        <Button 
            disabled={isLoading || !url} 
            className="w-full py-3"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Repo...
                </>
            ) : (
                'Load Repository'
            )}
        </Button>
      </form>
    </div>
  );
};