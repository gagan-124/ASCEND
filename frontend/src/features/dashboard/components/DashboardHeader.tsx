import type { FC } from 'react';

interface DashboardHeaderProps {
  userName: string;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ userName }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col justify-start gap-1.5 pb-6 border-b border-border/40 font-sans">
      <div className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
        ASCEND WORKSPACE
      </div>
      <h1 className="text-3xl sm:text-4xl font-stardom text-foreground uppercase tracking-tight">
        {getGreeting()}, {userName}.
      </h1>
      <p className="text-[15px] sm:text-base text-foreground-muted font-sans leading-relaxed">
        Your interview workspace.
      </p>
    </div>
  );
};
