import React from "react";
import { motion } from "motion/react";
import { TOP_CATEGORIES } from "../../lib/categories";

export function CategoryTabs({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <div className="px-5 mt-5 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
      {TOP_CATEGORIES.map((c) => {
        const isActive = c.key === active;
        return (
          <motion.button
            key={c.key}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(c.key)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{
              background: isActive ? "#1A1A1A" : "#F3EFE9",
              color: isActive ? "#fff" : "#4A4540",
            }}
          >
            <span>{c.emoji}</span> {c.label}
          </motion.button>
        );
      })}
    </div>
  );
}
