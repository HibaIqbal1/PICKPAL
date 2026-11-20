import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, Clock, User as UserIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Requests browser geolocation once on mount and reverse-labels it generically
 * ("Current location") since a real reverse-geocode call needs a Maps API key
 * you haven't provided yet — swap in Google Maps Geocoding here once you add
 * GOOGLE_MAPS_API_KEY to your env.
 */
export function TopStatusBar({ onProfileClick }: { onProfileClick: () => void }) {
  const { profile } = useAuth();
  const [locating, setLocating] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { timeout: 5000 }
    );
  }, []);

  return (
    <div className="px-5 pt-6 pb-5 text-white" style={{ background: "linear-gradient(135deg,#FF6B35,#F7A93B)" }}>
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Clock size={15} />
            <span>{locating ? "Locating…" : "18–25 min"}</span>
            <span className="opacity-70 font-normal">· nearest worker</span>
          </div>
          <button className="flex items-center gap-1 mt-1 font-display text-lg font-semibold leading-tight">
            {coords ? "Current location" : "Set your location"} <ChevronDown size={16} />
          </button>
          <p className="text-xs opacity-80 mt-0.5">{profile ? `Hey ${profile.name.split(" ")[0]} 👋` : "Welcome to PickPal"}</p>
        </motion.div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
        >
          <UserIcon size={18} />
        </motion.button>
      </div>
    </div>
  );
}
