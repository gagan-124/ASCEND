import React from 'react';
import { ShieldCheck, Wifi, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InterviewTopBarProps {
  roleTitle?: string;
  interviewType?: string;
  elapsedSeconds: number;
  className?: string;
}

export const InterviewTopBar: React.FC<InterviewTopBarProps> = ({
  roleTitle = 'Business Development (Sales)',
  interviewType = 'Mock Interview',
  elapsedSeconds,
  className,
}) => {
  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <header
      className={cn(
        'w-full h-12 px-4 flex items-center justify-between gap-4 font-sans select-none shrink-0 z-30',
        className
      )}
    >
      {/* Left: Brand + Role Info */}
      <div className="flex items-center gap-3">
        {/* ASCEND Logo Mark */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5 text-cyan-400 stroke-[2.5]"
            >
              <path d="M12 3L3 21h18L12 3z" />
              <path d="M12 9l4 8H8l4-8z" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-wider text-white font-stardom">
            ASCEND
          </span>
        </div>

        <span className="w-px h-4 bg-white/20" />

        {/* Selected Role + Badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[220px] sm:max-w-[360px]">
            {roleTitle}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] text-white/80 font-mono font-medium shrink-0">
            {interviewType}
          </span>
        </div>
      </div>

      {/* Center: Fullscreen Status Indicator matching Reference Design */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/60 border border-white/10 text-[11px] text-white/60 font-sans shadow-sm">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/90 text-[10px] font-mono font-semibold">
          Esc
        </kbd>
        <span>to exit full screen</span>
      </div>

      {/* Right: Live Session Status & Timer */}
      <div className="flex items-center gap-4 text-xs">
        {/* Recording Indicator */}
        <div className="flex items-center gap-1.5 text-white/80">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <span className="font-medium text-[11px] text-rose-300">Recording</span>
        </div>

        {/* Proctoring Active Badge */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium text-[11px] text-emerald-300">Proctoring Active</span>
        </div>

        {/* Signal Strength Icon */}
        <div className="text-white/60 hover:text-white/90 transition-colors" title="Network Connection: Stable">
          <Wifi className="w-3.5 h-3.5" />
        </div>

        {/* Session Timer Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs font-semibold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
      </div>
    </header>
  );
};
