import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import type { RecentInterviewItem } from '../types/dashboard';
import { hasTranscriptAvailable } from '@/features/results';

interface PastInterviewsListProps {
  interviews: RecentInterviewItem[];
  onSelectInterview: (id: string) => void;
  selectedInterviewId?: string | null;
}

export const PastInterviewsList: FC<PastInterviewsListProps> = ({
  interviews,
  onSelectInterview,
  selectedInterviewId,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pt-2 relative">
      <div className="flex items-baseline justify-between pb-2 border-b border-border/40">
        <h3 className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-accent font-semibold">
          PAST INTERVIEWS
        </h3>
        <span className="text-[13px] font-mono text-foreground-muted">
          {interviews.length} Sessions Logged
        </span>
      </div>

      <div className="space-y-2.5">
        {interviews.map((item) => {
          const isSelected = item.id === selectedInterviewId;
          const transcriptAvailable = hasTranscriptAvailable(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectInterview(item.id)}
              className={`w-full text-left p-4 sm:p-5 border transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isSelected
                  ? 'bg-surface/60 border-accent/70 shadow-sm'
                  : 'bg-surface/20 border-border/40 hover:bg-surface/40 hover:border-border/80'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[15px] sm:text-base font-semibold text-foreground truncate">
                    {item.roleTitle}
                  </span>
                  <span className="text-[12px] font-mono text-foreground-muted uppercase tracking-wider px-2 py-0.5 bg-background border border-border/40">
                    {item.interviewType}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-mono text-foreground-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {item.dateFormatted}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {item.durationFormatted}
                  </span>

                  {transcriptAvailable && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/results/${item.id}`);
                      }}
                      className="inline-flex items-center text-[12px] sm:text-[13px] font-mono text-foreground-muted hover:text-accent hover:underline cursor-pointer transition-colors"
                    >
                      Transcript available on Results
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/20">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                    {item.score}
                  </span>
                  <span className="text-[13px] font-mono text-foreground-muted"> / {item.totalPossibleScore}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[13px] font-mono text-accent font-medium">
                  <span className="hidden sm:inline">Select Analysis</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
