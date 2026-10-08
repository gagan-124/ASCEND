import React from 'react';
import { cn } from '@/lib/utils';
import { Github } from 'lucide-react';

interface OAuthButtonsProps {
  onSelectProvider: (provider: 'google' | 'github') => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Official Google G Vector Icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onSelectProvider,
  isLoading = false,
  disabled = false,
  className,
}) => {
  const providers = [
    {
      id: 'google' as const,
      label: 'Sign in with Google',
      icon: GoogleIcon,
    },
    {
      id: 'github' as const,
      label: 'Sign in with GitHub',
      icon: ({ className }: { className?: string }) => (
        <Github className={cn('w-5 h-5 text-slate-100', className)} />
      ),
    },
  ];

  return (
    <div className={cn('flex items-center justify-center gap-3.5 w-full', className)}>
      {providers.map((p) => {
        const Icon = p.icon;
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.label}
            title={p.label}
            disabled={disabled || isLoading}
            onClick={() => onSelectProvider(p.id)}
            className={cn(
              'h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl',
              'bg-[#0a101f] border border-slate-700/70 text-slate-100 shadow-md',
              'hover:border-slate-500 hover:bg-slate-800/80 active:translate-y-[1px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40',
              'transition-all duration-150 ease-out select-none cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
};
