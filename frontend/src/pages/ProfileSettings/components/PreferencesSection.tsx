import React, { useState } from 'react';
import { Check, MicOff, Sun, Moon } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export interface PreferencesSectionProps {
  onSaveSuccess: () => void;
  className?: string;
}

const DURATIONS = [15, 30, 45, 60] as const;
const QUESTION_COUNTS = [5, 10, 15, 20] as const;

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  onSaveSuccess,
  className,
}) => {
  const { profile, updateProfile } = useProfileStore();
  const { theme, setTheme } = useUIStore();

  const [duration, setDuration] = useState(profile.interviewDuration);
  const [questionCount, setQuestionCount] = useState(profile.questionsPerSession);
  const [allowHints, setAllowHints] = useState(profile.allowHints);
  const [allowFollowUps, setAllowFollowUps] = useState(profile.allowFollowUps);
  const enableVoice = profile.enableVoice;

  const handleSelectDuration = (d: typeof profile.interviewDuration) => {
    setDuration(d);
    updateProfile({ interviewDuration: d });
    onSaveSuccess();
  };

  const handleSelectQuestionCount = (count: typeof profile.questionsPerSession) => {
    setQuestionCount(count);
    updateProfile({ questionsPerSession: count });
    onSaveSuccess();
  };

  const handleToggleHints = () => {
    const nextVal = !allowHints;
    setAllowHints(nextVal);
    updateProfile({ allowHints: nextVal });
    onSaveSuccess();
  };

  const handleToggleFollowUps = () => {
    const nextVal = !allowFollowUps;
    setAllowFollowUps(nextVal);
    updateProfile({ allowFollowUps: nextVal });
    onSaveSuccess();
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    onSaveSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      interviewDuration: duration,
      questionsPerSession: questionCount,
      allowHints,
      allowFollowUps,
      enableVoice,
    });
    onSaveSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'p-6 sm:p-8 rounded-2xl bg-surface/30 border border-border/40 space-y-8 font-sans',
        className
      )}
    >
      {/* Section Header */}
      <div className="border-b border-border/40 pb-5">
        <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold block mb-1">
          04. SESSION PARAMETERS
        </span>
        <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
          Interview Preferences
        </h2>
        <p className="text-xs sm:text-sm font-sans text-foreground/60 mt-1">
          Configure default timing, question depth, appearance theme, hints, and speech interaction settings for mock sessions.
        </p>
      </div>

      {/* 1. Global Appearance / Theme Mode (Immediate Effect) */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Interface Appearance Mode
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'p-3.5 rounded-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer font-mono text-xs uppercase font-bold tracking-wider select-none',
              theme === 'dark'
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'bg-surface/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
            )}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Theme</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={cn(
              'p-3.5 rounded-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer font-mono text-xs uppercase font-bold tracking-wider select-none',
              theme === 'light'
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'bg-surface/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
            )}
          >
            <Sun className="w-4 h-4" />
            <span>Light Theme</span>
          </button>
        </div>
      </div>

      {/* 2. Interview Duration Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Default Interview Duration
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DURATIONS.map((d) => {
            const isSelected = duration === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleSelectDuration(d)}
                className={cn(
                  'py-3 px-4 rounded-xl border text-center transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-foreground text-background border-foreground font-bold shadow-xs'
                    : 'bg-surface/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
                )}
              >
                <span className="font-mono text-sm block">{d} Mins</span>
                <span className={cn('text-[10px] font-sans block mt-0.5', isSelected ? 'text-background/80' : 'text-foreground/50')}>
                  {d === 15 ? 'Express' : d === 30 ? 'Standard' : d === 45 ? 'In-depth' : 'Full loop'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Questions Per Session */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Questions Per Session
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUESTION_COUNTS.map((count) => {
            const isSelected = questionCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => handleSelectQuestionCount(count)}
                className={cn(
                  'py-3 px-4 rounded-xl border text-center transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-foreground text-background border-foreground font-bold shadow-xs'
                    : 'bg-surface/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
                )}
              >
                <span className="font-mono text-sm block">{count} Questions</span>
                <span className={cn('text-[10px] font-sans block mt-0.5', isSelected ? 'text-background/80' : 'text-foreground/50')}>
                  {count === 5 ? 'Rapid Check' : count === 10 ? 'Recommended' : count === 15 ? 'Comprehensive' : 'Exhaustive'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Toggles Section */}
      <div className="space-y-4 pt-2 border-t border-border/30">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70 mb-2">
          Interactivity & Assistance Toggles
        </label>

        {/* Toggle 1: Hints */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface/40 border border-border/40 gap-4">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-foreground block">
              Allow hints during interviews
            </span>
            <p className="text-xs text-foreground/60 font-sans">
              Provides optional architectural and conceptual prompt hints when requested.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowHints}
            onClick={handleToggleHints}
            className={cn(
              'w-12 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
              allowHints ? 'bg-emerald-500' : 'bg-surface/80 border border-border/60'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                allowHints ? 'translate-x-6' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Toggle 2: Follow-up Questions */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface/40 border border-border/40 gap-4">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-foreground block">
              Allow ASCEND to ask follow-up questions
            </span>
            <p className="text-xs text-foreground/60 font-sans">
              Enables IRA (AI Interviewer) to probe deeper into trade-offs based on candidate responses.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowFollowUps}
            onClick={handleToggleFollowUps}
            className={cn(
              'w-12 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
              allowFollowUps ? 'bg-emerald-500' : 'bg-surface/80 border border-border/60'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                allowFollowUps ? 'translate-x-6' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Toggle 3: Voice Interview (Disabled / Clearly marked unavailable as specified in prompt) */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface/20 border border-border/30 gap-4 opacity-75">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground block">
                Enable voice interviews
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded font-bold">
                Unavailable
              </span>
            </div>
            <p className="text-xs text-foreground/50 font-sans">
              Real-time voice streaming requires active WebRTC audio permissions. Currently reserved for live room protocol.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-surface border border-border/40 flex items-center justify-center text-foreground/40">
              <MicOff className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-4 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs font-mono text-foreground/50">
          Preferences take effect immediately upon change.
        </span>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>SAVE PREFERENCES</span>
        </button>
      </div>
    </form>
  );
};
