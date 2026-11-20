import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Wallet, CheckCircle2, Star, MapPin, Power, ShieldCheck, Compass, Zap,
  TrendingUp, Clock, Briefcase, X, ChevronRight, AlertCircle, FileText, Image as ImageIcon, Mic
} from "lucide-react";
import { BookingService } from "../../services/booking.service";
import { LocationService } from "../../services/location.service";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkerOrders } from "../../hooks/useOrders";
import { haversineKm } from "../../lib/matching";
import { TopBar } from "../../components/shared/TopBar";
import { OrderCard } from "../../components/shared/OrderCard";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Order } from "../../types";

const RADII = [3, 5, 10, 15, 20];
const DEFAULT_RADIUS = 5;

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { open, mine, loading } = useWorkerOrders(profile?.id);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [radius, setRadius] = useState(profile?.radius || DEFAULT_RADIUS);
  const [detecting, setDetecting] = useState(false);

  const activeJob = mine.find((o) => o.status !== "completed" && o.status !== "cancelled");
  const todayStr = new Date().toISOString().split("T")[0];

  const completedTotal = mine.filter((o) => o.status === "completed");
  const completedToday = completedTotal.filter((o) => (o.updatedAt || o.createdAt || "").startsWith(todayStr));
  const todayJobsCount = mine.filter((o) => (o.createdAt || "").startsWith(todayStr)).length;

  const totalGrossEarnings = completedTotal.reduce((sum, o) => sum + (o.totalAmount || o.budgetCap || 0), 0);
  const totalNetEarnings = profile?.earnings ?? Math.round(totalGrossEarnings * 0.9);

  const todayGrossEarnings = completedToday.reduce((sum, o) => sum + (o.totalAmount || o.budgetCap || 0), 0);
  const todayNetEarnings = Math.round(todayGrossEarnings * 0.9);

  const pendingRequestsCount = open.length;
  const ratingDisplay = profile?.rating ? profile.rating.toFixed(1) : "5.0";

  const detectLocation = async () => {
    if (!profile) return;
    setDetecting(true);
    try {
      const coords = await LocationService.getCurrentCoordinates();
      const resolvedArea = await LocationService.reverseGeocode(coords.lat, coords.lng);
      await LocationService.updateUserLocation(profile.id, coords.lat, coords.lng, resolvedArea);
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const nearbyOpen = useMemo<{ o: Order; distance: number; estTravelMin: number }[]>(() => {
    const unrejected = open.filter((o) => !rejectedIds.includes(o.id));
    if (!profile?.lat || !profile?.lng) {
      return unrejected.map((o) => ({ o, distance: 0.5, estTravelMin: 5 }));
    }
    return unrejected
      .map((o) => {
        const distance = haversineKm(profile.lat, profile.lng, o.customerLat, o.customerLng);
        const estTravelMin = Math.max(3, Math.round(distance * 2.5 + 2));
        return { o, distance, estTravelMin };
      })
      .filter((x) => isNaN(x.distance) || x.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }, [open, rejectedIds, profile?.lat, profile?.lng, radius]);

  const acceptOrder = async (orderId: string) => {
    if (!profile) return;
    setAccepting(orderId);
    try {
      await BookingService.updateBookingStatus(orderId, "worker_assigned", {
        workerId: profile.id,
        workerName: profile.name,
      });
      navigate(`/worker/job/${orderId}`);
    } catch (err) {
      console.error("Order acceptance error:", err);
    } finally {
      setAccepting(null);
    }
  };

  const rejectOrder = (orderId: string) => {
    setRejectedIds((prev) => [...prev, orderId]);
  };

  return (
    <div className="min-h-screen pb-10 space-y-6">
      <TopBar />

      {/* ── Offline Banner Warning ───────────────────────────────────── */}
      {profile && !profile.isAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 dark:text-amber-300"
        >
          <div className="flex items-center gap-3 text-xs font-semibold">
            <Power size={18} className="text-amber-500 shrink-0" />
            <span>You are currently <strong>OFFLINE</strong>. Switch online to start receiving live job requests.</span>
          </div>
          <button
            onClick={async () => {
              await BookingService.updateBookingStatus(profile.id, "worker_assigned" as any); // fallback
              window.location.reload();
            }}
            className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Go Online
          </button>
        </motion.div>
      )}

      {/* ── 7 Dynamic Metrics Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Jobs", value: `${todayJobsCount}`, icon: Briefcase, color: "from-blue-600 to-indigo-600", shadow: "rgba(59,130,246,.25)" },
          { label: "Pending Requests", value: `${pendingRequestsCount}`, icon: Clock, color: "from-amber-500 to-orange-600", shadow: "rgba(245,158,11,.25)" },
          { label: "Active Job", value: activeJob ? "1 Active" : "None", icon: Zap, color: "from-purple-600 to-indigo-700", shadow: "rgba(147,51,234,.25)" },
          { label: "Completed Jobs", value: `${completedTotal.length}`, icon: CheckCircle2, color: "from-emerald-600 to-teal-700", shadow: "rgba(16,185,129,.25)" },
          { label: "Today's Net", value: `₹${todayNetEarnings}`, icon: Wallet, color: "from-emerald-500 to-green-600", shadow: "rgba(34,197,94,.25)" },
          { label: "Total Earnings", value: `₹${totalNetEarnings}`, icon: TrendingUp, color: "from-indigo-600 to-violet-700", shadow: "rgba(99,102,241,.25)" },
          { label: "Worker Rating", value: ratingDisplay, icon: Star, color: "from-amber-400 to-yellow-600", shadow: "rgba(234,179,8,.25)" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 350, damping: 22 }}
            className={`rounded-3xl p-4 text-white relative overflow-hidden bg-gradient-to-br ${s.color}`}
            style={{ boxShadow: `0 6px 20px ${s.shadow}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{s.label}</span>
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <s.icon size={14} className="text-white" />
              </div>
            </div>
            <p className="text-xl font-display font-black leading-none">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Verification pending Card ───────────────────────────────── */}
      {!profile?.verified ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-7 text-center border-warning-600/20"
          style={{ borderColor: "rgba(217,135,26,.2)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-14 h-14 rounded-3xl mx-auto mb-4 flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-600"
          >
            <ShieldCheck size={28} />
          </motion.div>
          <p className="font-display font-bold text-ink dark:text-zinc-100 text-lg">Verification Pending</p>
          <p className="text-xs text-ink-soft dark:text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Your worker documents are being reviewed by a local manager. Live requests will populate as soon as your profile is approved.
          </p>
        </motion.div>

      ) : activeJob ? (
        /* ── Active Job Banner Card ────────────────────────────────────── */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-sm font-bold text-ink dark:text-zinc-100">Job In Progress</p>
          </div>
          <OrderCard order={activeJob} onClick={() => navigate(`/worker/job/${activeJob.id}`)} />
        </motion.div>

      ) : (
        /* ── Open Home Visit Job Requests ────────────────────────────── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-indigo-500" />
              <p className="text-sm font-bold text-ink dark:text-zinc-100">Incoming Job Requests</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                {nearbyOpen.length} nearby
              </span>
            </div>

            {/* Radius Selector */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/8 rounded-full p-1">
              {RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                    radius === r ? "bg-indigo-500 text-white" : "text-ink-soft dark:text-zinc-400"
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* Location required check */}
          {(!profile?.lat || !profile?.lng) ? (
            <div className="glass-card rounded-3xl p-7 text-center">
              <Compass size={28} className="text-indigo-500 mx-auto mb-3" />
              <p className="font-bold text-ink dark:text-zinc-100">Live Location Required</p>
              <p className="text-xs text-ink-soft dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                Share your location coordinates to receive matching job requests in your radius.
              </p>
              <Button onClick={detectLocation} disabled={detecting} className="mt-4 text-xs px-5 py-2.5">
                {detecting ? "Detecting location..." : "Share Live Location"}
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {loading && <Skeleton className="h-24 rounded-3xl" />}

              {!loading && nearbyOpen.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-3xl p-8 text-center"
                >
                  <TrendingUp size={28} className="text-indigo-400 mx-auto mb-3" />
                  <p className="font-bold text-ink dark:text-zinc-100">No open requests within {radius} km</p>
                  <p className="text-xs text-ink-soft dark:text-zinc-400 mt-1">
                    Stay online — new customer requests in your service categories will appear automatically.
                  </p>
                </motion.div>
              )}

              <div className="space-y-4">
                {nearbyOpen.map(({ o, distance, estTravelMin }, i) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-3xl p-5 space-y-4 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            {o.category}
                          </span>
                          <span className="text-[10px] font-mono text-ink-soft">#{o.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="font-bold text-base text-ink dark:text-zinc-100 mt-1">{o.storeName}</h3>
                        <p className="text-xs text-ink-soft dark:text-zinc-400 mt-0.5">
                          Customer: <span className="font-semibold text-ink dark:text-zinc-200">{o.customerName}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-500 uppercase">Service Price / Budget</p>
                        <p className="text-xl font-display font-black text-indigo-600 dark:text-indigo-400">₹{o.budgetCap || o.totalAmount}</p>
                      </div>
                    </div>

                    {/* Location & Travel Estimates */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                      {o.customerAddress && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft dark:text-zinc-400">
                          <MapPin size={13} className="text-indigo-500 shrink-0" />
                          <span className="truncate max-w-xs">{o.customerAddress}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        <Compass size={11} /> {distance.toFixed(1)} km away
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        <Clock size={11} /> ~{estTravelMin} min travel
                      </span>
                    </div>

                    {/* Items & Attachments */}
                    {o.items && o.items.length > 0 && (
                      <div className="bg-black/3 dark:bg-white/3 rounded-2xl p-3 text-xs space-y-1">
                        <p className="font-bold text-ink dark:text-zinc-200">Requested Items / Work:</p>
                        <ul className="list-disc list-inside text-ink-soft dark:text-zinc-400 space-y-0.5">
                          {o.items.map((it, idx) => (
                            <li key={idx}>
                              {it.name} (qty: {it.qty})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {o.attachments?.details && (
                      <div className="text-xs text-ink-soft dark:text-zinc-350 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-500/10 p-3 rounded-2xl">
                        <p className="font-bold text-amber-800 dark:text-amber-400 text-[10px] uppercase tracking-wider mb-0.5">Customer Instructions:</p>
                        <p className="italic">"{o.attachments.details}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => rejectOrder(o.id)}
                        className="flex-1 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X size={14} /> Decline
                      </button>

                      <Button
                        variant="indigo"
                        onClick={() => acceptOrder(o.id)}
                        disabled={accepting === o.id}
                        className="flex-1 py-3 text-xs rounded-2xl font-bold flex items-center justify-center gap-1.5"
                      >
                        {accepting === o.id ? "Accepting..." : "Accept Request"}
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
