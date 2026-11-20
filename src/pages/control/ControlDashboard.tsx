import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Briefcase,
  UserCheck,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  MessageSquareWarning,
  Siren,
  ArrowUpRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useAllOrders } from "../../hooks/useOrders";
import { useWorkers } from "../../hooks/useWorkers";
import { useSos } from "../../hooks/useSos";
import { FirebaseService } from "../../services/firebase.service";
import { PickPalUser, ComplaintDoc } from "../../types";

export default function ControlDashboard() {
  const { profile, isAdmin } = useAuth();
  const { orders, loading: ordersLoading } = useAllOrders();
  const { workers, loading: workersLoading } = useWorkers();
  const { alerts: sosAlerts } = useSos();

  const [allUsers, setAllUsers] = React.useState<PickPalUser[]>([]);
  const [complaints, setComplaints] = React.useState<ComplaintDoc[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);

  React.useEffect(() => {
    const unsubUsers = FirebaseService.subscribeQuery<PickPalUser>("users", [], (users) => {
      setAllUsers(users);
      setLoadingData(false);
    });

    const unsubComplaints = FirebaseService.subscribeQuery<ComplaintDoc>("complaints", [], (comps) => {
      setComplaints(comps);
    });

    return () => {
      unsubUsers();
      unsubComplaints();
    };
  }, []);

  // Compute live metrics from real Firestore data
  const metrics = useMemo(() => {
    const totalCustomers = allUsers.filter((u) => u.role === "customer").length;
    const activeWorkers = workers.filter((w) => w.status === "active" || w.verified).length;
    const pendingWorkerApps = allUsers.filter(
      (u) =>
        u.role === "worker" &&
        (u.status === "pendingApproval" || u.verificationStatus === "pending" || !u.verified)
    ).length;

    const activeOrders = orders.filter(
      (o) => o.status !== "completed" && o.status !== "cancelled"
    ).length;

    const completedOrders = orders.filter((o) => o.status === "completed").length;

    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const activeSosAlerts = sosAlerts.filter((a) => a.status === "open").length;

    const pendingComplaints = complaints.filter(
      (c) => c.status === "Open" || c.status === "Investigating"
    ).length;

    const hasAnyData =
      allUsers.length > 0 || orders.length > 0 || sosAlerts.length > 0 || complaints.length > 0;

    return {
      totalCustomers,
      activeWorkers,
      pendingWorkerApps,
      activeOrders,
      completedOrders,
      totalRevenue,
      activeSosAlerts,
      pendingComplaints,
      hasAnyData,
    };
  }, [allUsers, workers, orders, sosAlerts, complaints]);

  // Filter pending worker applications for quick action list
  const pendingApplications = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.role === "worker" &&
        (u.status === "pendingApproval" || u.verificationStatus === "pending" || !u.verified)
    );
  }, [allUsers]);

  // Recent active orders
  const activeOrdersList = useMemo(() => {
    return orders
      .filter((o) => o.status !== "completed" && o.status !== "cancelled")
      .slice(0, 5);
  }, [orders]);

  const loading = ordersLoading || workersLoading || loadingData;

  return (
    <ControlLayout
      title="PickPal Control Dashboard"
      subtitle="Real-time operations, worker verification & active orders overview"
    >
      {/* Active SOS Red Alert Banner */}
      {metrics.activeSosAlerts > 0 && (
        <div className="bg-red-950/80 border border-red-600/60 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0">
              <Siren size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Emergency SOS Alert Triggered ({metrics.activeSosAlerts} Active)
              </h3>
              <p className="text-xs text-red-200 mt-0.5">
                Immediate manager intervention required for active emergency response.
              </p>
            </div>
          </div>
          <Link
            to="/control/sos"
            className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shrink-0 self-start sm:self-center shadow-lg"
          >
            Open Emergency SOS Operations
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.totalCustomers.toLocaleString()}
            </p>
            <Link to="/control/customers" className="text-slate-400 hover:text-brand-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Registered customer accounts</p>
        </div>

        {/* Active Workers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Workers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.activeWorkers.toLocaleString()}
            </p>
            <Link to="/control/workers" className="text-slate-400 hover:text-emerald-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Verified platform partners</p>
        </div>

        {/* Pending Worker Applications */}
        <div
          className={`bg-slate-900/80 border rounded-3xl p-5 space-y-2 transition-all ${
            metrics.pendingWorkerApps > 0
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.pendingWorkerApps.toLocaleString()}
            </p>
            <Link to="/control/workers/applications" className="text-slate-400 hover:text-amber-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-amber-400/90 font-medium">Verification queue reviews</p>
        </div>

        {/* Active Orders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Jobs</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.activeOrders.toLocaleString()}
            </p>
            <Link to="/control/orders" className="text-slate-400 hover:text-indigo-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">In-progress orders</p>
        </div>

        {/* Completed Today */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.completedOrders.toLocaleString()}
            </p>
            <Link to="/control/orders" className="text-slate-400 hover:text-teal-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Total fulfilled requests</p>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              ₹{loading ? "..." : metrics.totalRevenue.toLocaleString()}
            </p>
            <Link to="/control/payments" className="text-slate-400 hover:text-purple-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Completed transaction value</p>
        </div>

        {/* Complaints */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Complaints</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <MessageSquareWarning size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.pendingComplaints.toLocaleString()}
            </p>
            <Link to="/control/complaints" className="text-slate-400 hover:text-rose-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Customer tickets open</p>
        </div>

        {/* SOS Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">SOS Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Siren size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-display font-black text-white">
              {loading ? "..." : metrics.activeSosAlerts.toLocaleString()}
            </p>
            <Link to="/control/sos" className="text-slate-400 hover:text-red-400">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Active emergency alerts</p>
        </div>
      </div>

      {/* Main Split Sections: Worker Applications & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Applications Review Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Pending Applications</h3>
                <p className="text-xs text-slate-400">Workers awaiting verification review</p>
              </div>
            </div>
            <Link
              to="/control/workers/applications"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View All ({pendingApplications.length})
              <ChevronRight size={14} />
            </Link>
          </div>

          {pendingApplications.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
              <ShieldCheck size={32} className="text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No pending worker applications</p>
              <p className="text-xs text-slate-500">All submitted partner documents have been processed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApplications.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-white truncate">{app.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {app.skills?.join(", ") || app.workerType || "Service Partner"} • {app.phone || app.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Pending Verification
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {app.city || app.address || "Location set"}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/control/workers/applications?id=${app.id}`}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shrink-0 shadow-md"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Active Orders Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Live Active Jobs</h3>
                <p className="text-xs text-slate-400">Current service dispatches and fulfillment</p>
              </div>
            </div>
            <Link
              to="/control/orders"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View Orders ({orders.length})
              <ChevronRight size={14} />
            </Link>
          </div>

          {activeOrdersList.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
              <Clock size={32} className="text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No active orders</p>
              <p className="text-xs text-slate-500">
                Newly booked customer orders will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrdersList.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white truncate">{order.storeName}</span>
                      <span className="text-[10px] font-mono text-slate-400">#{order.id.slice(-6)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      Customer: {order.customerName} {order.workerName ? `• Worker: ${order.workerName}` : "• Unassigned"}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-emerald-400">₹{order.totalAmount}</p>
                    <Link
                      to="/control/orders"
                      className="text-xs text-brand-400 hover:underline font-bold mt-0.5 block"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ControlLayout>
  );
}
