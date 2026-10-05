import React from 'react';

export const RouteLoader: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex-1 min-h-[65vh] flex flex-col items-center justify-center p-6 text-foreground select-none"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 font-mono text-xs text-foreground/70 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-accent animate-ping motion-reduce:animate-none" />
          <span>Loading workspace environment...</span>
        </div>
      </div>
    </div>
  );
};
