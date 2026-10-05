import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';

/**
 * Layout-aware skeleton loader matching the interview Results evaluation report UI.
 */
export const ResultsSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading interview evaluation report..."
      className="w-full max-w-[1150px] mx-auto space-y-10 select-none"
    >
      {/* 1. Header & Metadata Skeleton */}
      <div className="pb-5 border-b border-border/40 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      {/* 2. Overall Score & AI Summary Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-border/40">
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface/30 border border-border/40 flex flex-col items-center justify-center space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface/20 border border-border/30 space-y-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      </div>

      {/* 3. Performance Radar Chart Skeleton */}
      <div className="pb-8 border-b border-border/40 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="h-64 rounded-2xl bg-surface/20 border border-border/30 flex items-center justify-center">
          <Skeleton className="h-44 w-44 rounded-full" />
        </div>
      </div>

      {/* 4. Domain Analysis Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-border/40">
        <div className="p-6 rounded-2xl bg-surface/20 border border-border/30 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
        <div className="p-6 rounded-2xl bg-surface/20 border border-border/30 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
      </div>

      {/* 5. Question Breakdown Skeleton */}
      <div className="space-y-3 pb-8">
        <Skeleton className="h-5 w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-surface/20 border border-border/30 flex items-center justify-between">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};
