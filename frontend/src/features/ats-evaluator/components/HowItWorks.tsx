import { Target, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="p-6 bg-surface/20 border border-border/40 space-y-5 font-sans">
      <div className="text-[13px] sm:text-sm font-mono uppercase tracking-wide text-accent font-semibold">
        HOW ASCEND EVALUATES YOUR RESUME
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[15px] sm:text-base font-semibold text-foreground block leading-snug">
              Role Comparison
            </strong>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Compares your resume against specific target job requirements.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[15px] sm:text-base font-semibold text-foreground block leading-snug">
              Skill Alignment
            </strong>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Identifies demonstrated technical capabilities and experience overlap.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[15px] sm:text-base font-semibold text-foreground block leading-snug">
              Evidence Gaps
            </strong>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Highlights missing or weakly represented qualifications without keyword stuffing.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-[15px] sm:text-base font-semibold text-foreground block leading-snug">
              Actionable Guidance
            </strong>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Provides specific recommendations to present your authentic experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

