import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Star, Phone, Play, Pause, RotateCcw,
  MessageSquare, Check, ShoppingBag, MapPin, Navigation, Clock, Wifi, WifiOff, Download
} from "lucide-react";
import { downloadInvoicePdf } from "./Orders";
import { FirebaseService } from "../../services/firebase.service";
import { useAuth } from "../../contexts/AuthContext";
import { useOrderMessages } from "../../hooks/useMessages";
import { useCall } from "../../hooks/useCall";
import { useLocationStream } from "../../hooks/useLocationSocket";
import { LiveMap } from "../../components/shared/LiveMap";
import { CallSheet } from "../../components/shared/CallSheet";
import { ChatPanel } from "../../components/shared/ChatPanel";
import { SosButton } from "../../components/shared/SosButton";
import { Skeleton } from "../../components/ui/Skeleton";
import { Order, PickPalUser, OrderStatus } from "../../types";

// High-fidelity Bengaluru route points for simulation
// Starting position -> Store (Phase 1) -> Sourcing (Phase 2) -> Customer (Phase 3)
const SIM_ROUTE: [number, number][] = [
  [12.9660, 77.5880], // Step 0: Assigned, Rohith starts heading to store
  [12.9690, 77.5910], // Step 1: En route
  [12.9720, 77.5940], // Step 2: En route
  [12.9750, 77.5970], // Step 3: Almost at store
  [12.9785, 77.6015], // Step 4: Arrived at store (Transition to Sourcing)
  [12.9785, 77.6015], // Step 5: Sourcing item 1
  [12.9785, 77.6015], // Step 6: Sourcing item 2
  [12.9785, 77.6015], // Step 7: Sourcing item 3 (Checkout Approvals)
  [12.9770, 77.6000], // Step 8: Left store, heading to customer (Transition to Delivering)
  [12.9750, 77.5980], // Step 9: En route to customer
  [12.9735, 77.5962], // Step 10: Close by
  [12.9722, 77.5950], // Step 11: Arrived at gate
  [12.9716, 77.5946], // Step 12: Order Completed
];

const customerPos: [number, number] = [12.9716, 77.5946];
const storePos: [number, number] = [12.9785, 77.6015];

const STEP_LABELS: Record<OrderStatus, string> = {
  searching_worker: "Finding a proxy shopper",
  worker_assigned: "Shopper assigned & en route to store",
  travelling: "Shopper travelling to local shop",
  arrived: "Shopper arrived at physical store",
  in_progress: "Shopper selecting & verifying items",
  photo_verification: "Live item & receipt photo verification",
  checkout_approvals: "Customer approved purchase",
  shipped: "Dispatched via courier with tracking",
  delivering: "Out for local delivery to you",
  completed: "Proxy order delivered successfully",
  cancelled: "Order cancelled",
};

