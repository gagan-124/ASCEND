import { useState, type FC } from 'react';
import { ChevronDown } from 'lucide-react';
import type { QuestionEvaluation } from '@/features/results/types/results';

interface QuestionAnalysisSectionProps {
  questions: QuestionEvaluation[];
}

export const QuestionAnalysisSection: FC<QuestionAnalysisSectionProps> = ({ questions }) => {
  // Collapsed by default
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleQuestion = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-border/40">
        <div>
          <h3 className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-accent font-semibold">
            QUESTION ANALYSIS
          </h3>
          <p className="text-[13px] text-foreground-muted">
            Question-by-question answer evaluation ({questions.length} questions)
          </p>
        </div>
        <span className="text-[12px] font-mono text-foreground-muted">
          Click entry to expand analysis
        </span>
      </div>

      <div className="divide-y divide-border/40 border-y border-border/40">
        {questions.map((q) => {
          const isExpanded = !!expandedIds[q.id];
          const questionNumberFormatted = q.number < 10 ? `Q0${q.number}` : `Q${q.number}`;

          return (
            <div key={q.id} className="transition-colors hover:bg-surface/30">
              {/* Collapsed Row Header */}
              <button
                type="button"
                onClick={() => toggleQuestion(q.id)}
                aria-expanded={isExpanded}
                aria-controls={`q-analysis-${q.id}`}
                className="w-full text-left py-4 px-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 focus:outline-none focus:bg-surface/40 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="text-sm sm:text-base font-mono font-bold text-accent shrink-0">
                    {questionNumberFormatted}
                  </span>

                  <span className="text-[15px] sm:text-base font-medium text-foreground truncate">
                    {q.title}
                  </span>

                  <span className="hidden lg:inline-block text-[11px] font-mono text-foreground-muted uppercase tracking-wider px-2 py-0.5 bg-background border border-border/40 shrink-0">
                    {q.category}
                  </span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  {/* Score remains visible when collapsed */}
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                      {q.score}
                    </span>
                    <span className="text-[12px] font-mono text-foreground-muted"> / 100</span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-accent' : 'group-hover:text-foreground'
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Details Panel */}
              {isExpanded && (
                <div
                  id={`q-analysis-${q.id}`}
                  className="px-4 sm:px-5 py-4 border-t border-border/30 bg-surface/20 space-y-4 animate-fadeIn"
                >
                  {/* Dimensional Scores */}
                  {q.metricScores && (
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-2 font-semibold">
                        Dimensional Metric Scores
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {Object.entries(q.metricScores).map(([metricName, score]) => (
                          <div key={metricName} className="p-2 bg-background border border-border/30">
                            <div className="text-[11px] text-foreground-muted truncate">
                              {metricName}
                            </div>
                            <div className="text-[14px] font-mono font-bold text-foreground mt-0.5">
                              {score} <span className="text-[11px] text-foreground-muted font-normal">/100</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evaluator Guidance & Observations */}
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted mb-1 font-semibold">
                      Answer Analysis & Feedback
                    </div>
                    <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
                      {q.evaluatorFeedback || q.shortFeedback}
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
