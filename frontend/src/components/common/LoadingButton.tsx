import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Reusable action button supporting accessible loading state, spinner indicator,
 * aria-busy attribute, and disabled interaction while async operations execute.
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  disabled,
  children,
  className,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-150',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 motion-reduce:animate-none" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
