import React from "react";
import { motion } from "motion/react";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  /** Restrict to a narrower reading width (for chat/inbox style pages) */
  narrow?: boolean;
}

/**
 * Universal page container used by every content page.
 * Ensures consistent max-width, padding, spacing, and entrance animation.
 */
export function PageContainer({
  children,
  title,
  subtitle,
  action,
  className = "",
  narrow,
}: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`w-full max-w-full ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {title && (
              <h1 className="text-2xl font-display font-extrabold text-ink dark:text-zinc-100 leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-ink-soft dark:text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="space-y-3.5">{children}</div>
    </motion.div>
  );
}

/**
 * Section card — uniform glass card container for page sections.
 */
export function SectionCard({
  children,
  className = "",
  title,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  key?: React.Key;
}) {
  return (
    <div className={`glass-card rounded-3xl p-5 sm:p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-3.5">
          {icon && <span className="text-brand-500">{icon}</span>}
          {title && (
            <h2 className="text-base font-display font-bold text-ink dark:text-zinc-100">
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Two-column responsive grid — adapts col count based on viewport.
 */
export function TwoColGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Three-column stats row — collapses to 3-up on mobile at smaller text.
 */
export function StatsRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Segmented control / tab switcher.
 */
export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            active === t.value
              ? "bg-white dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-sm"
              : "text-ink-soft dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Empty state placeholder card.
 */
export function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl py-14 px-8 flex flex-col items-center text-center gap-3">
      <div className="text-ink-muted dark:text-zinc-600 opacity-50">{icon}</div>
      <p className="text-sm text-ink-soft dark:text-zinc-400">{message}</p>
      {action}
    </div>
  );
}
