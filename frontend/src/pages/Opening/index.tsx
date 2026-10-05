import { useState } from 'react';
import { OpeningAnimation, type AnimationPhase } from '@/components/branding';
import { useUIStore } from '@/stores/uiStore';
import { RotateCcw, Sun, Moon } from 'lucide-react';

/**
 * Dedicated preview screen for inspecting the ASCEND Opening Animation in isolation.
 */
export function OpeningPage() {
  const { theme, setTheme } = useUIStore();
  const [animationKey, setAnimationKey] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [inspectPhase, setInspectPhase] = useState<AnimationPhase | null>(null);

  const handleReplay = () => {
    setInspectPhase(null);
    setIsCompleted(false);
    setAnimationKey((prev) => prev + 1);
  };

  const handleSelectPhase = (phase: AnimationPhase | null) => {
    setInspectPhase(phase);
    setIsCompleted(phase === 'FINAL_LOCKUP' || phase === 'HOLD_AND_TRANSITION');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 relative bg-[var(--surface-opening)] transition-colors duration-300">
      <div className="w-full max-w-3xl sm:max-w-4xl md:max-w-5xl flex flex-col items-center justify-center py-12 sm:py-20">
        <OpeningAnimation
          key={`${animationKey}-${theme}`}
          forcePhase={inspectPhase || undefined}
          onComplete={() => setIsCompleted(true)}
        />
      </div>

      {/* Control bar for visual inspection and testing */}
      <div className="absolute bottom-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold rounded-md border border-border/60 hover:border-border hover:bg-surface-muted transition-colors text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Play Sequence
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-border/60 hover:border-border hover:bg-surface-muted transition-colors text-foreground"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-status-warning" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-foreground" />
                <span>Dark</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {(
            [
              ['INITIAL', '1: Initial'],
              ['ARROWS_SPLIT', '2: Split'],
              ['WORDMARK_REVEAL', '3: Reveal'],
              ['FINAL_LOCKUP', '4: Lockup'],
            ] as const
          ).map(([phaseKey, label]) => (
            <button
              key={phaseKey}
              type="button"
              onClick={() => handleSelectPhase(phaseKey)}
              className={`px-2.5 py-1.5 text-[11px] font-medium tracking-wide rounded border transition-colors ${
                inspectPhase === phaseKey
                  ? 'bg-foreground text-background border-foreground font-semibold'
                  : 'border-border/40 hover:border-border text-foreground/70 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-foreground/50 tracking-wider">
          {inspectPhase
            ? `Inspecting Phase: ${inspectPhase} | Theme: ${theme.toUpperCase()}`
            : isCompleted
            ? `Sequence: COMPLETE | Theme: ${theme.toUpperCase()}`
            : `Sequence: RUNNING | Theme: ${theme.toUpperCase()}`}
        </span>
      </div>
    </div>
  );
}
