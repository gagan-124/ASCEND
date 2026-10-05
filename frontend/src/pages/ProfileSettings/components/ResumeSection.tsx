import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';

export interface ResumeSectionProps {
  onSaveSuccess: () => void;
  className?: string;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  onSaveSuccess,
  className,
}) => {
  const { profile, setResume, removeResume } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['pdf', 'docx', 'doc'];
    const ext = file.name.toLowerCase().split('.').pop() || '';

    if (!validExtensions.includes(ext)) {
      setErrorMessage('Unsupported file format. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const formattedSize = formatFileSize(file.size);
    setResume(file.name, formattedSize);
    onSaveSuccess();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const hasResume = Boolean(profile.resumeFileName);

  return (
    <div
      className={cn(
        'p-6 sm:p-8 rounded-2xl bg-surface/30 border border-border/40 space-y-8 font-sans',
        className
      )}
    >
      {/* Section Header */}
      <div className="border-b border-border/40 pb-5">
        <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold block mb-1">
          03. CURRICULUM VITAE
        </span>
        <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
          Resume Document
        </h2>
        <p className="text-xs sm:text-sm font-sans text-foreground/60 mt-1">
          Manage your uploaded CV used to dynamically structure resume-based screening sessions and qualification audits.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Actionable Error Display */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-between gap-3 text-destructive text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-mono underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!hasResume ? (
        /* State A: Elegant Empty Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'w-full min-h-[220px] rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3.5 text-center cursor-pointer transition-all duration-200 select-none',
            isDragOver
              ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
              : 'bg-surface/20 border-border/60 hover:border-border hover:bg-surface/40'
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border/60 flex items-center justify-center text-accent shadow-xs">
            <UploadCloud className="w-7 h-7 stroke-[1.75]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground font-stardom uppercase tracking-tight">
              Upload your resume
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60 font-sans max-w-md mx-auto leading-relaxed">
              Let ASCEND use your experience and skills to personalize resume-based interviews.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-2 px-6 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            UPLOAD RESUME
          </button>

          <span className="text-[11px] font-mono text-foreground/40">
            Supported formats: PDF, DOC, DOCX (Max 10MB)
          </span>
        </div>
      ) : (
        /* State B: Active Uploaded Resume Card */
        <div className="p-6 rounded-2xl bg-surface/50 border border-border/60 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                    {profile.resumeFileName}
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-foreground/60 mt-1">
                  <span className="uppercase px-1.5 py-0.5 rounded bg-background border border-border/40 font-medium">
                    {profile.resumeFileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                  <span>{profile.resumeFileSize || '1.2 MB'}</span>
                  <span>•</span>
                  <span>Uploaded {profile.resumeUploadDate || 'Recently'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-border/60 bg-surface/60 hover:bg-surface text-foreground font-mono text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-foreground/60" />
                <span>Replace Resume</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  removeResume();
                  onSaveSuccess();
                }}
                className="px-3.5 py-2 rounded-xl border border-border/40 hover:border-red-500/40 text-red-400 hover:bg-red-500/10 font-mono text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Remove resume"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/40 border border-border/30 text-xs font-sans text-foreground/60 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span>
              This resume is currently active and ready for automatic selection during resume screening interview flows.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
