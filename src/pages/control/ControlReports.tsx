import React, { useMemo } from "react";
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Users, Briefcase, Store, DollarSign, Clock } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAllOrders } from "../../hooks/useOrders";
import { useWorkers } from "../../hooks/useWorkers";
import { FirebaseService } from "../../services/firebase.service";
import { PickPalUser, ShopDoc } from "../../types";

export default function ControlReports() {
  const { orders, loading: ordersLoading } = useAllOrders();
  const { workers, loading: workersLoading } = useWorkers();

  const [allUsers, setAllUsers] = React.useState<PickPalUser[]>([]);
  const [shops, setShops] = React.useState<ShopDoc[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  React.useEffect(() => {
    const unsubUsers = FirebaseService.subscribeQuery<PickPalUser>("users", [], (users) => {
      setAllUsers(users);
      setLoadingUsers(false);
    });

    const unsubShops = FirebaseService.subscribeQuery<ShopDoc>("shops", [], (shopList) => {
      setShops(shopList);
    });

    return () => {
      unsubUsers();
      unsubShops();
    };
  }, []);

  const report = useMemo(() => {
    const totalOrders = orders.length;
    const completedJobs = orders.filter((o) => o.status === "completed").length;
    const cancelledJobs = orders.filter((o) => o.status === "cancelled").length;

    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const activeWorkersCount = workers.filter((w) => w.status === "active" || w.verified).length;
    const customerCount = allUsers.filter((u) => u.role === "customer").length;

    // Service category breakdown
    const categoryCounts: Record<string, number> = {};
    orders.forEach((o) => {
      categoryCounts[o.category] = (categoryCounts[o.category] || 0) + 1;
    });

    const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);
    const hasData = totalOrders > 0 || allUsers.length > 0;

    return {
      totalOrders,
      completedJobs,
      cancelledJobs,
      totalRevenue,
      activeWorkersCount,
      customerCount,
      categoryCounts,
      maxCategoryCount,
      hasData,
    };
  }, [orders, workers, allUsers]);

  const loading = ordersLoading || workersLoading || loadingUsers;

  return (
    <ControlLayout
      title="Platform Operations & Financial Reports"
      subtitle="Fulfillment rates, gross transaction revenue, service category breakdown, and operational analytics"
    >
      {loading ? (
        <div className="p-12 text-center text-slate-400">Computing analytics from Firestore...</div>
      ) : !report.hasData ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <BarChart3 size={40} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No sufficient business data yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Operational reports will dynamically compile metrics as customers place orders and completed jobs record revenue.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Orders</span>
              <p className="text-2xl font-black text-white font-mono">{report.totalOrders}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completed Jobs</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">{report.completedJobs}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cancelled Jobs</span>
              <p className="text-2xl font-black text-rose-400 font-mono">{report.cancelledJobs}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Workers</span>
              <p className="text-2xl font-black text-blue-400 font-mono">{report.activeWorkersCount}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Customers</span>
              <p className="text-2xl font-black text-purple-400 font-mono">{report.customerCount}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Revenue</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">₹{report.totalRevenue}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white">Popular Service Categories</h3>
            {Object.keys(report.categoryCounts).length === 0 ? (
              <p className="text-xs text-slate-400">No order category distribution data available yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(report.categoryCounts).map(([cat, count]: [string, number]) => {
                  const percent = Math.round((count / report.maxCategoryCount) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300 capitalize font-medium">
                        <span>{cat}</span>
                        <span className="font-mono text-white font-bold">{count} Orders</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
