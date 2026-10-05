import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, LayoutDashboard } from 'lucide-react';

export const ActionFooter: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-6 pb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => navigate('/role')}
        className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-sans text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
      >
        <RotateCcw className="w-4 h-4" />
        <span>PRACTICE AGAIN</span>
      </button>

      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="w-full sm:w-auto px-6 py-3 bg-surface hover:bg-surface-muted text-foreground border border-border/60 font-sans text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <LayoutDashboard className="w-4 h-4 text-foreground-muted" />
        <span>BACK TO DASHBOARD</span>
      </button>
    </div>
  );
};
