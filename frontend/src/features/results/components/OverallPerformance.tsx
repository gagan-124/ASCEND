import type { FC } from 'react';

interface OverallPerformanceProps {
  score: number;
  maxScore?: number;
}

export const OverallPerformance: FC<OverallPerformanceProps> = ({
  score,
  maxScore = 100,
}) => {
  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
        OVERALL PERFORMANCE
      </div>
      
      {/* Dominant Typographic Score (54-64px) */}
      <div className="flex items-baseline gap-2 select-none">
        <span className="text-6xl sm:text-7xl font-stardom text-foreground tracking-tight leading-none font-bold">
          {score}
        </span>
        <span className="text-2xl sm:text-3xl font-stardom text-foreground-muted font-normal">
          / {maxScore}
        </span>
      </div>

      <p className="text-sm text-foreground-muted font-sans leading-relaxed">
        Aggregated readiness telemetry evaluated across 6 core interview dimensions.
      </p>
    </div>
  );
};