export default function Track() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [worker, setWorker] = useState<PickPalUser | null>(null);
  const [customerLoc, setCustomerLoc] = useState<[number, number]>(customerPos);
  const [callOpen, setCallOpen] = useState(false);
  const { messages, send } = useOrderMessages(orderId);
  const call = useCall({ orderId: order?.id, peerId: order?.workerId, currentUserId: profile?.id });

  // Simulation State
  const [simMode, setSimMode] = useState(false);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(1);
  const [panelOpen, setPanelOpen] = useState(true);

  // Firestore subscribers via Service Layer
  useEffect(() => {
    if (!orderId || simMode) return;
    return FirebaseService.subscribeDoc<Order>("orders", orderId, (data) => setOrder(data));
  }, [orderId, simMode]);

  useEffect(() => {
    if (!order?.workerId || simMode) { setWorker(null); return; }
    return FirebaseService.subscribeDoc<PickPalUser>("users", order.workerId, (data) => setWorker(data));
  }, [order?.workerId, simMode]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => setCustomerLoc([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  // Simulation Game Loop
  useEffect(() => {
    let timer: any;
    if (simPlaying && simMode) {
      const interval = 3000 / simSpeed;
      timer = setInterval(() => {
        setSimStep((prev) => {
          if (prev >= SIM_ROUTE.length - 1) {
            setSimPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [simPlaying, simSpeed, simMode]);

  // Render loading state with simulation fallback option
  if (!order && !simMode) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <header className="px-4 py-3 flex items-center gap-3 bg-white border-b border-black/5 shrink-0 z-30 shadow-sm">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold text-ink leading-tight">Loading Tracking Details...</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-ink-soft uppercase bg-black/5 px-2 py-1 rounded-md">
              Demo Sandbox
            </span>
            <button
              onClick={() => {
                setSimMode(true);
              }}
              className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Start Simulation
            </button>
          </div>
        </header>
        <div className="p-6 flex-1 flex flex-col justify-center items-center gap-4">
          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-48 w-full rounded-2xl animate-pulse" />
            <Skeleton className="h-10 w-full rounded-2xl animate-pulse" />
          </div>
          <p className="text-sm text-ink-soft text-center mt-2">
            Connecting to database... or tap <strong className="text-brand-600">Start Simulation</strong> above to test the map tracking UI.
          </p>
        </div>
      </div>
    );
  }

  // Active properties based on mode
  const activeOrder: Order = simMode
    ? {
        id: orderId || "sim-order-id",
        customerId: profile?.id || "sim-cust",
        customerName: profile?.name || "Test Customer",
        storeName: order?.storeName || "Sunrise Supermarket",
        category: order?.category || "grocery",
        status: (() => {
          if (simStep <= 3) return "worker_assigned";
          if (simStep >= 4 && simStep <= 6) return "in_progress";
          if (simStep === 7) return "checkout_approvals";
          if (simStep >= 8 && simStep <= 11) return "delivering";
          return "completed";
        })(),
        items: order?.items || [
          { name: "Organic Whole Milk (1L)", qty: 2 },
          { name: "Fresh Hass Avocados", qty: 3 },
          { name: "Whole Grain Sourdough", qty: 1 }
        ],
        totalAmount: order?.totalAmount || 350,
        budgetCap: order?.budgetCap || 500,
        eta: (() => {
          if (simStep === 12) return "Arrived";
          if (simStep >= 11) return "1 min";
          return `${12 - Math.floor(simStep * 0.9)} mins`;
        })(),
        attachments: order?.attachments
      }
    : order!;

  const activeWorker: PickPalUser = simMode
    ? {
        id: "sim-worker",
        name: "Rohith Gowda",
        email: "rohith@pickpal.com",
        role: "worker",
        status: "active",
        verified: true,
        rating: 4.85,
        area: "Indiranagar, BLR",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      }
    : worker || {
        id: "placeholder",
        name: "Assigning Worker...",
        email: "",
        role: "worker",
        status: "active",
        verified: false,
        rating: 0,
      };

  // WebSocket live location stream (only active in real-time mode)
  const { location: wsLocation, status: wsStatus } = useLocationStream(
    !simMode ? orderId : undefined
  );

  // Priority chain: Simulation > WebSocket > Firestore order doc > Firestore user doc
  const activeWorkerPos: [number, number] | null = simMode
    ? SIM_ROUTE[simStep]
    : wsLocation
      ? [wsLocation.latitude, wsLocation.longitude]
      : activeOrder.workerLiveLat != null && activeOrder.workerLiveLng != null
        ? [activeOrder.workerLiveLat, activeOrder.workerLiveLng]
        : worker?.lat != null && worker?.lng != null
          ? [worker.lat, worker.lng]
          : null;

  const activeStorePos: [number, number] | null = simMode
    ? storePos
    : [customerLoc[0] + 0.005, customerLoc[1] + 0.005];

  // Helper to compile chat list in simulation mode
  const getSimulatedMessages = () => {
    const list = [...messages];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (simStep >= 1) {
      list.push({
        id: "sim-msg-1",
        senderId: "sim-worker",
        senderName: "Rohith (Worker)",
        senderRole: "worker",
        text: "Hi, I have accepted your request! Heading over to the store now.",
        timestamp: timeStr
      });
    }
    if (simStep >= 4) {
      list.push({
        id: "sim-msg-2",
        senderId: "sim-worker",
        senderName: "Rohith (Worker)",
        senderRole: "worker",
        text: "Arrived at Sunrise Supermarket. Picking up the items now.",
        timestamp: timeStr
      });
    }
    if (simStep >= 6) {
      list.push({
        id: "sim-msg-3",
        senderId: "sim-worker",
        senderName: "Rohith (Worker)",
        senderRole: "worker",
        text: "The Hass Avocados look great! Milk and bread are sourced as well. Moving to checkout.",
        timestamp: timeStr
      });
    }
    if (simStep >= 8) {
      list.push({
        id: "sim-msg-4",
        senderId: "sim-worker",
        senderName: "Rohith (Worker)",
        senderRole: "worker",
        text: "Checkout done! Heading to your address now.",
        timestamp: timeStr
      });
    }
    if (simStep >= 11) {
      list.push({
        id: "sim-msg-5",
        senderId: "sim-worker",
        senderName: "Rohith (Worker)",
        senderRole: "worker",
        text: "I am at your gate now. Coming up to hand over the items!",
        timestamp: timeStr
      });
    }
    if (simStep >= 12) {
      list.push({
        id: "sim-msg-6",
        senderId: "sim-worker",
        senderName: "Rohith (Worker)",
        senderRole: "worker",
        text: "Delivered! Thank you for choosing PickPal.",
        timestamp: timeStr
      });
    }

    return list;
  };

  const activeMessages = simMode ? getSimulatedMessages() : messages;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden select-none">
      {/* Sticky Header */}
      <header className="px-4 py-3 flex items-center gap-3 bg-white border-b border-black/5 shrink-0 z-30 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-extrabold text-ink leading-tight">{activeOrder.storeName}</p>
          <p className="text-xs text-ink-soft">Order #{activeOrder.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-ink-soft uppercase bg-black/5 px-2 py-1 rounded-md">
            {simMode ? "Simulation" : "Realtime"}
          </span>
          <button
            onClick={() => {
              setSimMode(!simMode);
              setSimStep(0);
              setSimPlaying(false);
            }}
            className={`w-10 h-6 rounded-full border-2 border-transparent transition-colors relative flex items-center cursor-pointer focus:outline-none ${
              simMode ? "bg-brand-500" : "bg-black/15"
            }`}
          >
            <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${simMode ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
      </header>

      {/* Main Grid: Full Height Flex Map + Collapsible Sidebar */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        
        {/* Left pane: Leaflet Map */}
        <div className="flex-1 relative h-full min-h-[30vh]">
          <LiveMap
            customerPos={customerLoc}
            workerPos={activeWorkerPos}
            storePos={activeStorePos}
            height="100%"
          />

          {/* SOS Floating Action */}
          <div className="absolute top-4 right-4 z-20">
            <SosButton orderId={activeOrder.id} />
          </div>

          {/* Floating Live Indicator Badge */}
          {activeWorkerPos && (
            <div className="absolute bottom-6 left-6 z-20 bg-white px-3.5 py-2 rounded-full border border-black/5 shadow-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping shrink-0" />
              <span className="text-xs font-bold text-ink flex items-center gap-1">
                <Clock size={12} className="text-brand-500" />
                ETA: {activeOrder.eta || "calculating..."}
              </span>
            </div>
          )}

          {/* WebSocket Connection Status (Real-time mode only) */}
          {!simMode && (
            <div className={`absolute bottom-6 right-6 z-20 px-3 py-1.5 rounded-full border shadow-md flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${
              wsStatus === "connected"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : wsStatus === "reconnecting" || wsStatus === "connecting"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {wsStatus === "connected" ? <Wifi size={11} /> : <WifiOff size={11} />}
              {wsStatus === "connected" ? "Live" : wsStatus === "reconnecting" ? "Reconnecting…" : wsStatus === "connecting" ? "Connecting…" : "Offline"}
            </div>
          )}
        </div>

        {/* Right pane: Framer Motion Sliding Detail Panel */}
        <motion.div
          animate={{ y: panelOpen ? "0%" : "calc(100% - 90px)" }}
          initial={{ y: "0%" }}
          transition={{ type: "spring", damping: 24, stiffness: 130 }}
          className="absolute md:relative bottom-0 left-0 right-0 md:w-[420px] bg-white border-t md:border-t-0 md:border-l border-black/10 shadow-2xl z-20 flex flex-col h-[60vh] md:h-full rounded-t-3xl md:rounded-t-0 select-none overflow-hidden shrink-0"
        >
          {/* Drawer Handle (Mobile only) */}
          <div
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-full py-3 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors md:hidden shrink-0"
          >
            <div className="w-12 h-1.5 bg-black/15 rounded-full" />
          </div>

          {/* Panel Header (Always visible) */}
          <div className="px-5 pb-4 pt-2 md:pt-4 border-b border-black/5 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 overflow-hidden flex items-center justify-center font-bold text-brand-600 shrink-0 border border-brand-200">
              {activeWorker.avatar ? (
                <img src={activeWorker.avatar} alt={activeWorker.name} className="w-full h-full object-cover" />
              ) : (
                activeWorker.name[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-extrabold text-ink text-base leading-tight truncate">{activeWorker.name}</p>
              <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                <Star size={11} fill="#D9871A" color="#D9871A" />
                {activeWorker.rating?.toFixed(2) || "5.00"} · {activeWorker.area || "Nearby"}
              </p>
            </div>
            {order?.workerId && (
              <button
                onClick={() => { call.start(); setCallOpen(true); }}
                className="flex items-center gap-1 rounded-full bg-brand-500 text-white text-xs font-semibold px-4 py-2.5 shrink-0 shadow-md hover:bg-brand-600 transition-colors"
              >
                <Phone size={13} /> Call
              </button>
            )}
          </div>

          {/* Panel Body Scroll Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-slate-50/50">
            
            {/* Simulation Controller Console */}
            {simMode && (
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink-soft">SIMULATION CONTROLS</span>
                  <span className="font-mono text-brand-600 font-bold">Step {simStep + 1} / {SIM_ROUTE.length}</span>
                </div>
                
                {/* Horizontal Progress line */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${((simStep + 1) / SIM_ROUTE.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSimPlaying(!simPlaying)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                        simPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-brand-500 hover:bg-brand-600 text-white"
                      }`}
                    >
                      {simPlaying ? <Pause size={13} /> : <Play size={13} />}
                      {simPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      onClick={() => {
                        setSimStep(0);
                        setSimPlaying(false);
                      }}
                      className="rounded-xl px-3 py-2 text-xs font-semibold bg-black/5 hover:bg-black/10 text-ink-soft flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={13} />
                      Reset
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl">
                    {([1, 2, 5] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSimSpeed(s)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-extrabold transition-all ${
                          simSpeed === s
                            ? "bg-white text-brand-500 shadow-sm"
                            : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeOrder.status === "completed" && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/10 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-ink dark:text-zinc-100">Service Task Completed</h3>
                    <p className="text-[10px] text-ink-soft dark:text-zinc-400 mt-0.5">Your receipt invoice has been generated</p>
                  </div>
                </div>
                <div className="border-t border-black/5 dark:border-white/5 pt-3.5 flex justify-between items-center text-xs font-medium text-ink-soft">
                  <span>Total Amount Paid:</span>
                  <span className="font-extrabold text-sm text-brand-600 dark:text-brand-400">₹{activeOrder.totalAmount || activeOrder.budgetCap}</span>
                </div>
                <button
                  onClick={() => downloadInvoicePdf(activeOrder)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Download size={14} /> Download PDF Invoice
                </button>
              </div>
            )}

            {/* Stepper Status Notification Card */}
            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Navigation size={15} className="text-brand-500 animate-pulse" />
                <span className="text-xs font-bold text-ink uppercase tracking-wider">Active Status</span>
              </div>
              <p className="text-sm font-semibold text-ink leading-tight">
                {STEP_LABELS[activeOrder.status]}
              </p>
              <div className="w-full flex items-center justify-between gap-1.5 pt-1">
                {(["worker_assigned", "in_progress", "delivering", "completed"] as OrderStatus[]).map((st, i) => {
                  const states = ["worker_assigned", "in_progress", "checkout_approvals", "delivering", "completed"];
                  const currentIdx = states.indexOf(activeOrder.status);
                  const stepIdx = states.indexOf(st);
                  const isDone = currentIdx >= stepIdx;
                  const isActive = activeOrder.status === st || (st === "in_progress" && activeOrder.status === "checkout_approvals");
                  return (
                    <React.Fragment key={st}>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all border ${
                          isDone
                            ? "bg-brand-500 text-white border-brand-500"
                            : "bg-slate-100 border-black/5 text-ink-soft"
                        } ${isActive ? "ring-2 ring-brand-500/30 scale-110" : ""}`}
                      >
                        {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
                      </div>
                      {i < 3 && (
                        <div
                          className={`flex-1 h-0.5 rounded-full transition-colors ${
                            currentIdx > stepIdx ? "bg-brand-500" : "bg-black/5"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Attachments & Instructions Card */}
            {activeOrder.attachments?.details && (
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider">
                  <ShoppingBag size={14} className="text-brand-500" />
                  <span>Customer Instructions</span>
                </div>
                <p className="text-sm text-ink bg-slate-50 border border-black/5 rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap">
                  {activeOrder.attachments.details}
                </p>
              </div>
            )}

            {/* Checklist Progress Card */}
            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-ink-soft uppercase tracking-wider">
                <span>Items Sourcing Checklist</span>
                <span className="text-brand-500">
                  {(() => {
                    if (simMode) {
                      if (simStep <= 4) return `0 / ${activeOrder.items.length}`;
                      if (simStep === 5) return `1 / ${activeOrder.items.length}`;
                      if (simStep === 6) return `2 / ${activeOrder.items.length}`;
                      return `${activeOrder.items.length} / ${activeOrder.items.length}`;
                    }
                    return activeOrder.status === "completed"
                      ? `${activeOrder.items.length} / ${activeOrder.items.length}`
                      : `Sourcing...`;
                  })()}
                </span>
              </div>
              <div className="space-y-2.5">
                {activeOrder.items.map((it, idx) => {
                  const isChecked = (() => {
                    if (simMode) {
                      if (simStep <= 4) return false;
                      if (simStep === 5) return idx === 0;
                      if (simStep === 6) return idx <= 1;
                      return true;
                    }
                    return activeOrder.status === "completed" || activeOrder.status === "delivering";
                  })();

                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? "bg-mint-600 border-mint-600 text-white" : "border-black/20"
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className={`transition-all ${isChecked ? "line-through text-ink-soft/60" : "text-ink"}`}>
                          {it.name}
                        </span>
                      </div>
                      <span className="font-mono text-ink-soft text-xs">×{it.qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sourced Media Attachments (Images, Videos, Audio) */}
            {activeOrder.attachments && (activeOrder.attachments.images || activeOrder.attachments.videos || activeOrder.attachments.voice) && (
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
                <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">Customer Attachments</span>
                
                {/* Images */}
                {activeOrder.attachments.images && activeOrder.attachments.images.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeOrder.attachments.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-black/5 shrink-0 shadow-sm hover:opacity-90">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Videos */}
                {activeOrder.attachments.videos && activeOrder.attachments.videos.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {activeOrder.attachments.videos.map((vid, idx) => (
                      <video key={idx} src={vid} controls className="w-full rounded-lg border border-black/5 shadow-sm" />
                    ))}
                  </div>
                )}

                {/* Voice note */}
                {activeOrder.attachments.voice && (
                  <div className="bg-amber-50/50 rounded-xl p-2 border border-amber-100/50">
                    <audio src={activeOrder.attachments.voice} controls className="h-8 max-w-full" />
                  </div>
                )}
              </div>
            )}

            {/* Live Chat Panel (Embed inside details scroll view) */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col" style={{ height: 350 }}>
              <div className="bg-slate-50 px-4 py-2.5 border-b border-black/5 flex items-center gap-1.5 shrink-0">
                <MessageSquare size={13} className="text-brand-500" />
                <span className="text-xs font-bold text-ink uppercase tracking-wider">Live Chat Timeline</span>
              </div>
              <div className="flex-1 min-h-0 relative">
                <ChatPanel
                  messages={activeMessages}
                  currentUserId={profile?.id ?? ""}
                  onSend={(text) => {
                    if (simMode) {
                      // Sim mode quick messages echo back
                      alert("You are in simulation mode. Switch off simulation to chat in real-time.");
                      return;
                    }
                    send({ senderId: profile!.id, senderName: profile!.name, senderRole: "customer", text });
                  }}
                />
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      <CallSheet
        open={callOpen}
        onClose={() => setCallOpen(false)}
        peerName={activeWorker.name}
        peerAvatar={activeWorker.avatar}
        peerPhone={activeWorker.phone}
        call={call}
      />
    </div>
  );
}
