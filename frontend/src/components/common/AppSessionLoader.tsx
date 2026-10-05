import React from 'react';
import { AscendLogo } from '@/components/branding';

export interface AppSessionLoaderProps {
  statusText?: string;
}

/**
 * Full-screen session loading foundation used during initial application boot
 * and Supabase auth session resolution to prevent unauthenticated UI flashes.
 */
export const AppSessionLoader: React.FC<AppSessionLoaderProps> = ({
  statusText = 'Resolving Authentication Session...',
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-background text-foreground flex flex-col items-center justify-center p-6 select-none transition-opacity duration-200"
    >
      <div className="flex flex-col items-center gap-6">
        <AscendLogo size="lg" />
        <div className="flex items-center gap-2.5 font-mono text-xs text-foreground/60 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse motion-reduce:animate-none" />
          <span>{statusText}</span>
        </div>
      </div>
    </div>
  );
};
