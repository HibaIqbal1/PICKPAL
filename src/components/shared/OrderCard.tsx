import React from "react";
import { motion } from "motion/react";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import { Order } from "../../types";

const STATUS_META: Record<Order["status"], { label: string; gradient: string; dot: string }> = {
  searching_worker:    { label: "Finding shopper", gradient: "linear-gradient(135deg,#FFF3D6,#FFF0CC)", dot: "#D9871A" },
  worker_assigned:     { label: "Shopper assigned", gradient: "linear-gradient(135deg,#E1EEFF,#D8E8FF)", dot: "#1D6FE0" },
  travelling:          { label: "Shopper En Route", gradient: "linear-gradient(135deg,#E1EEFF,#D8E8FF)", dot: "#1D6FE0" },
  arrived:             { label: "At Store",         gradient: "linear-gradient(135deg,#FFE1EC,#FFD4E6)", dot: "#D01260" },
  in_progress:         { label: "Shopping",        gradient: "linear-gradient(135deg,#FFE1EC,#FFD4E6)", dot: "#D01260" },
  photo_verification:  { label: "Photo Verification", gradient: "linear-gradient(135deg,#FDE68A,#F59E0B)", dot: "#D97706" },
  checkout_approvals:  { label: "Needs approval",  gradient: "linear-gradient(135deg,#FFE1EC,#FFD4E6)", dot: "#D01260" },
  shipped:             { label: "Courier Shipped", gradient: "linear-gradient(135deg,#F3E8FF,#E9D5FF)", dot: "#9333EA" },
  delivering:          { label: "Out for delivery", gradient: "linear-gradient(135deg,#DFF6EA,#D2F4E3)", dot: "#14A866" },
  completed:           { label: "Completed",       gradient: "linear-gradient(135deg,#DFF6EA,#D2F4E3)", dot: "#14A866" },
  cancelled:           { label: "Cancelled",       gradient: "linear-gradient(135deg,#F5F5F5,#EEEEEE)", dot: "#9E97AA" },
};

const STATUS_TEXT: Record<Order["status"], string> = {
  searching_worker:   "#92640A",
  worker_assigned:    "#1244A0",
  travelling:         "#1244A0",
  arrived:            "#A80E4E",
  in_progress:        "#A80E4E",
  photo_verification: "#B45309",
  checkout_approvals: "#A80E4E",
  shipped:            "#7E22CE",
  delivering:         "#0D8050",
  completed:          "#0D8050",
  cancelled:          "#6B6478",
};

export function OrderCard({ order, onClick }: { order: Order; onClick?: () => void; key?: React.Key }) {
  const meta = STATUS_META[order.status];
  const textColor = STATUS_TEXT[order.status];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 12px 36px rgba(0,0,0,.1)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      onClick={onClick}
      className="w-full text-left card p-4 flex items-center justify-between gap-3 group"
    >
      {/* Status stripe */}
      <div
        className="w-1.5 self-stretch rounded-full shrink-0"
        style={{ background: meta.dot }}
      />

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-ink dark:text-zinc-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {order.storeName}
        </p>
        <p className="text-xs text-ink-soft dark:text-zinc-400 mt-0.5 truncate">
          {order.items.slice(0, 2).map((i) => i.name).join(", ")}
          {order.items.length > 2 ? ` +${order.items.length - 2} more` : ""}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: meta.gradient, color: textColor }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: meta.dot }}
            />
            {meta.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="font-mono font-bold text-sm text-ink dark:text-zinc-100">
          ₹{order.totalAmount || order.budgetCap}
        </p>
        <ChevronRight
          size={16}
          className="text-ink-soft dark:text-zinc-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </motion.button>
  );
}
