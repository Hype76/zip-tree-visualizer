import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { SecurityDashboard } from './components/SecurityDashboard';
import { VisualTree } from './components/VisualTree';
import { SecurityWarnings } from './components/SecurityWarnings';
import { analyzeZip, analyzeGitHub } from './services/securityEngine';
import { fetchSingleFileContent } from './services/githubFetcher';
import { SecurityAnalysisResult, UnifiedFile } from './types/security';
import { FolderTree, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './components/Button';
import { ModeToggle } from './components/ModeToggle';
import { GitHubInput } from './components/GitHubInput';

const App: React.FC = () => {
  const [mode, setMode] = useState<'zip' | 'github'>('zip');
  const [result, setResult] = useState<SecurityAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  
  // State for GitHub Token (to persist for lazy loading)
  const [ghToken, setGhToken] = useState<string | undefined>(undefined);

  const handleZipSelected = async (selectedFile: File) => {
    setLoading(true);
    setLoadingMsg("Unpacking and analyzing ZIP...");
    setError(null);
    setResult(null);

    setTimeout(async () => {
      try {
        const data = await analyzeZip(selectedFile);
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Analysis failed. File may be corrupted or encrypted.');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleGitHubAnalyze = async (url: string, token?: string) => {
    setLoading(true);
    setLoadingMsg("Connecting to GitHub API...");
    setError(null);
    setResult(null);
    setGhToken(token);

    try {
      const data = await analyzeGitHub(url, token, (msg) => setLoadingMsg(msg));
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'GitHub Analysis failed. Check URL or Rate Limits.');
    } finally {
      setLoading(false);
    }
  };

  const handleLazyLoadContent = async (file: UnifiedFile) => {
    if (!result || !file.contentUrl) return;

    // Mutate the result state to update the specific file
    // In a real app we might use deep cloning, but for performance with large trees we mutate
    try {
        const content = await fetchSingleFileContent(file.contentUrl, ghToken);
        file.content = content;
        
        // Force re-render
        setResult({ ...result });
    } catch (e) {
        console.error("Lazy load failed", e);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 pb-20">
      
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
              <FolderTree className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">
              ZipTree <span className="text-indigo-400">Forensics</span>
            </h1>
          </div>
          <div className="text-xs font-medium text-slate-500 hidden sm:block">
            Client-Side Code Auditor v2.2
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Intro */}
        {!result && !loading && (
          <div className="text-center mb-8 mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Deep Scan Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Project Architecture</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Visualize structure, validate file signatures, and detect security risks in ZIP archives or GitHub repositories.
            </p>
          </div>
        )}

        {/* Input Mode Selector */}
        {!result && !loading && (
            <div className="animate-in fade-in zoom-in-95 duration-500 delay-150">
                <ModeToggle mode={mode} setMode={setMode} />
                
                <div className="max-w-2xl mx-auto">
                    {mode === 'zip' ? (
                        <Uploader onFileSelected={handleZipSelected} isLoading={loading} />
                    ) : (
                        <GitHubInput onAnalyze={handleGitHubAnalyze} isLoading={loading} />
                    )}

                    {error && (
                        <div className="w-full mt-4 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-red-200">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                            <h4 className="font-medium text-red-400">Scan Failed</h4>
                            <p className="text-sm opacity-80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex flex-col items-center justify-center mt-20 space-y-6">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-white">{loadingMsg}</h3>
                    <p className="text-slate-500">Parsing structure and running heuristics.</p>
                </div>
            </div>
        )}

        {/* Results View */}
        {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
                        <p className="text-slate-500 text-sm">Source: {result.sourceType === 'zip' ? 'Local ZIP Archive' : 'GitHub Repository'}</p>
                    </div>
                    <Button onClick={handleReset} variant="danger" icon={<RefreshCw className="w-4 h-4"/>}>New Scan</Button>
                </div>

                {/* Dashboard Stats */}
                <SecurityDashboard data={result} />

                {/* Critical Warnings */}
                <SecurityWarnings result={result} />

                {/* Main Visualizer */}
                <VisualTree data={result} onFileContentRequest={handleLazyLoadContent} />

            </div>
        )}

      </main>
    </div>
  );
};

export default App;