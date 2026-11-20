import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, Sparkles, Phone, MapPin, Navigation, CheckCircle2,
  AlertTriangle, Compass, Camera, Truck, Package, ShieldCheck
} from "lucide-react";
import { FirebaseService } from "../../services/firebase.service";
import { BookingService } from "../../services/booking.service";
import { PaymentService } from "../../services/payment.service";
import { TrackingService } from "../../services/tracking.service";
import { useAuth } from "../../contexts/AuthContext";
import { useOrderMessages } from "../../hooks/useMessages";
import { getSubstitutionSuggestion } from "../../lib/assistant";
import { useCall } from "../../hooks/useCall";
import { useLocationBroadcast } from "../../hooks/useLocationSocket";
import { StatusStepper } from "../../components/shared/StatusStepper";
import { ChatPanel } from "../../components/shared/ChatPanel";
import { CallSheet } from "../../components/shared/CallSheet";
import { SosButton } from "../../components/shared/SosButton";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Order, OrderStatus, PickPalUser } from "../../types";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  worker_assigned: "travelling",
  travelling: "arrived",
  arrived: "in_progress",
  in_progress: "photo_verification",
  photo_verification: "checkout_approvals",
  checkout_approvals: "shipped",
  shipped: "delivering",
  delivering: "completed",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  worker_assigned: "Start Travelling to Physical Shop",
  travelling: "Mark Arrived at Physical Store",
  arrived: "Start Item Inspection & Sourcing",
  in_progress: "Submit Live Photos for Customer Approval",
  photo_verification: "Proceed to Checkout (Customer Approved)",
  checkout_approvals: "Dispatch Order & Add Shipping Details",
  shipped: "Start Delivery / En Route",
  delivering: "Mark Proxy Shopping Completed",
};

