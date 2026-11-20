import React from "react";
import { motion } from "motion/react";
import type { TopCategory } from "../../lib/categories";

export function ServiceGrid({ category, onSelect }: { category: TopCategory; onSelect: (serviceKey: string, label: string) => void }) {
  return (
    <div className="px-5 mt-5">
      <h2 className="font-display text-lg font-semibold text-ink mb-3">{category.label}</h2>
      <div className="grid grid-cols-4 gap-3">
        {category.services.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(s.key, s.label)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ background: category.soft }}
              >
                <Icon size={22} color={category.accent} />
              </div>
              <span className="text-[11px] font-medium text-ink/80 text-center leading-tight">{s.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
