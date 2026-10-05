import type { FC } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { EvaluationMetric } from '../types/results';
import { Info } from 'lucide-react';

interface PerformanceRadarChartProps {
  metrics: EvaluationMetric[];
}

export const PerformanceRadarChart: FC<PerformanceRadarChartProps> = ({ metrics }) => {
  const chartData = metrics.map((m) => ({
    metric: m.name,
    score: m.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-semibold mb-1">
          PERFORMANCE PROFILE
        </h3>
        <p className="text-base text-foreground font-sans">
          Dimensional score breakdown across 6 core criteria (0–100 scale)
        </p>
      </div>

      {/* Two-Column Analytical Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 bg-surface/20 border border-border/50">
        {/* LEFT: Compact Secondary Radar Visualization */}
        <div className="lg:col-span-5 h-[260px] relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-border/30 pb-6 lg:pb-0 lg:pr-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="var(--border-strong)" strokeDasharray="3 3" opacity={0.35} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{
                  fill: 'var(--foreground-muted)',
                  fontSize: 10,
                  fontFamily: 'var(--font-satoshi)',
                  fontWeight: 500,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Performance"
                dataKey="score"
                stroke="var(--ascend-sand)"
                fill="var(--ascend-sand)"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--ascend-sand)', fillOpacity: 1 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT: Clear Readable 6-Metric List with Numeric Values & Score Bars */}
        <div className="lg:col-span-7 space-y-4">
          {metrics.map((m) => (
            <div key={m.name} className="space-y-1.5 font-sans">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{m.name}</span>
                <span className="font-mono font-bold text-accent">{m.score} / 100</span>
              </div>

              {/* Horizontal Score Bar */}
              <div className="w-full h-2 bg-background border border-border/40 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, m.score))}%` }}
                />
              </div>

              <div className="text-xs text-foreground-muted">
                {m.definition}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accessible Text Table for Screen Readers */}
      <div className="sr-only">
        <h4>Performance Metrics Summary Table</h4>
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Score</th>
              <th scope="col">Definition</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{m.score} / 100</td>
                <td>{m.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delivery Confidence Note */}
      <div className="flex items-start gap-2 text-xs font-sans text-foreground-muted">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span>
          <strong className="text-foreground">Delivery Confidence:</strong> Represents observable live interview delivery characteristics (vocal fluency, pace, structural articulation) during live responses.
        </span>
      </div>
    </div>
  );
};
