import React from "react";
import { motion } from "motion/react";
import { OrderStatus } from "../../types";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "searching_worker", label: "Finding" },
  { key: "worker_assigned", label: "Assigned" },
  { key: "in_progress", label: "Shopping" },
  { key: "checkout_approvals", label: "Approve" },
  { key: "delivering", label: "Delivering" },
  { key: "completed", label: "Done" },
];

export function StatusStepper({ status }: { status: OrderStatus }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center" style={{ width: 52 }}>
            <motion.div
              animate={{ scale: i === idx ? 1.25 : 1 }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: i <= idx ? "#E8236B" : "#E5E1E8" }}
            />
            <span className={`text-[9px] mt-1 text-center leading-tight ${i <= idx ? "text-ink font-semibold" : "text-ink-soft"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-[2px] -mt-4" style={{ background: i < idx ? "#E8236B" : "#E5E1E8" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
