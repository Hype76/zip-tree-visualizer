import React, { useState } from 'react';
import { SecurityAnalysisResult, TreeNode, UnifiedFile } from '../types/security';
import { Folder, FileCode, FileImage, File as FileIcon, ChevronRight, Search, ShieldAlert } from 'lucide-react';
import { FilePreview } from './FilePreview';
import { Button } from './Button';

interface VisualTreeProps {
  data: SecurityAnalysisResult;
}

const NodeIcon = ({ node }: { node: TreeNode }) => {
    if (node.type === 'folder') return <Folder className="w-4 h-4 text-amber-500" />;
    
    // Check if file has issues
    // Note: In a real app we would pass this down, here we assume clean unless marked
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts': case 'tsx': case 'js': case 'jsx': return <FileCode className="w-4 h-4 text-blue-400" />;
        case 'png': case 'jpg': return <FileImage className="w-4 h-4 text-purple-400" />;
        default: return <FileIcon className="w-4 h-4 text-slate-500" />;
    }
};

const TreeItem: React.FC<{ 
    node: TreeNode, 
    level: number, 
    selected: UnifiedFile | null, 
    onSelect: (f: UnifiedFile) => void,
    issuesMap: Map<string, number>
}> = ({ node, level, selected, onSelect, issuesMap }) => {
    const [open, setOpen] = useState(false);
    const hasChildren = !!node.children;
    const isSelected = node.fileData && selected?.path === node.fileData.path;
    const issueCount = node.fileData ? (issuesMap.get(node.fileData.path) || 0) : 0;

    return (
        <div>
            <div 
                className={`
                    flex items-center gap-1.5 py-1 px-2 cursor-pointer transition-colors select-none text-sm
                    ${isSelected ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-slate-800 text-slate-400'}
                `}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => {
                    if (hasChildren) setOpen(!open);
                    if (node.fileData) onSelect(node.fileData);
                }}
            >
                {hasChildren && (
                    <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
                )}
                <NodeIcon node={node} />
                <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>{node.name}</span>
                
                {issueCount > 0 && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 rounded-full">
                        {issueCount} <ShieldAlert className="w-3 h-3" />
                    </span>
                )}
            </div>
            {hasChildren && open && node.children?.map((child, i) => (
                <TreeItem 
                    key={child.path + i} 
                    node={child} 
                    level={level + 1} 
                    selected={selected} 
                    onSelect={onSelect}
                    issuesMap={issuesMap}
                />
            ))}
        </div>
    );
};

export const VisualTree: React.FC<VisualTreeProps> = ({ data }) => {
    const [selectedFile, setSelectedFile] = useState<UnifiedFile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pre-calculate issues per file for the tree badges
    const issuesMap = new Map<string, number>();
    data.issues.forEach(i => {
        issuesMap.set(i.path, (issuesMap.get(i.path) || 0) + 1);
    });

    // Helper to copy simple tree
    const handleCopyTree = async () => {
        await navigator.clipboard.writeText(data.asciiTree);
    };

    return (
        <div className="flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="h-12 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 w-1/3">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Filter files..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-600"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleCopyTree} variant="secondary" className="!py-1 !text-xs">Copy Tree</Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Tree */}
                <div className="w-1/3 border-r border-slate-800 overflow-y-auto custom-scrollbar py-2 bg-slate-950/30">
                    {data.tree.map((node, i) => (
                        <TreeItem 
                            key={node.path + i} 
                            node={node} 
                            level={0} 
                            selected={selectedFile} 
                            onSelect={setSelectedFile} 
                            issuesMap={issuesMap}
                        />
                    ))}
                </div>

                {/* Right: Preview */}
                <div className="w-2/3 bg-slate-950 overflow-y-auto custom-scrollbar relative">
                    {selectedFile ? (
                        <>
                           <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-2 flex justify-between items-center">
                                <div className="font-mono text-sm text-slate-300">{selectedFile.path}</div>
                                <div className="text-xs text-slate-500">{selectedFile.type.toUpperCase()} • {(selectedFile.size/1024).toFixed(1)} KB</div>
                           </div>
                           <div className="p-0">
                               <FilePreview 
                                    file={selectedFile} 
                                    issues={data.issues.filter(i => i.path === selectedFile.path)} 
                               />
                           </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <FileCode className="w-16 h-16 opacity-20 mb-4" />
                            <p>Select a file to inspect content & security</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};