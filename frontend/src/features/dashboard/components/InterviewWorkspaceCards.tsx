import type { FC } from 'react';
import { FolderGit2, Target, ArrowRight } from 'lucide-react';
import type { WorkspaceSummary } from '../types/dashboard';

interface InterviewWorkspaceCardsProps {
  summary: WorkspaceSummary;
  onOpenWorkspace: () => void;
}

export const InterviewWorkspaceCards: FC<InterviewWorkspaceCardsProps> = ({
  summary,
  onOpenWorkspace,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
        WORKSPACES
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INTERVIEW HISTORY WORKSPACE OBJECT */}
        <div
          onClick={onOpenWorkspace}
          className="group p-6 sm:p-8 border border-border/60 bg-surface/30 hover:bg-surface/50 hover:border-accent/60 transition-all cursor-pointer flex flex-col justify-between min-h-[200px] relative select-none"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                <FolderGit2 className="w-5 h-5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  INTERVIEW HISTORY WORKSPACE
                </span>
              </div>
              <span className="text-xs font-mono text-foreground-muted">
                {summary.totalInterviews} Sessions
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight group-hover:text-accent transition-colors">
              Performance Telemetry & Log
            </h3>

            <p className="text-sm text-foreground-muted font-sans leading-relaxed">
              Overall Readiness: <strong className="text-foreground">{summary.overallReadiness} / 100</strong> • Latest: {summary.latestRoleTitle} ({summary.latestScore}/100).
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <span className="text-xs font-mono text-accent font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
              <span>EXPLORE HISTORY</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* ACTIVE FOCUS DOMAINS ORIENTATION OBJECT */}
        <div
          onClick={onOpenWorkspace}
          className="group p-6 sm:p-8 border border-border/60 bg-surface/30 hover:bg-surface/50 hover:border-accent/60 transition-all cursor-pointer flex flex-col justify-between min-h-[200px] relative select-none"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                <Target className="w-5 h-5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  CURRENT FOCUS AREAS
                </span>
              </div>
              <span className="text-xs font-mono text-foreground-muted">
                {summary.activeFocusAreasCount} Priority Areas
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight group-hover:text-accent transition-colors">
              Growth & Preparation Orientation
            </h3>

            <p className="text-sm text-foreground-muted font-sans leading-relaxed">
              Current Priority: <strong className="text-foreground">{summary.topFocusDomain}</strong>. System design & concurrency depth.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <span className="text-xs font-mono text-accent font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
              <span>VIEW TELEMETRY</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
