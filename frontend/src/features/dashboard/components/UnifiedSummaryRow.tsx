import type { FC } from 'react';
import type { WorkspaceSummary } from '../types/dashboard';

interface UnifiedSummaryRowProps {
  summary: WorkspaceSummary;
  strongDomain?: string;
  focusArea?: string;
}

export const UnifiedSummaryRow: FC<UnifiedSummaryRowProps> = ({
  summary,
  strongDomain,
  focusArea,
}) => {
  const displayStrongDomain = strongDomain || 'Backend Fundamentals & API Design';
  const displayFocusArea = focusArea || summary.topFocusDomain || 'System Design & Scalability';

  return (
    <div className="w-full border border-border/50 bg-surface/30 p-5 sm:p-6 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
        {/* Average Score */}
        <div className="space-y-1.5 pt-4 sm:pt-0 first:pt-0 sm:first:pl-0 sm:pl-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
            Average Score
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-foreground">
              {summary.overallReadiness}
            </span>
            <span className="text-sm font-mono text-foreground-muted">/ 100</span>
          </div>
        </div>

        {/* Total Interviews */}
        <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
            Total Interviews
          </div>
          <div className="text-xl font-mono font-semibold text-foreground">
            {summary.totalInterviews} <span className="text-sm font-normal text-foreground-muted">Sessions</span>
          </div>
        </div>

        {/* Strong Domain */}
        <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
            Strong Domain
          </div>
          <div className="text-[15px] font-medium text-foreground truncate" title={displayStrongDomain}>
            {displayStrongDomain}
          </div>
        </div>

        {/* Focus Area */}
        <div className="space-y-1.5 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
            Focus Area
          </div>
          <div className="text-[15px] font-medium text-foreground truncate" title={displayFocusArea}>
            {displayFocusArea}
          </div>
        </div>
      </div>
    </div>
  );
};
