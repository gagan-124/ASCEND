import { useEffect, useState, type FC } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { RoleSpecificMetric } from '@/features/results/types/results';

interface RoleSpiderChartProps {
  metrics: RoleSpecificMetric[];
}

export const RoleSpiderChart: FC<RoleSpiderChartProps> = ({ metrics }) => {
  const shouldReduceMotion = useReducedMotion();
  const [animationFactor, setAnimationFactor] = useState<number>(shouldReduceMotion ? 1 : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setAnimationFactor(1);
      return;
    }

    let startTime: number | null = null;
    const duration = 500; // ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationFactor(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [shouldReduceMotion, metrics]);

  // Fallback if metrics array is incomplete
  const activeMetrics = metrics && metrics.length >= 3 ? metrics : [
    { name: 'System Design', score: 85 },
    { name: 'Data Structures & Algorithms', score: 78 },
    { name: 'Backend Architecture', score: 84 },
    { name: 'Database Design', score: 80 },
    { name: 'API Design', score: 88 },
    { name: 'Scalability', score: 76 },
  ];

  const size = 300;
  const center = size / 2;
  const maxRadius = 95;
  const numAxes = activeMetrics.length;

  const getCoords = (index: number, value: number) => {
    const angle = ((index * (360 / numAxes) - 90) * Math.PI) / 180;
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Label coordinates offset slightly further than maxRadius
  const getLabelCoords = (index: number) => {
    const angle = ((index * (360 / numAxes) - 90) * Math.PI) / 180;
    const r = maxRadius + 22;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Compute Animated Polygon Points
  const polygonPoints = activeMetrics
    .map((m, i) => {
      const animatedScore = m.score * animationFactor;
      const { x, y } = getCoords(i, animatedScore);
      return `${x},${y}`;
    })
    .join(' ');

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="space-y-3 font-sans pt-2">
      <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
        ROLE PERFORMANCE
      </div>

      <div className="relative w-full max-w-[340px] mx-auto bg-surface/20 border border-border/40 p-4 sm:p-6 flex flex-col items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto max-w-[300px] overflow-visible"
        >
          {/* Grid Rings */}
          {gridRings.map((r, idx) => {
            const ringPoints = Array.from({ length: numAxes })
              .map((_, i) => {
                const { x, y } = getCoords(i, r * 100);
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <polygon
                key={idx}
                points={ringPoints}
                fill="none"
                stroke="currentColor"
                className="text-border/40"
                strokeWidth="1"
                strokeDasharray={idx < 3 ? '2 2' : undefined}
              />
            );
          })}

          {/* Radial Axis Lines */}
          {Array.from({ length: numAxes }).map((_, i) => {
            const { x, y } = getCoords(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                className="text-border/40"
                strokeWidth="1"
              />
            );
          })}

          {/* Filled Metric Polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(197, 168, 128, 0.20)"
            stroke="#C5A880"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Metric Plot Dots */}
          {activeMetrics.map((m, i) => {
            const animatedScore = m.score * animationFactor;
            const { x, y } = getCoords(i, animatedScore);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-accent stroke-background"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          {activeMetrics.map((m, i) => {
            const { x, y } = getLabelCoords(i);
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (x < center - 15) textAnchor = 'end';
            else if (x > center + 15) textAnchor = 'start';

            return (
              <text
                key={i}
                x={x}
                y={y}
                fill="currentColor"
                textAnchor={textAnchor}
                className="text-[11px] font-sans font-medium text-foreground tracking-tight"
              >
                {m.name}
              </text>
            );
          })}
        </svg>

        {/* Legend / Subtitle */}
        <div className="text-[12px] font-mono text-foreground-muted mt-2 text-center">
          Technical Competency Evaluation (0–100 Scale)
        </div>
      </div>
    </div>
  );
};
