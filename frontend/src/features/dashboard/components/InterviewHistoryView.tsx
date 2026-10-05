import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, CheckCircle2, Target } from 'lucide-react';
import type { RecentInterviewItem } from '../types/dashboard';

interface InterviewHistoryViewProps {
  readinessScore: number;
  interviews: RecentInterviewItem[];
  strongDomains: string[];
  focusAreas: string[];
}

export const InterviewHistoryView: FC<InterviewHistoryViewProps> = ({
  readinessScore,
  interviews,
  strongDomains,
  focusAreas,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pt-4">
      {/* Top Telemetry Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-border/60 bg-surface/30">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold mb-1">
            INTERVIEW HISTORY TELEMETRY
          </div>
          <div className="text-base text-foreground font-sans">
            Aggregated performance tracking across {interviews.length} practice sessions
          </div>
        </div>

        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-xs font-mono text-foreground-muted uppercase">Overall Readiness:</span>
          <span className="text-3xl font-stardom font-bold text-foreground">{readinessScore}</span>
          <span className="text-sm font-stardom text-foreground-muted">/ 100</span>
        </div>
      </div>

      {/* Scannable Recent Interviews List */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
            RECENT INTERVIEWS
          </h3>
          <span className="text-xs font-mono text-foreground-muted">
            {interviews.length} Sessions Logged
          </span>
        </div>

        <div className="space-y-3">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="p-5 border border-border/50 bg-surface/20 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-border transition-colors font-sans"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-semibold text-foreground truncate">
                    {item.roleTitle}
                  </span>
                  <span className="text-xs font-mono text-foreground-muted uppercase tracking-wider px-2 py-0.5 bg-background border border-border/40">
                    {item.interviewType}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-foreground-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {item.dateFormatted}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {item.durationFormatted}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/20">
                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-foreground">
                    {item.score}
                  </span>
                  <span className="text-xs font-mono text-foreground-muted"> / {item.totalPossibleScore}</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/results/${item.id}`)}
                  className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <span>View Results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Domains & Focus Areas Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="p-5 border border-border/50 bg-surface/20 space-y-3 font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
              STRONG DOMAINS
            </h4>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-foreground">
            {strongDomains.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 border border-border/50 bg-surface/20 space-y-3 font-sans">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
              FOCUS AREAS
            </h4>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-foreground">
            {focusAreas.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
