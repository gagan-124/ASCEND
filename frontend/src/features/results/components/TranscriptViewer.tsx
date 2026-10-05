import React, { useState } from 'react';
import { Download, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { InterviewResult, TranscriptLine } from '../types/results';
import { cn } from '@/lib/utils';

export interface TranscriptViewerProps {
  result: InterviewResult;
  className?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ result, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const transcript: TranscriptLine[] | undefined = result.transcript;
  const hasTranscript = Boolean(transcript && transcript.length > 0);

  const handleDownloadTxt = () => {
    if (!hasTranscript || !transcript) return;

    const role = result.roleTitle || 'Interview';
    const date = result.completedAt || 'N/A';
    const duration = '32 min';

    const header = [
      'ASCEND INTERVIEW TRANSCRIPT',
      '',
      `Role: ${role}`,
      `Date: ${date}`,
      `Duration: ${duration}`,
      '',
      '--------------------------------',
      '',
    ].join('\n');

    const lines = transcript
      .map((entry) => {
        const speakerLabel = entry.speaker === 'IRA' ? 'IRA' : 'CANDIDATE';
        return `${speakerLabel}:\n${entry.text}\n`;
      })
      .join('\n');

    const footer = '\n--------------------------------\n';

    const fullContent = header + lines + footer;

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascend_transcript_${result.interviewId || 'session'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-surface/30 border border-border/40 overflow-hidden font-sans',
        className
      )}
    >
      {/* Viewer Card Header */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border/40">
              <FileText className="w-3 h-3 text-accent" />
              <span>OFFICIAL TRANSCRIPT</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-stardom text-foreground uppercase tracking-tight">
            Interview Transcript
          </h2>
          <p className="text-xs font-sans text-foreground/60">
            {hasTranscript
              ? `Preserved conversation log for ${result.roleTitle} (${transcript?.length} dialogue exchanges)`
              : 'Transcript status for this session'}
          </p>
          <p className="text-[11px] font-mono text-foreground-muted flex items-center gap-1.5 pt-0.5">
            <AlertCircle className="w-3 h-3 text-accent shrink-0" />
            <span>Note: Transcript is only available on this page.</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasTranscript && (
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-4 py-2 rounded-xl bg-foreground text-background font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              aria-label="Download interview transcript as plain text"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD TRANSCRIPT</span>
            </button>
          )}

          {hasTranscript && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="px-3 py-2 rounded-xl border border-border/60 bg-surface/50 hover:bg-surface text-foreground font-mono text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse transcript lines' : 'Expand transcript lines'}
            >
              <span>{isExpanded ? 'Hide Lines' : 'View Lines'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Transcript Body / Availability */}
      {hasTranscript ? (
        isExpanded && (
          <div className="p-5 sm:p-6 space-y-4 max-h-[500px] overflow-y-auto bg-background/30 divide-y divide-border/20">
            {transcript?.map((entry, index) => {
              const isIRA = entry.speaker === 'IRA';
              return (
                <div key={entry.id || index} className="pt-4 first:pt-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded',
                        isIRA
                          ? 'bg-accent/20 text-foreground border border-accent/40'
                          : 'bg-foreground/10 text-foreground/80 border border-foreground/20'
                      )}
                    >
                      {isIRA ? 'IRA' : 'CANDIDATE'}
                    </span>
                    {entry.timestamp && (
                      <span className="text-[10px] font-mono text-foreground/40">
                        {entry.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-sans text-foreground/80 leading-relaxed pl-1 whitespace-pre-wrap select-text">
                    {entry.text}
                  </p>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="p-6 text-center space-y-2">
          <AlertCircle className="w-5 h-5 text-foreground/40 mx-auto" />
          <p className="text-xs font-mono uppercase tracking-wider text-foreground/60">
            Transcript unavailable for this interview.
          </p>
          <p className="text-[11px] font-sans text-foreground/40 max-w-sm mx-auto">
            Session logs are stored automatically for live protocol runs. Completed evaluations predating transcript logging do not include recorded dialogue.
          </p>
        </div>
      )}
    </div>
  );
};
