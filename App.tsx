import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { SecurityDashboard } from './components/SecurityDashboard';
import { VisualTree } from './components/VisualTree';
import { SecurityWarnings } from './components/SecurityWarnings';
import { analyzeSecurity } from './services/securityEngine';
import { SecurityAnalysisResult } from './types/security';
import { FolderTree, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [result, setResult] = useState<SecurityAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Small delay to allow UI to render loading state
    setTimeout(async () => {
      try {
        const data = await analyzeSecurity(selectedFile);
        setResult(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Analysis failed. File may be corrupted or encrypted.');
      } finally {
        setLoading(false);
      }
    }, 100);
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
            Client-Side Code Auditor v2.1
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Intro */}
        {!result && !loading && (
          <div className="text-center mb-12 mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Deep Scan Your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Project Architecture</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Upload a ZIP to generate an interactive map, validate file signatures, 
              detect secrets, and produce an AI-ready security report.
            </p>
          </div>
        )}

        {/* Uploader */}
        {!result && !loading && (
           <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500 delay-150">
             <Uploader onFileSelected={handleFileSelected} isLoading={loading} />
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
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex flex-col items-center justify-center mt-20 space-y-6">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-white">Analyzing Structure...</h3>
                    <p className="text-slate-500">Reading binaries, validating signatures, and scanning code.</p>
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
                        <p className="text-slate-500 text-sm">Generated locally in browser</p>
                    </div>
                    <Button onClick={handleReset} variant="danger" icon={<RefreshCw className="w-4 h-4"/>}>New Scan</Button>
                </div>

                {/* Dashboard Stats */}
                <SecurityDashboard data={result} />

                {/* Critical Warnings */}
                <SecurityWarnings result={result} />

                {/* Main Visualizer */}
                <VisualTree data={result} />

            </div>
        )}

      </main>
    </div>
  );
};

export default App;
