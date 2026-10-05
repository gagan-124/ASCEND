import { FileText, Eye } from 'lucide-react';

interface ResumePreviewProps {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'unknown';
  fileUrl?: string;
  extractedText?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  fileName,
  fileType,
  fileUrl,
  extractedText,
}) => {
  return (
    <div className="bg-surface/20 border border-border/50 flex flex-col h-full min-h-[600px] font-sans">
      {/* Header bar */}
      <div className="p-4 bg-surface/60 border-b border-border/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono text-foreground-muted shrink-0">
          <Eye className="w-4 h-4" />
          <span className="uppercase">{fileType} Preview</span>
        </div>
      </div>

      {/* Document Body Viewport */}
      <div className="flex-1 p-4 bg-background/50 overflow-y-auto max-h-[800px]">
        {fileType === 'pdf' && fileUrl ? (
          <div className="w-full h-full min-h-[550px]">
            <iframe
              src={`${fileUrl}#toolbar=0&navpanes=0`}
              title={`Preview of ${fileName}`}
              className="w-full h-full min-h-[550px] border-0 bg-white"
            />
          </div>
        ) : (
          <div className="p-6 bg-surface/30 border border-border/40 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed select-text">
            <div className="pb-3 mb-4 border-b border-border/40 text-foreground-muted font-sans text-xs">
              Extracted document contents for <strong className="text-foreground">{fileName}</strong>:
            </div>
            {extractedText || 'No text extracted from document.'}
          </div>
        )}
      </div>
    </div>
  );
};
