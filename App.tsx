import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { TreeDisplay } from './components/TreeDisplay';
import { StatsDashboard } from './components/StatsDashboard';
import { SecurityReport } from './components/SecurityReport';
import { processZipFile, formatBytes } from './services/zipProcessor';
import { TreeProcessingResult } from './types';
import { FolderTree, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [result, setResult] = useState<TreeProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelected = async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setResult(null);

    // Small timeout to allow UI to update to loading state before heavy JS runs
    setTimeout(async () => {
      try {
        const data = await processZipFile(file);
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    setFileName('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <FolderTree className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">
              ZipTree <span className="text-blue-500">Analytics</span>
            </h1>
          </div>
          <div className="text-xs font-medium text-slate-500 hidden sm:block">
            Client-Side Code Auditor v2.0
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        
        {/* Intro / Hero */}
        {!result && !loading && !error && (
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Visualize ZIP Structure & <br className="hidden md:block" />
              <span className="text-blue-500">Code Complexity</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Upload a ZIP archive to instantly generate a copy-ready tree, 
              count lines of code (LOC), and audit project security.
            </p>
          </div>
        )}

        {/* Interaction Zone */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* File Input */}
          {!result && (
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
               <Uploader onFileSelected={handleFileSelected} isLoading={loading} />
               {error && (
                 <div className="mt-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-red-200">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-400">Processing Failed</h4>
                      <p className="text-sm opacity-80 mt-1">{error}</p>
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="flex flex-col animate-in fade-in zoom-in-95 duration-300 gap-6">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white truncate max-w-md">{fileName}</h3>
                  <p className="text-sm text-slate-500">Processed in Browser • {formatBytes(result.totalSize)}</p>
                </div>
                <Button onClick={handleReset} variant="danger" icon={<RefreshCw className="w-4 h-4" />}>
                  Analyze Another
                </Button>
              </div>

              {/* Stats Dashboard */}
              <StatsDashboard data={result} />

              {/* Security Report (Collapsible) */}
              <SecurityReport security={result.security} />

              {/* Editor View with Search */}
              <div className="h-[600px] min-h-[400px]">
                <TreeDisplay data={result} fileName={fileName} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;