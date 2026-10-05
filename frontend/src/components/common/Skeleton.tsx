import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Atomic skeleton block with ambient pulse animation and reduced-motion support.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={cn(
        'animate-pulse rounded-lg bg-surface/60 border border-border/20 motion-reduce:animate-none',
        className
      )}
      {...props}
    />
  );
}
