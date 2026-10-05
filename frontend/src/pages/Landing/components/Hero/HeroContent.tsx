import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';

export interface HeroContentProps {
  className?: string;
}

export const HeroContent: React.FC<HeroContentProps> = ({ className }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { profile } = useProfileStore();

  const handleStartInterview = () => {
    navigate('/interview/setup');
  };

  // Derive candidate first name cleanly for personalized greeting
  const rawName = user?.fullName || profile.fullName;
  const firstName = rawName && rawName.trim().length > 0 && !rawName.includes('@')
    ? rawName.trim().split(' ')[0].toUpperCase()
    : null;

  return (
    <div className={cn('flex flex-col justify-center items-start space-y-6', className)}>
      {isAuthenticated ? (
        /* Authenticated Personalized Hero Content */
        <div className="space-y-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent/90 px-3 py-1 rounded-full border border-border/40 bg-surface/50 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WELCOME BACK{firstName ? `, ${firstName}` : ''}</span>
          </span>
          <h1 className="font-stardom font-normal text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-[3.125rem] tracking-tight text-foreground leading-[1.14] select-none max-w-xl lg:max-w-2xl">
            Ready for your next interview?
          </h1>
          <p className="text-sm sm:text-base font-sans text-foreground/75 leading-relaxed max-w-md">
            Build stronger answers.<br />
            Practice with realistic interviews.<br />
            Turn every session into progress.
          </p>
        </div>
      ) : (
        /* Unauthenticated Standard Hero Content */
        <div className="space-y-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-border/40 bg-surface/50 text-foreground/70 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI-Powered Interview Practice</span>
          </span>
          <h1 className="font-stardom font-normal text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-[3.125rem] tracking-tight text-foreground leading-[1.14] select-none max-w-xl lg:max-w-2xl">
            Practice interviews that evolve with you.
          </h1>
          <p className="text-sm sm:text-base font-sans text-foreground/75 leading-relaxed max-w-md">
            Practice realistic interviews. Refine your answers. Build confidence before the real conversation.
          </p>
        </div>
      )}

      {/* Single Primary CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartInterview}
          className="px-7 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-md bg-foreground text-background transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground select-none cursor-pointer shadow-sm"
        >
          Start Interview
        </button>
      </div>

      {/* Editorial Metadata Annotations */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4 border-t border-border/30 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-foreground/50">
        <span className="flex items-center gap-1.5 text-foreground/70 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" /> Real-Time Simulation
        </span>
        <span>·</span>
        <span>Voice Interaction</span>
        <span>·</span>
        <span>Adaptive Feedback</span>
      </div>
    </div>
  );
};
