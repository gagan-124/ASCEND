import type { ATSResult } from '../types/ats';
import { CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';

interface ATSEvaluationResultProps {
  result: ATSResult;
}

export const ATSEvaluationResult: React.FC<ATSEvaluationResultProps> = ({ result }) => {
  const {
    overallScore,
    scoreExplanation,
    jobContext,
    evaluation,
    matchedSkills,
    missingSkills,
    strengths,
    areasToImprove,
    recommendations,
  } = result;

  const dimensions = [
    { label: 'Keyword Match', score: evaluation.keywordMatch },
    { label: 'Skills Alignment', score: evaluation.skillsAlignment },
    { label: 'Experience Relevance', score: evaluation.experienceRelevance },
    { label: 'Resume Structure', score: evaluation.resumeStructure },
    { label: 'ATS Readability', score: evaluation.atsReadability },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* 1. ROLE CONTEXT HEADER */}
      {jobContext && (jobContext.title || jobContext.company) && (
        <div className="pb-4 border-b border-border/40 space-y-1">
          <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold">
            EVALUATED ROLE TARGET
          </div>
          <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-wide font-normal">
            {jobContext.title || 'Target Role'}
            {jobContext.company ? ` · ${jobContext.company}` : ''}
          </h2>
        </div>
      )}

      {/* 2. TYPOGRAPHIC ATS SCORE (64–80px) */}
      <div className="space-y-3">
        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold">
          ATS SCORE
        </div>

        <div className="flex items-baseline gap-3 select-none">
          <span className="text-7xl sm:text-8xl font-stardom text-foreground tracking-tight leading-none font-bold">
            {overallScore}
          </span>
          <span className="text-2xl sm:text-3xl font-stardom text-foreground-muted font-normal">
            / 100
          </span>
        </div>

        <p className="text-sm sm:text-base text-foreground/90 font-sans leading-relaxed pt-1">
          {scoreExplanation}
        </p>
      </div>

      {/* 3. EVALUATION DIMENSIONS */}
      <div className="space-y-4 pt-5 border-t border-border/40">
        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold">
          EVALUATION DIMENSIONS
        </div>

        <div className="space-y-3.5">
          {dimensions.map((dim) => (
            <div key={dim.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm sm:text-base font-sans">
                <span className="text-foreground font-medium">{dim.label}</span>
                <span className="font-mono text-xs sm:text-sm text-foreground/90 font-semibold">{dim.score}%</span>
              </div>
              <div className="w-full h-2 bg-background border border-border/40 overflow-hidden rounded-full">
                <div
                  className="h-full bg-accent transition-all duration-500 rounded-full"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MATCHED SKILLS & AREAS TO IMPROVE (NATURAL TEXT TAGS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-border/40">
        <div className="space-y-3">
          <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>MATCHED SKILLS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill.name}
                className="px-3 py-1.5 bg-surface/80 border border-border/50 text-xs sm:text-sm font-mono text-foreground font-medium rounded-md shadow-xs"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>AREAS TO IMPROVE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill.name}
                className="px-3 py-1.5 bg-surface/80 border border-border/50 text-xs sm:text-sm font-mono text-foreground-muted font-medium rounded-md"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 5. STRENGTHS */}
      <div className="space-y-3 pt-5 border-t border-border/40">
        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold">
          STRENGTHS
        </div>
        <ul className="space-y-2.5 text-sm sm:text-base text-foreground/90 font-sans list-disc list-inside">
          {strengths.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. AREAS TO IMPROVE DETAILS */}
      <div className="space-y-3 pt-5 border-t border-border/40">
        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold">
          KEY GAPS & UNCLARIFIED EVIDENCE
        </div>
        <ul className="space-y-2.5 text-sm sm:text-base text-foreground/90 font-sans list-disc list-inside">
          {areasToImprove.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. SUGGESTED IMPROVEMENTS */}
      <div className="space-y-3.5 pt-5 border-t border-border/40">
        <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span>SUGGESTED IMPROVEMENTS</span>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 bg-surface/40 border border-border/50 rounded-xl space-y-1 text-xs sm:text-sm text-foreground/80 font-sans leading-relaxed"
            >
              <strong className="text-sm sm:text-base text-foreground font-semibold block mb-1">
                Recommendation #{idx + 1}
              </strong>
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
