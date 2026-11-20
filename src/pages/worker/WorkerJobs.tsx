import React, { useState } from "react";
import { Briefcase, History, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkerOrders } from "../../hooks/useOrders";
import { Skeleton } from "../../components/ui/Skeleton";
import { PageContainer, SectionCard, TabSwitcher, EmptyState } from "../../components/ui/PageContainer";

export default function WorkerJobs() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { mine, loading } = useWorkerOrders(profile?.id);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");

  const activeJob = mine.find((o) => o.status !== "completed" && o.status !== "cancelled");
  const pastJobs = mine.filter((o) => o.status === "completed" || o.status === "cancelled");

  const filteredPastJobs = pastJobs.filter((o) => {
    if (filter === "completed") return o.status === "completed";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <PageContainer
      title="Jobs & History"
      subtitle="View your active assigned work or browse completed request history"
    >
      {/* Active Job Section */}
      <SectionCard
        title="Active Job"
        icon={<Clock size={16} className="text-indigo-500" />}
      >
        {loading ? (
          <Skeleton className="h-28 rounded-3xl" />
        ) : activeJob ? (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-500/10 rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {activeJob.status.replace("_", " ")}
                </span>
                <h3 className="text-base font-bold text-ink dark:text-zinc-100 mt-2">{activeJob.storeName}</h3>
                <p className="text-xs text-ink-soft dark:text-zinc-400 mt-0.5">
                  Customer: <span className="font-semibold text-ink dark:text-zinc-300">{activeJob.customerName}</span> · {activeJob.items.length} items
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-500 uppercase tracking-wider">Budget Cap</p>
                <p className="text-lg font-display font-black text-indigo-600 dark:text-indigo-400">₹{activeJob.budgetCap}</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/worker/job/${activeJob.id}`)}
              className="w-full btn-gradient-indigo text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              Go to Active Job Screen <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <EmptyState
            icon={<Briefcase size={32} />}
            message="No active job at the moment. Set yourself Online in the dashboard to receive requests."
          />
        )}
      </SectionCard>

      {/* Historical Jobs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <History size={16} className="text-indigo-500" />
            Job History ({pastJobs.length})
          </h2>

          <TabSwitcher
            tabs={[
              { value: "all", label: "All" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            active={filter}
            onChange={(v) => setFilter(v as any)}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : filteredPastJobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={32} />}
            message="No matching jobs found in history."
          />
        ) : (
          <div className="space-y-3">
            {filteredPastJobs.map((o) => (
              <div
                key={o.id}
                className="glass-card rounded-3xl p-4.5 flex items-center justify-between gap-4 shadow-sm border border-black/5 dark:border-white/5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 uppercase">
                      {o.category}
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft dark:text-zinc-500">#{o.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h3 className="font-bold text-ink dark:text-zinc-100 mt-1.5 text-sm">{o.storeName}</h3>
                  <p className="text-[11px] text-ink-soft dark:text-zinc-400 mt-0.5">
                    {o.items.length} items · Budget ₹{o.budgetCap} · Customer: {o.customerName}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-sm font-display font-bold text-ink dark:text-zinc-100">₹{o.totalAmount || o.budgetCap}</p>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    o.status === "completed"
                      ? "bg-mint-100 text-mint-700 dark:bg-mint-600/10 dark:text-mint-450"
                      : "bg-error-50 text-error-600 dark:bg-red-500/10 dark:text-red-400"
                  }`}>
                    {o.status === "completed" ? (
                      <>
                        <CheckCircle2 size={10} /> Completed
                      </>
                    ) : (
                      <>
                        <XCircle size={10} /> Cancelled
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
