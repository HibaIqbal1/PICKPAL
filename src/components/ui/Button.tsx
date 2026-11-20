import React from "react";
import { motion } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "dark" | "indigo";

const CLASSES: Record<Variant, string> = {
  primary:   "btn-gradient-brand text-white",
  indigo:    "btn-gradient-indigo text-white",
  secondary: "bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm",
  ghost:     "bg-transparent text-ink-soft dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5",
  dark:      "bg-ink dark:bg-zinc-100 text-white dark:text-ink shadow-lg",
};

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: any;
  [key: string]: any;
}

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold
                  disabled:opacity-40 disabled:pointer-events-none transition-colors ${CLASSES[variant]} ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
