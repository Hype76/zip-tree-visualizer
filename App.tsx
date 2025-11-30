import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { TreeDisplay } from './components/TreeDisplay';
import { StatsDashboard } from './components/StatsDashboard';
import { SecurityReport } from './components/SecurityReport';
import { processZipFile, formatBytes } from './services/zipProcessor';
import { TreeProcessingResult } from './types';
import { FolderTree, RefreshCw, AlertCircle, PlayCircle } from 'lucide-react';
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

  const loadDemoData = () => {
    setLoading(true);
    setFileName('demo-project-v2.zip');
    
    // Simulate processing delay for effect
    setTimeout(() => {
        const mockResult: TreeProcessingResult = {
            fileCount: 42,
            folderCount: 8,
            totalSize: 1024 * 450, // 450KB
            totalLoc: 1840,
            complexityScore: 320,
            maxDepth: 5,
            extensionBreakdown: [
                { extension: 'ts', count: 18, size: 250000, lines: 1200 },
                { extension: 'tsx', count: 12, size: 150000, lines: 600 },
                { extension: 'json', count: 4, size: 2000, lines: 40 },
                { extension: 'css', count: 2, size: 5000, lines: 0 },
                { extension: 'md', count: 1, size: 1000, lines: 0 },
                { extension: 'env', count: 1, size: 500, lines: 0 },
            ],
            security: {
                riskScore: 25,
                sensitiveFiles: ['.env', 'config/aws_keys.json'],
                keywordMatches: { todos: 14, fixmes: 6, hacks: 3, secrets: 1 }
            },
            structure: [
                { name: '.env', children: undefined },
                { name: 'package.json', children: undefined },
                { name: 'README.md', children: undefined },
                { 
                    name: 'src', 
                    children: [
                        { name: 'index.tsx', children: undefined },
                        { name: 'App.tsx', children: undefined },
                        { 
                            name: 'components', 
                            children: [
                                { name: 'Header.tsx', children: undefined },
                                { name: 'Button.tsx', children: undefined }
                            ] 
                        },
                        {
                            name: 'utils',
                            children: [
                                { name: 'helpers.ts', children: undefined },
                                { name: 'legacy_hack.ts', children: undefined }
                            ]
                        }
                    ] 
                },
                {
                    name: 'config',
                    children: [
                        { name: 'aws_keys.json', children: undefined }
                    ]
                }
            ],
            treeString: `.\n├── .env\n├── README.md\n├── config/\n│   └── aws_keys.json\n├── package.json\n└── src/\n    ├── App.tsx\n    ├── components/\n    │   ├── Button.tsx\n    │   └── Header.tsx\n    ├── index.tsx\n    └── utils/\n        ├── helpers.ts\n        └── legacy_hack.ts`
        };
        setResult(mockResult);
        setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 no-print">
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
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center gap-6">
               <div className="w-full">
                 <Uploader onFileSelected={handleFileSelected} isLoading={loading} />
               </div>
               
               {/* Demo Button */}
               {!loading && (
                   <button 
                     onClick={loadDemoData}
                     className="group flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors text-sm font-medium px-4 py-2 rounded-full border border-transparent hover:border-blue-500/30 hover:bg-blue-500/10"
                   >
                     <PlayCircle className="w-4 h-4" />
                     Try with sample data (Demo)
                   </button>
               )}

               {error && (
                 <div className="w-full mt-2 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-red-200">
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
              <div className="flex items-center justify-between no-print">
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
              <div className="h-[600px] min-h-[400px] tree-viewport">
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