import React, { useState, useEffect } from "react";
import { Clock, Users, Play, Pause, FastForward, RotateCcw, Store, CheckCircle2 } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { ControlService } from "../../services/control.service";
import { ShopDoc, QueueDoc } from "../../types";

export default function ControlQueue() {
  const { profile } = useAuth();
  const [shops, setShops] = useState<ShopDoc[]>([]);
  const [queues, setQueues] = useState<Record<string, QueueDoc>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubShops = FirebaseService.subscribeQuery<ShopDoc>("shops", [], (shopList) => {
      setShops(shopList);
      setLoading(false);
    });

    const unsubQueue = FirebaseService.subscribeQuery<QueueDoc>("queue", [], (queueList) => {
      const qMap: Record<string, QueueDoc> = {};
      queueList.forEach((q) => {
        if (q.shopId) qMap[q.shopId] = q;
      });
      setQueues(qMap);
    });

    return () => {
      unsubShops();
      unsubQueue();
    };
  }, []);

  const handleAdvanceToken = async (shop: ShopDoc) => {
    if (!profile) return;
    const existing = queues[shop.id] || {
      id: "queue_" + shop.id,
      shopId: shop.id,
      shopName: shop.name,
      currentToken: 1,
      peopleWaiting: 5,
      estimatedWaitMinutes: 25,
      todayAppointmentsCount: 12,
      availableSlots: 8,
      status: "active",
    };

    const nextToken = existing.currentToken + 1;
    const nextWaiting = Math.max(0, existing.peopleWaiting - 1);
    const nextEst = nextWaiting * 5;

    try {
      await ControlService.updateShopQueue(
        {
          ...existing,
          currentToken: nextToken,
          peopleWaiting: nextWaiting,
          estimatedWaitMinutes: nextEst,
        },
        profile.id
      );
    } catch (err: any) {
      alert("Failed to advance token: " + err.message);
    }
  };

  const handleTogglePauseQueue = async (shop: ShopDoc) => {
    if (!profile) return;
    const existing = queues[shop.id] || {
      id: "queue_" + shop.id,
      shopId: shop.id,
      shopName: shop.name,
      currentToken: 1,
      peopleWaiting: 0,
      estimatedWaitMinutes: 0,
      todayAppointmentsCount: 0,
      availableSlots: 10,
      status: "active",
    };

    const nextStatus = existing.status === "active" ? "paused" : "active";

    try {
      await ControlService.updateShopQueue(
        {
          ...existing,
          status: nextStatus,
        },
        profile.id
      );
    } catch (err: any) {
      alert("Failed to update queue state: " + err.message);
    }
  };

  return (
    <ControlLayout
      title="Shop Queue & Token Operations"
      subtitle="Live manager controls for shop waiting tokens, customer calls, and appointment slot capacities"
    >
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading active shop queues...</div>
      ) : shops.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Clock size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No shops registered for queue operations</h3>
          <p className="text-xs text-slate-400">Register shops in the Shops section to start live queue management.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => {
            const qData = queues[shop.id] || {
              id: "queue_" + shop.id,
              shopId: shop.id,
              shopName: shop.name,
              currentToken: 18,
              peopleWaiting: 7,
              estimatedWaitMinutes: 35,
              todayAppointmentsCount: 23,
              availableSlots: 10,
              status: "active" as const,
            };

            const isPaused = qData.status === "paused";

            return (
              <div
                key={shop.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Shop header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{shop.name}</h4>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{shop.category}</p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                        isPaused
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {isPaused ? "Queue Paused" : "Live Queue"}
                    </span>
                  </div>

                  {/* Token Display Card */}
                  <div className="bg-gradient-to-tr from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 text-center space-y-1 shadow-inner">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      CURRENT SERVING TOKEN
                    </span>
                    <p className="text-4xl font-display font-black text-brand-400 tracking-tight font-mono">
                      #{qData.currentToken}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-400">People Waiting</span>
                      <p className="text-base font-black text-white font-mono mt-0.5">
                        {qData.peopleWaiting}
                      </p>
                    </div>

                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-400">Est. Wait Time</span>
                      <p className="text-base font-black text-amber-300 font-mono mt-0.5">
                        {qData.estimatedWaitMinutes} mins
                      </p>
                    </div>

                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-400">Today Appointments</span>
                      <p className="text-base font-black text-white font-mono mt-0.5">
                        {qData.todayAppointmentsCount}
                      </p>
                    </div>

                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                      <span className="text-slate-400">Available Slots</span>
                      <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                        {qData.availableSlots}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Queue Controls */}
                <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleAdvanceToken(shop)}
                    disabled={isPaused}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <FastForward size={15} /> Call Next Token
                  </button>

                  <button
                    onClick={() => handleTogglePauseQueue(shop)}
                    className={`py-2.5 px-3 rounded-2xl font-bold text-xs border flex items-center gap-1 transition-all ${
                      isPaused
                        ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ControlLayout>
  );
}
