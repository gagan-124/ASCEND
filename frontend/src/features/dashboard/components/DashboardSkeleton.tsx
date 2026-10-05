import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';

/**
 * Layout-aware skeleton loader matching the candidate Dashboard UI structure.
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard workspace..."
      className="w-full max-w-[1150px] mx-auto space-y-8 select-none"
    >
      {/* Header Skeleton */}
      <div className="space-y-3 pb-6 border-b border-border/40">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-8 sm:h-10 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Unified Summary Row Skeleton */}
      <div className="p-6 rounded-2xl bg-surface/30 border border-border/40 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="space-y-2 border-t md:border-t-0 md:border-l border-border/30 pt-4 md:pt-0 md:pl-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-2 border-t md:border-t-0 md:border-l border-border/30 pt-4 md:pt-0 md:pl-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Past Interviews List Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-surface/20 border border-border/30 flex items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
