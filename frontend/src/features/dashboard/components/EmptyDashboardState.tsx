import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';

export const EmptyDashboardState: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-12 my-6 p-8 border border-border/60 bg-surface/20 text-center max-w-2xl mx-auto space-y-4 select-none">
      <div className="w-12 h-12 mx-auto rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
        <Sparkles className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-xl font-stardom text-foreground uppercase tracking-tight mb-2">
          No interviews completed yet.
        </h3>
        <p className="text-sm text-foreground-muted font-sans leading-relaxed max-w-md mx-auto">
          Complete your first practice interview to start building your performance telemetry.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => navigate('/role')}
          className="px-6 py-3 bg-primary text-primary-foreground font-sans text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>START PRACTICE INTERVIEW</span>
        </button>
      </div>
    </div>
  );
};
