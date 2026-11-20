import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  lines?: number;
  key?: React.Key;
}

/** Premium shimmer skeleton with dark-mode support */
export function Skeleton({ className = "", lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton h-4 ${i === lines - 1 ? "w-3/4" : "w-full"} ${className}`}
          />
        ))}
      </div>
    );
  }
  return <div className={`skeleton ${className}`} />;
}

/** Shimmer card placeholder */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-2/3 rounded-full" />
          <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-4/5 rounded-full" />
    </div>
  );
}
