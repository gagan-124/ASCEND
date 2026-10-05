import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'w-8 h-8 rounded-md border border-border/40 hover:border-foreground/30 bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 cursor-pointer select-none',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-foreground/80 hover:text-foreground transition-colors" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-foreground/80 hover:text-foreground transition-colors" aria-hidden="true" />
      )}
    </button>
  );
};
