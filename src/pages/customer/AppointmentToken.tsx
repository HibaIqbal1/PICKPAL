import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, ShieldCheck, Ticket, Users, Navigation, Trash2, ArrowLeft } from "lucide-react";
import { Appointment, LiveQueueState } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { Skeleton } from "../../components/ui/Skeleton";

export default function AppointmentToken() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [queueState, setQueueState] = useState<LiveQueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;

    const unsubApt = ShopService.subscribeAppointmentById(appointmentId, (apt) => {
      setAppointment(apt);
      setLoading(false);
    });

    return () => unsubApt();
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment) return;

    const unsubQueue = ShopService.subscribeQueueState(
      appointment.shopId,
      appointment.date,
      setQueueState
    );

    return () => unsubQueue();
  }, [appointment]);

  // Extract numeric token from Q-18
  const myTokenNum = useMemo(() => {
    if (!appointment?.queueNumber) return 0;
    const match = appointment.queueNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }, [appointment]);

  // Calculate position and wait times
  const queueStats = useMemo(() => {
    if (!queueState || !myTokenNum) {
      return { peopleAhead: 0, waitTime: 0, current: 0 };
    }

    const current = queueState.currentRunningToken || 1;
    const peopleAhead = Math.max(0, myTokenNum - current);

    // Estimate: 20 minutes per person ahead
    const waitTime = peopleAhead * 20;

    return { peopleAhead, waitTime, current };
  }, [queueState, myTokenNum]);

  const handleCancel = async () => {
    if (!appointment || !confirm("Are you sure you want to cancel this appointment queue spot?")) return;
    setCancelling(true);
    try {
      await ShopService.cancelAppointment(appointment.id);
      alert("Appointment cancelled successfully.");
      navigate("/customer");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel spot.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-16 space-y-3 max-w-sm mx-auto">
        <AlertIcon />
        <h3 className="font-bold text-ink">Ticket Not Found</h3>
        <button onClick={() => navigate("/customer")} className="text-brand-500 underline text-sm">
          Go back Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Navigation Header */}
      <button
        onClick={() => navigate("/customer")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </button>

      {/* Ticket Wrapper */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900">
        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-brand-500 to-indigo-650 p-6 text-white text-center space-y-1">
          <Ticket size={24} className="mx-auto opacity-90 animate-bounce" />
          <h2 className="font-display font-black text-lg tracking-wide">PICKPAL DIGITAL TICKET</h2>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">
            {appointment.shopName}
          </p>
        </div>

        {/* Dynamic Wait State Dashboard */}
        <div className="p-6 border-b border-dashed border-gray-100 dark:border-zinc-800 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-brand-50/40 dark:bg-brand-500/10 rounded-2xl border border-brand-100/10">
              <span className="text-[9px] uppercase font-bold tracking-wider text-ink-soft">Your Token</span>
              <p className="font-display font-black text-2xl text-brand-500 mt-1">{appointment.queueNumber}</p>
            </div>
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100/10">
              <span className="text-[9px] uppercase font-bold tracking-wider text-ink-soft">Current Serving</span>
              <p className="font-display font-black text-2xl text-indigo-500 mt-1">
                Q-{queueStats.current || "Wait"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-[10px] text-ink-soft block">People Ahead</span>
              <span className="font-display font-black text-lg text-ink">
                {appointment.status === "completed" ? "Done" : queueStats.peopleAhead}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-ink-soft block">Est. Wait Time</span>
              <span className="font-display font-black text-lg text-emerald-600 dark:text-emerald-500">
                {appointment.status === "completed"
                  ? "Served"
                  : appointment.status === "cancelled"
                  ? "Cancelled"
                  : `${queueStats.waitTime} mins`}
              </span>
            </div>
          </div>
        </div>

        {/* Check-In Details / QR Box */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          {/* Tech SVG QR Mock */}
          <div className="p-3 bg-gray-55 dark:bg-zinc-800 rounded-3xl border border-black/5 flex flex-col items-center shadow-inner">
            <svg width="140" height="140" viewBox="0 0 100 100" className="text-ink">
              {/* Fake QR code grid patterns */}
              <rect x="0" y="0" width="25" height="25" fill="currentColor" />
              <rect x="5" y="5" width="15" height="15" fill="white" />
              <rect x="10" y="10" width="5" height="5" fill="currentColor" />

              <rect x="75" y="0" width="25" height="25" fill="currentColor" />
              <rect x="80" y="5" width="15" height="15" fill="white" />
              <rect x="85" y="10" width="5" height="5" fill="currentColor" />

              <rect x="0" y="75" width="25" height="25" fill="currentColor" />
              <rect x="5" y="80" width="15" height="15" fill="white" />
              <rect x="10" y="85" width="5" height="5" fill="currentColor" />

              {/* Random block noise inside */}
              <rect x="35" y="5" width="10" height="10" fill="currentColor" />
              <rect x="55" y="15" width="15" height="5" fill="currentColor" />
              <rect x="40" y="30" width="5" height="20" fill="currentColor" />
              <rect x="65" y="45" width="20" height="10" fill="currentColor" />
              <rect x="15" y="40" width="10" height="15" fill="currentColor" />
              <rect x="45" y="65" width="15" height="15" fill="currentColor" />
              <rect x="70" y="75" width="5" height="5" fill="currentColor" />
              <rect x="85" y="85" width="10" height="10" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-bold text-ink-muted uppercase mt-2">Scan QR Code at Shop</span>
          </div>

          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-ink-soft">Check-In Verification Code</span>
            <p className="text-2xl font-display font-black tracking-widest text-indigo-650">{appointment.otp}</p>
          </div>

          {/* Core metadata details */}
          <div className="w-full bg-gray-50/50 dark:bg-zinc-800/40 p-4 rounded-2xl space-y-2 border border-black/5 dark:border-white/5 text-xs text-ink-soft">
            <div className="flex justify-between">
              <span>Booking ID</span>
              <span className="font-mono font-bold text-ink">{appointment.bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span>Service</span>
              <span className="font-bold text-ink">{appointment.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Slot</span>
              <span className="font-mono font-bold text-ink">{appointment.timeSlot} ({appointment.date})</span>
            </div>
            <div className="flex justify-between">
              <span>Staff Partner</span>
              <span className="font-bold text-ink">{appointment.staffName}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className={`font-bold capitalize ${
                appointment.status === "completed"
                  ? "text-emerald-500"
                  : appointment.status === "cancelled"
                  ? "text-red-500"
                  : "text-brand-500"
              }`}>{appointment.status.replace("_", " ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Footer Actions */}
      <div className="flex gap-3">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.shopName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-550/10 dark:text-indigo-400 text-indigo-700 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors border border-indigo-200/20"
        >
          <Navigation size={13} /> Navigate to Shop
        </a>
        {appointment.status === "confirmed" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors border border-red-200/20"
          >
            <Trash2 size={13} /> Cancel Ticket
          </button>
        )}
      </div>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg className="h-10 w-10 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
