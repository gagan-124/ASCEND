import { useEffect, useState, type FC } from 'react';
import { useReducedMotion } from 'framer-motion';
import { RoleSpiderChart } from './RoleSpiderChart';
import type { RoleSpecificMetric } from '@/features/results/types/results';

interface PerformanceMetricsViewProps {
  score: number;
  maxScore?: number;
  roleSpecificMetrics: RoleSpecificMetric[];
}

export const PerformanceMetricsView: FC<PerformanceMetricsViewProps> = ({
  score,
  maxScore = 100,
  roleSpecificMetrics,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [animatedScore, setAnimatedScore] = useState<number>(shouldReduceMotion ? score : 0);

  // Score count reveal effect (400 - 600ms)
  useEffect(() => {
    if (shouldReduceMotion) {
      setAnimatedScore(score);
      return;
    }

    let startTime: number | null = null;
    const duration = 500; // ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = progress * (2 - progress);
      setAnimatedScore(Math.round(easedProgress * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [score, shouldReduceMotion]);

  return (
    <div className="space-y-6 font-sans">
      {/* A. INTERVIEW SCORE (TOP OF LEFT COLUMN) */}
      <div className="space-y-1 pb-5 border-b border-border/40">
        <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
          Interview Score
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[48px] sm:text-[56px] font-mono font-bold text-foreground leading-none tracking-tight">
            {animatedScore}
          </span>
          <span className="text-lg font-mono text-foreground-muted">/ {maxScore}</span>
        </div>
        <p className="text-[13px] font-sans text-foreground-muted pt-1">
          Overall performance score
        </p>
      </div>

      {/* B. ROLE-SPECIFIC PERFORMANCE SPIDER CHART (DIRECTLY BELOW SCORE) */}
      <RoleSpiderChart metrics={roleSpecificMetrics} />
    </div>
  );
};