export default function WorkerJob() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [askingAi, setAskingAi] = useState(false);
  const [customer, setCustomer] = useState<PickPalUser | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);

  // Photo Verification State
  const [itemPhotos, setItemPhotos] = useState<string[]>([]);
  const [billPhoto, setBillPhoto] = useState<string>("");
  const [itemNotes, setItemNotes] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Courier Shipping State
  const [carrier, setCarrier] = useState("BlueDart Courier");
  const [trackingNumber, setTrackingNumber] = useState("");

  const { messages, send } = useOrderMessages(orderId);
  const call = useCall({ orderId: order?.id, peerId: order?.customerId, currentUserId: profile?.id });

  useEffect(() => {
    if (!orderId) return;
    return FirebaseService.subscribeDoc<Order>("orders", orderId, (data) => setOrder(data));
  }, [orderId]);

  useEffect(() => {
    if (!order?.customerId) { setCustomer(null); return; }
    return FirebaseService.subscribeDoc<PickPalUser>("users", order.customerId, (data) => setCustomer(data));
  }, [order?.customerId]);

  const isJobActive = !!order && order.status !== "completed" && order.status !== "cancelled" && locationSharingEnabled;
  const { broadcast } = useLocationBroadcast(
    isJobActive ? profile?.id : undefined,
    isJobActive ? orderId : undefined,
  );

  useEffect(() => {
    if (!order?.id || !locationSharingEnabled) return;
    if (order.status === "completed" || order.status === "cancelled") return;
    if (!("geolocation" in navigator)) return;

    let last = 0;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last < 5000) return;
        last = now;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        TrackingService.updateOrderWorkerLocation(order.id, lat, lng);
        broadcast(lat, lng);
      },
      (err) => console.warn("Geolocation watch error:", err.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [order?.id, order?.status, locationSharingEnabled, broadcast]);

  if (!order) return <div className="p-6"><Skeleton className="h-64 rounded-3xl" /></div>;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isBill = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.readAsDataURL(files[0]);
    reader.onload = () => {
      if (isBill) {
        setBillPhoto(reader.result as string);
      } else {
        setItemPhotos((prev) => [...prev, reader.result as string]);
      }
    };
  };

  const submitPhotoVerification = async () => {
    if (!orderId) return;
    setUploadingPhotos(true);
    try {
      await FirebaseService.updateDoc("orders", orderId, {
        status: "photo_verification",
        photoVerification: {
          status: "submitted",
          photoUrls: itemPhotos.length > 0 ? itemPhotos : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c"],
          billUrl: billPhoto || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
          itemNotes,
        },
      });
      await send({
        senderId: profile?.id || "worker",
        senderName: profile?.name || "Shopper",
        senderRole: "worker",
        text: "📸 Live product & receipt photos uploaded for your approval! Please check and confirm.",
      });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submitCourierShipping = async () => {
    if (!orderId) return;
    try {
      await FirebaseService.updateDoc("orders", orderId, {
        status: "shipped",
        shippingDetails: {
          carrier,
          trackingNumber: trackingNumber || `PKP-${Math.floor(100000 + Math.random() * 900000)}`,
          shippingFee: order.shippingFee || 249,
          estimatedDays: order.shippingDetails?.estimatedDays || "2-4 Business Days",
        },
      });
      await send({
        senderId: profile?.id || "worker",
        senderName: profile?.name || "Shopper",
        senderRole: "worker",
        text: `🚚 Order dispatched via ${carrier}! Tracking Number: ${trackingNumber || "PKP-849201"}.`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const advance = async () => {
    const next = NEXT[order.status];
    if (!next) return;
    if (next === "completed") {
      await BookingService.updateBookingStatus(order.id, "completed", {
        totalAmount: order.totalAmount || order.budgetCap,
      });
      await PaymentService.processOrderPayment(order);
    } else {
      await BookingService.updateBookingStatus(order.id, next, {
        totalAmount: order.totalAmount || order.budgetCap,
      });
    }
  };

  const askAi = async () => {
    setAskingAi(true);
    try {
      const suggestion = await getSubstitutionSuggestion(
        order.items.map((i) => i.name).join(", ") || order.storeName,
        order.budgetCap
      );
      await send({ senderId: "ai-assistant", senderName: "PickPal AI", senderRole: "ai", text: suggestion });
    } finally { setAskingAi(false); }
  };

  return (
    <div className="min-h-screen pb-10 space-y-5">
      <header className="px-4 sm:px-8 pt-4 pb-3 flex items-center gap-3 glass sticky top-0 z-30 border-b border-black/5 dark:border-white/10">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink dark:text-zinc-100">{order.storeName}</p>
          <p className="text-xs text-ink-soft dark:text-zinc-400 truncate">
            Customer: {order.customerName} ({order.shoppingMode?.toUpperCase() || "LOCAL"} PROXY)
          </p>
        </div>
        {order.workerId && (
          <button
            onClick={() => { call.start(); setCallOpen(true); }}
            className="flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold px-4 py-2 shrink-0 shadow-sm"
          >
            <Phone size={14} /> Call Customer
          </button>
        )}
      </header>

      <CallSheet
        open={callOpen}
        onClose={() => setCallOpen(false)}
        peerName={order.customerName}
        peerAvatar={customer?.avatar}
        peerPhone={customer?.phone}
        call={call}
      />

      <SosButton orderId={order.id} />

      <main className="max-w-2xl mx-auto px-4 sm:px-8 space-y-5">
        {/* Status Stepper */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-sm space-y-4">
          <StatusStepper status={order.status} />

          {/* 📸 Live Photo Verification Section for Worker */}
          {(order.status === "in_progress" || order.status === "photo_verification") && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-amber-600 dark:text-amber-400" />
                <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Mandatory Photo & Bill Verification
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Take live photos of the product and the store receipt tag. Send to customer for approval before paying!
              </p>

              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                  <Camera size={14} /> Add Product Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, false)} />
                </label>
                <label className="cursor-pointer px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-ink dark:text-white flex items-center gap-1.5">
                  <Camera size={14} /> Add Bill/Receipt Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, true)} />
                </label>
              </div>

              {itemPhotos.length > 0 && (
                <div className="flex gap-2">
                  {itemPhotos.map((p, i) => (
                    <img key={i} src={p} className="w-16 h-16 object-cover rounded-xl border" alt="Item" />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={submitPhotoVerification}
                disabled={uploadingPhotos}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs"
              >
                {uploadingPhotos ? "Uploading Photos..." : "Send Live Photos for Customer Approval"}
              </button>
            </div>
          )}

          {/* 🚚 Courier Dispatch Section for Interstate/International */}
          {(order.shoppingMode === "interstate" || order.shoppingMode === "international") && order.status === "checkout_approvals" && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-purple-600 dark:text-purple-400" />
                <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                  Courier Dispatch & Tracking Entry
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Courier Carrier (e.g. BlueDart, DHL, FedEx, IndiaPost)"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold"
                />
                <input
                  type="text"
                  placeholder="Enter Tracking Number / AWB"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={submitCourierShipping}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs"
                >
                  Save Courier Tracking & Notify Customer
                </button>
              </div>
            </div>
          )}

          {NEXT[order.status] && (
            <Button onClick={advance} className="w-full text-sm font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2">
              {NEXT_LABEL[order.status]} <ChevronRight size={16} />
            </Button>
          )}

          {order.status === "completed" && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-1">
              <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={16} /> Proxy Shopping Completed & Earnings Credited!
              </span>
            </div>
          )}
        </div>

        {/* Customer Target Location & Address */}
        {order.customerAddress && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin size={14} className="text-brand-500" />
              Customer Destination Address
            </h3>
            <p className="text-sm text-ink dark:text-zinc-200 leading-relaxed font-semibold">
              {order.customerAddress}
            </p>
          </div>
        )}

        {/* Requested Product Items */}
        <div>
          <p className="text-sm font-bold text-ink dark:text-zinc-100 mb-2">Proxy Shopping Items</p>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-ink dark:text-zinc-200 font-semibold">{it.name}</span>
                <span className="font-mono text-xs text-ink-soft dark:text-zinc-400">×{it.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={askAi} disabled={askingAi}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 rounded-2xl py-3 border border-brand-100 dark:border-brand-500/20 disabled:opacity-50">
          <Sparkles size={14} /> {askingAi ? "Asking AI..." : "Ask AI Assistant for Proxy Shopping Help"}
        </button>

        {/* Real-time Order Chat Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-black/5 dark:border-white/10 shadow-sm" style={{ height: 380 }}>
          <ChatPanel
            messages={messages}
            currentUserId={profile?.id ?? ""}
            onSend={(text) => send({ senderId: profile!.id, senderName: profile!.name, senderRole: "worker", text })}
          />
        </div>
      </main>
    </div>
  );
}
