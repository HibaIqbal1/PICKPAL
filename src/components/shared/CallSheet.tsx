import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { CallState } from "../../hooks/useCall";

interface CallSheetProps {
  open: boolean;
  onClose: () => void;
  peerName: string;
  peerAvatar?: string;
  peerPhone?: string;
  call: {
    state: CallState;
    remoteStream: MediaStream | null;
    muted: boolean;
    error: string | null;
    start: () => void;
    accept: () => void;
    end: () => void;
    toggleMute: () => void;
  };
}

function useElapsed(active: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) { setSecs(0); return; }
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Full-screen in-app audio call sheet. Plays the remote WebRTC stream through
 * a hidden <audio> element and works as caller or callee depending on the
 * current CallState. Falls back to a tel: link if a phone number is present.
 */
export function CallSheet({ open, onClose, peerName, peerAvatar, peerPhone, call }: CallSheetProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const elapsed = useElapsed(call.state === "connected");

  useEffect(() => {
    const el = audioRef.current;
    if (el && call.remoteStream) { el.srcObject = call.remoteStream; el.play().catch(() => {}); }
    return () => { if (el) el.srcObject = null; };
  }, [call.remoteStream]);

  // Auto-close shortly after the call ends.
  useEffect(() => {
    if (call.state === "ended") {
      const t = setTimeout(onClose, 1200);
      return () => clearTimeout(t);
    }
  }, [call.state, onClose]);

  if (!open) return null;

  const statusText =
    call.state === "calling" ? "Calling…"
    : call.state === "ringing" ? "Incoming call"
    : call.state === "connected" ? elapsed
    : call.state === "ended" ? "Call ended"
    : call.state === "error" ? "Call failed"
    : "";

  const incoming = call.state === "ringing";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between py-16 px-6 text-white"
      style={{ background: "linear-gradient(160deg,#1A1523,#3A2E42)" }}
    >
      <audio ref={audioRef} autoPlay />

      <div className="text-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 ring-4 ring-white/15 mx-auto">
            {peerAvatar ? (
              <img src={peerAvatar} alt={peerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-white/80">
                {peerName[0]}
              </div>
            )}
          </div>
          {(call.state === "calling" || call.state === "ringing" || call.state === "connected") && (
            <div className="absolute inset-0 rounded-full ring-4 ring-brand-500/60 animate-ping" />
          )}
        </div>
        <p className="text-xl font-display font-bold mt-5">{peerName}</p>
        <p className="text-sm text-white/70 mt-1 flex items-center justify-center gap-2">
          {call.state === "connected" && <span className="w-2 h-2 rounded-full bg-mint-600 animate-pulse" />}
          {statusText}
        </p>
        {call.error && <p className="text-xs text-red-300 mt-2 max-w-xs mx-auto">{call.error}</p>}
      </div>

      <div className="flex items-center gap-6">
        {call.state === "connected" && (
          <button onClick={call.toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${call.muted ? "bg-red-500" : "bg-white/15"}`}>
            {call.muted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
        )}

        {incoming ? (
          <>
            <button onClick={call.accept}
                    className="w-16 h-16 rounded-full bg-mint-600 flex items-center justify-center shadow-lg shadow-mint-600/30">
              <Phone size={26} />
            </button>
            <button onClick={call.end}
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <PhoneOff size={26} />
            </button>
          </>
        ) : (
          <button onClick={call.end}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
            {call.state === "calling" ? <Loader2 size={26} className="animate-spin" /> : <PhoneOff size={26} />}
          </button>
        )}
      </div>

      {peerPhone && (
        <a href={`tel:${peerPhone}`}
           className="text-xs text-white/60 underline underline-offset-2 hover:text-white/90">
          or call {peerPhone} directly
        </a>
      )}
    </motion.div>
  );
}
