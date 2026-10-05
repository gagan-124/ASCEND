import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProctoringFooterProps {
  className?: string;
}

export const ProctoringFooter: React.FC<ProctoringFooterProps> = ({ className }) => {
  return (
    <footer
      className={cn(
        'w-full h-8 px-4 border-t border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between text-[11px] font-sans text-white/50 select-none shrink-0 z-30',
        className
      )}
    >
      {/* Left: Proctoring Guidelines */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Proctoring Active</span>
        </div>

        <span className="w-px h-3 bg-white/10 shrink-0" />

        <div className="hidden sm:flex items-center gap-3 text-white/40 text-[10px] tracking-tight truncate">
          <span>Stay in fullscreen</span>
          <span className="text-white/20">|</span>
          <span>Do not switch tabs</span>
          <span className="text-white/20">|</span>
          <span>Keep your face visible</span>
          <span className="text-white/20">|</span>
          <span>No external help</span>
        </div>
      </div>

      {/* Right: Systems Health Indicator */}
      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>All systems normal</span>
      </div>
    </footer>
  );
};
