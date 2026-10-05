import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import type { RecentInterviewItem } from '../types/dashboard';
import { hasTranscriptAvailable } from '@/features/results';

interface RecentInterviewsListProps {
  interviews: RecentInterviewItem[];
}

export const RecentInterviewsList: FC<RecentInterviewsListProps> = ({ interviews }) => {
  const navigate = useNavigate();

  if (!interviews || interviews.length === 0) {
    return null;
  }

  return (
    <div className="py-4 relative">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-muted">
          RECENT INTERVIEWS
        </h3>
        <span className="text-[11px] font-mono text-foreground-muted">
          Showing last {interviews.length} sessions
        </span>
      </div>

      <div className="space-y-3">
        {interviews.map((item) => {
          const transcriptAvailable = hasTranscriptAvailable(item.id);

          return (
            <div
              key={item.id}
              className="p-4 border border-border/50 bg-surface/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {item.roleTitle}
                  </span>
                  <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider px-1.5 py-0.2 bg-background border border-border/40">
                    {item.interviewType}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-accent" />
                    {item.dateFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-accent" />
                    {item.durationFormatted}
                  </span>

                  {transcriptAvailable && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/results/${item.id}`);
                      }}
                      className="inline-flex items-center text-[11px] sm:text-xs font-mono text-foreground-muted hover:text-accent hover:underline cursor-pointer transition-colors"
                    >
                      Transcript available on Results
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
                <div className="text-right">
                  <span className="text-base font-mono font-bold text-foreground">
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
          );
        })}
      </div>

    </div>
  );
};
