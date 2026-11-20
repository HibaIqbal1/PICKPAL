import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Users, Truck, LayoutGrid, TrendingUp, AlertTriangle, ShieldCheck, Check, Siren } from "lucide-react";
import { AdminService } from "../../services/admin.service";
import { useAuth } from "../../contexts/AuthContext";
import { TopBar } from "../../components/shared/TopBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAllOrders } from "../../hooks/useOrders";
import { useWorkers } from "../../hooks/useWorkers";
import { useSos, resolveSos } from "../../hooks/useSos";

import { ServiceManagementPanel } from "../../components/admin/ServiceManagementPanel";

const STATUS_COLOR: Record<string, string> = {
  searching_worker: "#D9871A", worker_assigned: "#1D6FE0", in_progress: "#E8236B",
  checkout_approvals: "#E8236B", delivering: "#14A866", completed: "#14A866", cancelled: "#6B6478",
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { orders, loading: ordersLoading } = useAllOrders();
  const { workers, loading: workersLoading } = useWorkers();
  const { alerts: sosAlerts, open: openSos } = useSos();
  const [activeTab, setActiveTab] = React.useState<"overview" | "catalog">("overview");

  const pendingWorkers = workers.filter((w) => !w.verified);
  const verifyWorker = (id: string) => AdminService.verifyWorker(id, true);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length;
    const revenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalAmount, 0);
    const onlineWorkers = workers.filter((w) => w.isAvailable).length;
    const delayed = orders.filter((o) => {
      if (!o.createdAt || o.status === "completed" || o.status === "cancelled") return false;
      const hrs = (Date.now() - new Date(o.createdAt).getTime()) / 3600000;
      return hrs > 1; // simple delay heuristic — order open >1hr without completing
    }).length;
    return { activeOrders, revenue, onlineWorkers, delayed };
  }, [orders, workers]);

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.category] = (counts[o.category] ?? 0) + 1; });
    return counts;
  }, [orders]);
  const maxCount = Math.max(...(Object.values(byCategory) as number[]), 1);

  return (
    <div className="min-h-screen pb-10">
      <TopBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "bg-gray-100 dark:bg-zinc-800 text-ink-soft hover:bg-gray-200"
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "catalog"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "bg-gray-100 dark:bg-zinc-800 text-ink-soft hover:bg-gray-200"
            }`}
          >
            170+ Service Catalog Admin
          </button>
        </div>

        {activeTab === "catalog" ? (
          <ServiceManagementPanel />
        ) : (
          <>
            <div className="grid sm:grid-cols-4 gap-3">
              {[
                { label: "Active orders", value: stats.activeOrders, icon: LayoutGrid, bg: "#FFE1EC", fg: "#D01260" },
                { label: "Workers online", value: `${stats.onlineWorkers}/${workers.length}`, icon: Truck, bg: "#DFF6EA", fg: "#14A866" },
                { label: "Revenue", value: `₹${stats.revenue}`, icon: TrendingUp, bg: "#E1EEFF", fg: "#1D6FE0" },
                { label: "Delayed orders", value: stats.delayed, icon: AlertTriangle, bg: "#FFF3D6", fg: "#D9871A" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg }}>
                  <s.icon size={18} color={s.fg} />
                  <p className="text-2xl font-display font-extrabold text-ink mt-1">{s.value}</p>
                  <p className="text-[11px] font-semibold text-ink-soft">{s.label}</p>
                </div>
              ))}
            </div>

        {stats.delayed > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="rounded-2xl p-4 bg-amber-100 border border-amber-600/20 flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-ink">
              <strong>{stats.delayed} order{stats.delayed > 1 ? "s" : ""}</strong> have been open over an hour without completing — may need attention.
            </p>
          </motion.div>
        )}

        {pendingWorkers.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-black/5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Worker verifications ({pendingWorkers.length})
              </p>
            </div>
            <div className="space-y-2">
              {pendingWorkers.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{w.name}</p>
                    <p className="text-[11px] text-ink-soft truncate">
                      {w.phone ?? "—"} · {w.area ?? "—"} · ID {w.idProof ?? "—"}
                    </p>
                  </div>
                  <button onClick={() => verifyWorker(w.id)}
                          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-mint-100 text-mint-600 flex items-center gap-1">
                    <Check size={13} /> Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sosAlerts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-black/5">
            <div className="flex items-center gap-2 mb-3">
              <Siren size={16} className="text-red-600" />
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                SOS alerts ({openSos.length} open)
              </p>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sosAlerts.map((a) => (
                <div key={a.id}
                     className={`rounded-2xl border p-3 ${a.status === "open" ? "border-red-600/20 bg-red-50" : "border-black/5"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink truncate">
                      {a.userName} <span className="text-[11px] font-normal text-ink-soft">· {a.role}</span>
                    </p>
                    {a.status === "open" ? (
                      <button onClick={() => resolveSos(a.id, profile?.id ?? "manager")}
                              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 text-white">
                        Resolve
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-mint-600 shrink-0">Resolved</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft mt-1 capitalize">
                    {a.reason}{a.note ? ` — ${a.note}` : ""}
                  </p>
                  {a.lat != null && a.lng != null && (
                    <p className="text-[11px] font-mono text-ink-soft mt-0.5">
                      {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 bg-white rounded-2xl p-5 border border-black/5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-4">All orders</p>
            {ordersLoading && <Skeleton className="h-64" />}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-black/5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{o.storeName}</p>
                    <p className="text-[11px] text-ink-soft truncate">
                      {o.customerName} → {o.workerName ?? "unassigned"}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold capitalize shrink-0 ml-2" style={{ color: STATUS_COLOR[o.status] }}>
                    {o.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-black/5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-4">Requests by category</p>
              <div className="space-y-3">
                {Object.entries(byCategory).map(([cat, count]: [string, number]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1 text-ink capitalize"><span>{cat}</span><span className="font-mono">{count}</span></div>
                    <div className="h-2 rounded-full bg-black/5">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft mb-4">Worker roster</p>
              {workersLoading && <Skeleton className="h-32" />}
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {workers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{w.name}</p>
                      <p className="text-[11px] text-ink-soft">{w.area ?? "—"} {!w.verified && <span className="text-amber-600 font-semibold">· unverified</span>}</p>
                    </div>
                    <span className="text-[11px] font-semibold shrink-0" style={{ color: w.isAvailable ? "#14A866" : "#6B6478" }}>
                      {w.isAvailable ? "Available" : "Busy"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </main>
</div>
  );
}
