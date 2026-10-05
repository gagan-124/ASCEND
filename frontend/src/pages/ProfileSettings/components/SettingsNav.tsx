import React from 'react';
import { User, Briefcase, FileText, Sliders, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SettingsTabId = 'profile' | 'interview' | 'resume' | 'preferences' | 'account';

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal Information',
    icon: User,
  },
  {
    id: 'interview',
    label: 'Interview Profile',
    description: 'Roles & Skills Calibration',
    icon: Briefcase,
  },
  {
    id: 'resume',
    label: 'Resume',
    description: 'CV Document Storage',
    icon: FileText,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Session Configuration',
    icon: Sliders,
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Security & Danger Zone',
    icon: ShieldAlert,
  },
];

export interface SettingsNavProps {
  activeTab: SettingsTabId;
  onSelectTab: (tabId: SettingsTabId) => void;
  className?: string;
}

export const SettingsNav: React.FC<SettingsNavProps> = ({
  activeTab,
  onSelectTab,
  className,
}) => {
  return (
    <nav
      aria-label="Settings Navigation"
      className={cn('w-full flex flex-col font-sans select-none', className)}
    >
      {/* Desktop Vertical Sidebar Navigation */}
      <div className="hidden lg:flex flex-col gap-1 w-full p-2 bg-surface/30 border border-border/40 rounded-2xl">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-foreground/40 font-semibold">
          SETTINGS SECTIONS
        </div>

        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer group',
                isActive
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'hover:bg-surface/80 text-foreground/75 hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-colors shrink-0',
                  isActive
                    ? 'bg-background/20 text-background'
                    : 'bg-foreground/5 text-foreground/70 group-hover:text-foreground group-hover:bg-foreground/10'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-xs font-mono font-medium uppercase tracking-wider leading-tight">
                  {tab.label}
                </span>
                <span
                  className={cn(
                    'block text-[11px] font-sans truncate leading-tight mt-0.5',
                    isActive ? 'text-background/80' : 'text-foreground/50'
                  )}
                >
                  {tab.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile & Tablet Horizontal Tab Switcher */}
      <div className="lg:hidden w-full overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-2 p-1.5 bg-surface/40 border border-border/40 rounded-xl min-w-max">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-foreground text-background font-bold shadow-xs'
                    : 'text-foreground/70 hover:text-foreground hover:bg-surface/60'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
