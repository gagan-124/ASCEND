import type { FC } from 'react';

interface InterviewProgressOverviewProps {
  readinessScore: number;
  interviewsCompleted: number;
  strongestDomain: string;
  currentFocusDomain: string;
}

export const InterviewProgressOverview: FC<InterviewProgressOverviewProps> = ({
  readinessScore,
  interviewsCompleted,
  strongestDomain,
  currentFocusDomain,
}) => {
  return (
    <div className="py-4">
      <div className="text-xs font-mono uppercase tracking-widest text-foreground-muted mb-3">
        PERFORMANCE OVERVIEW
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 border border-border/50 bg-surface/30">
        {/* Readiness Score */}
        <div className="space-y-1 pr-4 border-r last:border-r-0 border-border/30">
          <div className="text-[11px] font-mono text-foreground-muted uppercase">
            Overall Readiness
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-stardom text-foreground font-bold leading-none">
              {readinessScore}
            </span>
            <span className="text-xs font-stardom text-foreground-muted">/ 100</span>
          </div>
        </div>

        {/* Completed Count */}
        <div className="space-y-1 pr-4 border-r lg:border-r last:border-r-0 border-border/30">
          <div className="text-[11px] font-mono text-foreground-muted uppercase">
            Interviews Completed
          </div>
          <div className="text-3xl sm:text-4xl font-stardom text-foreground font-bold leading-none">
            {interviewsCompleted}
          </div>
        </div>

        {/* Strongest Domain */}
        <div className="space-y-1 pr-4 border-r last:border-r-0 border-border/30 pt-2 lg:pt-0">
          <div className="text-[11px] font-mono text-foreground-muted uppercase">
            Strongest Domain
          </div>
          <div className="text-sm sm:text-base font-semibold text-foreground truncate font-sans">
            {strongestDomain}
          </div>
        </div>

        {/* Current Focus */}
        <div className="space-y-1 pt-2 lg:pt-0">
          <div className="text-[11px] font-mono text-foreground-muted uppercase">
            Current Focus Area
          </div>
          <div className="text-sm sm:text-base font-semibold text-accent truncate font-sans">
            {currentFocusDomain}
          </div>
        </div>
      </div>
    </div>
  );
};
