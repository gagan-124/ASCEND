import { useState, type FC } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { QuestionEvaluation, QuestionStatus } from '../types/results';

interface QuestionBreakdownProps {
  questions: QuestionEvaluation[];
}

const getStatusBadgeStyle = (status: QuestionStatus) => {
  switch (status) {
    case 'Strong':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Meets Expectations':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'Needs Focus':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    default:
      return 'bg-surface text-foreground-muted border-border';
  }
};

export const QuestionBreakdown: FC<QuestionBreakdownProps> = ({ questions }) => {
  // COLLAPSED BY DEFAULT
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleQuestion = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-border/40">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
            QUESTION BREAKDOWN
          </h3>
          <p className="text-sm text-foreground-muted font-sans">
            Compact performance telemetry across all {questions.length} interview questions
          </p>
        </div>
        <span className="text-xs font-mono text-foreground-muted">
          Click row to expand dimensional metric scores & evidence
        </span>
      </div>

      <div className="divide-y divide-border/40 border border-border/40 bg-surface/20">
        {questions.map((q) => {
          const isExpanded = !!expandedIds[q.id];
          const questionNumberFormatted = q.number < 10 ? `Q0${q.number}` : `Q${q.number}`;

          return (
            <div key={q.id} className="transition-colors hover:bg-surface/40">
              {/* Compact Collapsed Row */}
              <button
                type="button"
                onClick={() => toggleQuestion(q.id)}
                aria-expanded={isExpanded}
                aria-controls={`q-details-${q.id}`}
                className="w-full text-left py-3.5 px-5 flex flex-col md:flex-row md:items-center justify-between gap-4 focus:outline-none focus:bg-surface/50 cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="text-sm font-mono font-bold text-accent shrink-0">
                    {questionNumberFormatted}
                  </span>

                  <span className="text-base font-medium text-foreground truncate">
                    {q.title}
                  </span>

                  <span className="hidden lg:inline-block text-xs font-mono text-foreground-muted uppercase tracking-wider px-2 py-0.5 bg-background border border-border/40 shrink-0">
                    {q.category}
                  </span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 shrink-0">
                  <span
                    className={`text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 border ${getStatusBadgeStyle(
                      q.status
                    )}`}
                  >
                    {q.status}
                  </span>

                  <span className="text-base font-mono font-bold text-foreground">
                    {q.score} <span className="text-xs text-foreground-muted font-normal">/ 100</span>
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-accent" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground-muted" />
                  )}
                </div>
              </button>

              {/* Expanded Details Panel */}
              {isExpanded && (
                <div
                  id={`q-details-${q.id}`}
                  className="px-5 py-4 border-t border-border/30 bg-background/70 font-sans space-y-4"
                >
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-foreground-muted mb-2 font-semibold">
                      Dimensional Metric Scores
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(q.metricScores).map(([metricName, score]) => (
                        <div key={metricName} className="p-2.5 bg-surface/40 border border-border/30">
                          <div className="text-xs text-foreground-muted truncate">
                            {metricName}
                          </div>
                          <div className="text-sm font-mono font-bold text-foreground mt-0.5">
                            {score} <span className="text-xs text-foreground-muted font-normal">/100</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-foreground-muted mb-1 font-semibold">
                      Evaluator Guidance & Observations
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {q.evaluatorFeedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
