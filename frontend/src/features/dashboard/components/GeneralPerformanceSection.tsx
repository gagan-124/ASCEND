import type { FC } from 'react';
import type { GeneralPerformanceMetrics } from '@/features/results/types/results';

interface GeneralPerformanceSectionProps {
  metrics: GeneralPerformanceMetrics;
}

export const GeneralPerformanceSection: FC<GeneralPerformanceSectionProps> = ({ metrics }) => {
  const items = [
    { label: 'Answer Correctness', value: metrics.answerCorrectness },
    { label: 'Communication', value: metrics.communication },
    { label: 'Clarity', value: metrics.clarity },
    { label: 'Delivery Confidence', value: metrics.deliveryConfidence },
    { label: 'Problem Solving', value: metrics.problemSolving },
  ];

  return (
    <div className="pt-8 border-t border-border/40 font-sans space-y-4">
      <div>
        <h3 className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-accent font-semibold">
          GENERAL PERFORMANCE
        </h3>
        <p className="text-[13px] text-foreground-muted font-sans">
          Core interview delivery & response metrics across all dimensions
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="p-4 border border-border/40 bg-surface/20 space-y-1.5 hover:border-border/70 transition-colors"
          >
            <div className="text-[13px] sm:text-[14px] font-medium text-foreground-muted truncate">
              {item.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-foreground">
                {item.value}
              </span>
              <span className="text-[12px] font-mono text-foreground-muted">/ 100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
