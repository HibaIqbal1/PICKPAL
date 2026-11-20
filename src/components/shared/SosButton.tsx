import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Siren, ShieldAlert, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { createSos } from "../../hooks/useSos";

const REASONS = [
  { key: "emergency", label: "Emergency" },
  { key: "worker_misbehaviour", label: "Worker misbehaviour" },
  { key: "something_else", label: "Something else" },
];

interface SosButtonProps {
  orderId?: string;
  variant?: "floating" | "inline";
}

/**
 * Raises an SOS alert to a local manager. Captures live geolocation (if
 * granted) and a chosen reason, then writes a doc to the `sos` collection
 * that the manager/admin panel lists and resolves.
 */
export function SosButton({ orderId, variant = "floating" }: SosButtonProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("emergency");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!profile) return;
    setSending(true);
    try {
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!("geolocation" in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      await createSos({
        orderId: orderId ?? null,
        userId: profile.id,
        userName: profile.name,
        role: profile.role,
        reason,
        note: note.trim() || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        status: "open",
      } as any);
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setNote(""); }, 1600);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === "floating"
            ? "fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 flex items-center justify-center"
            : "flex items-center gap-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold px-3.5 py-2"
        }
        aria-label="Raise SOS"
      >
        <Siren size={variant === "floating" ? 22 : 14} />
        {variant === "inline" && "SOS"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5"
            >
              {done ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center mx-auto mb-2">
                    <ShieldAlert size={22} className="text-mint-600" />
                  </div>
                  <p className="font-display font-bold text-ink">SOS sent to your manager</p>
                  <p className="text-xs text-ink-soft mt-1">Help is on the way.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-display font-bold text-ink flex items-center gap-2">
                      <Siren size={18} className="text-red-600" /> Raise an SOS
                    </p>
                    <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                      <X size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-ink-soft mb-2">What's wrong?</p>
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    {REASONS.map((r) => (
                      <button key={r.key} onClick={() => setReason(r.key)}
                              className={`text-left text-sm rounded-2xl px-4 py-2.5 border
                                ${reason === r.key ? "bg-red-50 border-red-600/30 text-red-700 font-semibold" : "border-black/10 text-ink"}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                            placeholder="Add details (optional)…"
                            className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none border border-black/10 resize-none mb-3" />
                  <button onClick={submit} disabled={sending}
                          className="w-full rounded-2xl py-3 text-sm font-semibold bg-red-600 text-white disabled:opacity-60">
                    {sending ? "Sending…" : "Send SOS to manager"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
