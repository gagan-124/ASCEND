import { useState, useRef } from 'react';
import { Upload, FileText, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeUploadAreaProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string | null;
}

export const ResumeUploadArea: React.FC<ResumeUploadAreaProps> = ({
  selectedFile,
  onFileSelect,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    const ext = file.name.toLowerCase().split('.').pop();
    const isValidExt = ext === 'pdf' || ext === 'docx' || ext === 'doc';

    if (!validTypes.includes(file.type) && !isValidExt) {
      alert('Unable to read this file format. Please upload a PDF or DOCX resume.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
          1. RESUME (PDF OR DOCX)
        </label>
        {selectedFile && (
          <span className="text-xs font-mono text-foreground-muted">
            {formatFileSize(selectedFile.size)}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group cursor-pointer border-2 border-dashed p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[180px]',
            isDragOver
              ? 'border-accent bg-accent/5'
              : 'border-border/60 hover:border-accent/60 bg-surface/20 hover:bg-surface/40'
          )}
        >
          <div className="p-3 bg-surface border border-border/40 mb-3 group-hover:border-accent/40 transition-colors">
            <Upload className="w-5 h-5 text-accent" />
          </div>

          <p className="text-sm font-medium text-foreground mb-1">
            Drag & drop your resume here, or <span className="text-accent hover:underline">browse</span>
          </p>

          <p className="text-xs font-mono text-foreground-muted">
            Supported formats: PDF, DOCX (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="p-4 bg-surface/40 border border-border/60 flex items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-accent/10 border border-accent/20 shrink-0">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted mt-0.5">
                <span className="uppercase px-1.5 py-0.5 bg-surface border border-border/40 font-medium">
                  {selectedFile.name.split('.').pop() || 'FILE'}
                </span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-mono text-foreground-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border/40 transition-all cursor-pointer"
              title="Remove resume"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs font-mono text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
