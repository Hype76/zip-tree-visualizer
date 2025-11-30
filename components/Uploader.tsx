import React, { useCallback, useState, useRef } from 'react';
import { UploadCloud, FileArchive, Loader2 } from 'lucide-react';

interface UploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onFileSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcess(file);
    }
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  }, [onFileSelected]);

  const validateAndProcess = (file: File) => {
    // Basic mime type check or extension check
    if (file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip') || file.type.includes('compressed')) {
      onFileSelected(file);
    } else {
      alert("Please upload a valid .zip file");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileSelect}
      className={`
        relative group cursor-pointer
        w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300 ease-out
        flex flex-col items-center justify-center gap-4
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[0.99]' 
          : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800/50 bg-slate-900/50'
        }
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden" 
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium">Processing contents...</p>
        </div>
      ) : (
        <>
          <div className={`
            p-4 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors
            ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400'}
          `}>
            {isDragging ? <FileArchive className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-slate-200 group-hover:text-blue-200">
              {isDragging ? 'Drop ZIP file here' : 'Click to upload or drag & drop'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Supports standard .zip files. Processed entirely in your browser.
            </p>
          </div>
        </>
      )}
    </div>
  );
};