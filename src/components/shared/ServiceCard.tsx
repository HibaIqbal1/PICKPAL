import React from "react";
import { motion } from "motion/react";
import { ServiceDef } from "../../types";
import { CachedImage } from "../ui/CachedImage";

interface ServiceCardProps {
  service: ServiceDef;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tint?: { bg: string; fg: string; shadow: string };
  onSelect: (s: ServiceDef) => void;
}

export const ServiceCard = React.memo<ServiceCardProps>(
  function ServiceCard({ service, onSelect }) {
    return (
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => onSelect(service)}
        className="flex flex-col items-center gap-2 group w-full focus:outline-none"
      >
        <div
          className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 transition-shadow duration-200"
        >
          <CachedImage
            src={service.image || ""}
            alt={service.label}
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
            loading="lazy"
          />
        </div>
        <span className="text-[11px] font-semibold text-ink dark:text-zinc-200 text-center leading-tight line-clamp-2">
          {service.label}
        </span>
      </motion.button>
    );
  },
  (prev, next) =>
    prev.service.key === next.service.key &&
    prev.service.label === next.service.label &&
    prev.service.image === next.service.image &&
    prev.service.group === next.service.group
);
