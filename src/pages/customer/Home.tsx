import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, MapPin, Compass, Star, Check, Plus, Globe,
  Truck, ShoppingBag, Shirt, Heart, Gift, Sparkles, Filter, Store, Package
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { LocationService } from "../../services/location.service";
import { SearchBar } from "../../components/shared/SearchBar";
import { CategoryGrid } from "../../components/shared/CategoryGrid";
import { PromoCarousel } from "../../components/shared/PromoCarousel";
import { OrderCard } from "../../components/shared/OrderCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCustomerOrders } from "../../hooks/useOrders";
import { WorkerService } from "../../services/worker.service";
import { ServiceDef, PickPalUser } from "../../types";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 24 } },
};

const STATES_AND_CITIES: Record<string, string[]> = {
  "Karnataka": ["Bengaluru", "Mysore", "Mangalore", "Hubli"],
  "Uttar Pradesh": ["Varanasi", "Lucknow", "Agra", "Kanpur"],
  "Maharashtra": ["Mumbai", "Pune", "Kolhapur", "Nagpur"],
  "Delhi NCR": ["Delhi", "Noida", "Gurugram"],
  "Tamil Nadu": ["Chennai", "Kanchipuram", "Coimbatore", "Madurai"],
  "Telangana": ["Hyderabad", "Warangal"],
};

export default function CustomerHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { orders, loading } = useCustomerOrders(profile?.id, profile?.name);
  const [detecting, setDetecting] = useState(false);
  const [workers, setWorkers] = useState<PickPalUser[]>([]);

  // Proxy Shopping State Filters
  const [selectedMode, setSelectedMode] = useState<"local" | "interstate" | "international">("local");
  const [targetState, setTargetState] = useState<string>("Karnataka");
  const [targetCity, setTargetCity] = useState<string>("Bengaluru");

  useEffect(() => {
    const unsub = WorkerService.subscribeWorkers((data) => {
      setWorkers(data);
    });
    return () => unsub();
  }, []);

  const active = useMemo(
    () => orders.filter((o) => o.status !== "completed" && o.status !== "cancelled"),
    [orders]
  );

  // Filter workers based on Proxy Location Filter
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (selectedMode === "local") return true;
      if (w.city && targetCity) return w.city.toLowerCase() === targetCity.toLowerCase();
      return true;
    });
  }, [workers, selectedMode, targetCity]);

  const handleServiceSelect = (s: ServiceDef) => {
    navigate("/customer/new-request", {
      state: {
        service: s,
        requestType: "shop_on_behalf",
        targetState,
        targetCity,
        mode: selectedMode,
      },
    });
  };

  const [localArea, setLocalArea] = useState<string | null>(null);
  const [localCoords, setLocalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [customAreaText, setCustomAreaText] = useState("");

  const POPULAR_AREAS = [
    "Commercial Street, Bengaluru",
    "Koramangala, Bengaluru",
    "Indiranagar, Bengaluru",
    "Devaraja Market, Mysore",
    "Weaver Colony, Varanasi",
  ];

  const detectLocation = async () => {
    if (detecting) return;
    setDetecting(true);
    try {
      const coords = await LocationService.getCurrentCoordinates();
      const resolvedArea = await LocationService.reverseGeocode(coords.lat, coords.lng);
      setLocalArea(resolvedArea);
      setLocalCoords(coords);
      if (profile?.id) {
        await LocationService.updateUserLocation(profile.id, coords.lat, coords.lng, resolvedArea);
      }
    } catch (err) {
      console.error("GPS detection error:", err);
    } finally {
      setDetecting(false);
    }
  };

  const handleApplyCustomArea = async (areaName: string) => {
    if (!areaName.trim()) return;
    const cleanArea = areaName.trim();
    setLocalArea(cleanArea);
    setIsEditingArea(false);
    setCustomAreaText("");
    if (profile?.id) {
      const lat = localCoords?.lat || profile.lat || 12.9352;
      const lng = localCoords?.lng || profile.lng || 77.6245;
      await LocationService.updateUserLocation(profile.id, lat, lng, cleanArea);
    }
  };

  const displayArea = localArea || profile?.area || "Bangalore, India";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* ── Core PickPal Definition Banner ───────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-3xl overflow-hidden w-full p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-brand-500/20 bg-slate-950 text-white"
      >
        <img
          src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80"
          alt="Proxy Shopping"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(125deg, rgba(15,10,25,0.95) 0%, rgba(225,29,72,0.7) 65%, rgba(124,58,237,0.8) 100%)" }}
        />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 text-white uppercase tracking-wider backdrop-blur-md">
              Personal Proxy Shopping & Shipping
            </span>
            <span className="text-xs font-bold text-pink-200">Customer Busy? We Shop For You!</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white leading-tight">
            You are busy. <br />
            Our free worker buys & ships for you.
          </h1>

          <p className="text-sm text-white/90 max-w-xl leading-relaxed">
            Need Mysore Silk from Mysore? Banarasi Saree from Varanasi? Or Indian sweets shipped to USA? Our trusted local proxy workers visit physical shops, photo-verify products, and deliver locally or courier globally.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <motion.button
              onClick={() => navigate("/customer/new-request", { state: { mode: selectedMode, targetState, targetCity } })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-950 font-extrabold text-sm px-5 py-3 shadow-lg hover:bg-slate-100 transition-all"
            >
              <ShoppingBag size={17} className="text-brand-600" />
              Request Proxy Shopper
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── 3 Key Features: Shopping Mode Switcher ────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card rounded-3xl p-4 sm:p-5 border border-brand-500/20 bg-white/80 dark:bg-zinc-900/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Select Proxy Shopping Mode</h2>
          <p className="text-sm font-extrabold text-ink dark:text-white mt-0.5">Where do you need your personal shopper?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mode 1: Local */}
          <div
            onClick={() => setSelectedMode("local")}
            className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 space-y-2 relative overflow-hidden ${
              selectedMode === "local"
                ? "border-brand-500 bg-brand-50/70 dark:bg-brand-500/10 shadow-md"
                : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🏙️</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500 text-white">Same City</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-ink dark:text-white">1. Local Proxy Shopping</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-snug">
                Busy in Bangalore? Worker goes to Commercial St or local shop & delivers same day.
              </p>
            </div>
          </div>

          {/* Mode 2: Interstate */}
          <div
            onClick={() => setSelectedMode("interstate")}
            className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 space-y-2 relative overflow-hidden ${
              selectedMode === "interstate"
                ? "border-purple-500 bg-purple-50/70 dark:bg-purple-500/10 shadow-md"
                : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🚚</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white">Interstate Courier</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-ink dark:text-white">2. State-Wide Proxy</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-snug">
                In Bangalore wanting Banarasi Saree from Varanasi? Worker in UP buys & couriers across states.
              </p>
            </div>
          </div>

          {/* Mode 3: International NRI */}
          <div
            onClick={() => setSelectedMode("international")}
            className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 space-y-2 relative overflow-hidden ${
              selectedMode === "international"
                ? "border-blue-500 bg-blue-50/70 dark:bg-blue-500/10 shadow-md"
                : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">✈️</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white">NRI Global</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-ink dark:text-white">3. International Proxy</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-snug">
                Resident in USA/UK? Worker in India buys authentic sweets, sarees & ghee, shipping globally.
              </p>
            </div>
          </div>
        </div>

        {/* ── Interstate / Worker Location Filter Bar ────────────────────── */}
        {(selectedMode === "interstate" || selectedMode === "local") && (
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                <Filter size={14} className="text-brand-500" />
                Target Worker Location Filter:
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                Shoppers active in {targetCity}, {targetState}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                <span>State:</span>
                <select
                  value={targetState}
                  onChange={(e) => {
                    const st = e.target.value;
                    setTargetState(st);
                    if (STATES_AND_CITIES[st]) setTargetCity(STATES_AND_CITIES[st][0]);
                  }}
                  className="bg-transparent border-none font-extrabold text-brand-600 dark:text-brand-400 focus:outline-none cursor-pointer"
                >
                  {Object.keys(STATES_AND_CITIES).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                <span>City:</span>
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="bg-transparent border-none font-extrabold text-brand-600 dark:text-brand-400 focus:outline-none cursor-pointer"
                >
                  {(STATES_AND_CITIES[targetState] || ["Bengaluru"]).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── GPS & Location Header ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/60 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 flex items-center justify-center shrink-0">
            <MapPin size={20} className="text-brand-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Your Delivery Address</p>
            <p className="text-sm font-extrabold text-ink dark:text-white">{displayArea}</p>
          </div>
        </div>
        <button
          onClick={detectLocation}
          disabled={detecting}
          className="btn-gradient-brand text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
        >
          <Compass size={13} className={detecting ? "animate-spin" : ""} />
          {detecting ? "Locating..." : "Detect GPS"}
        </button>
      </motion.div>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder='Search "Mysore Silk", "Banarasi Saree", "Nandini Ghee", "Commercial St"…'
        />
      </motion.div>

      {/* ── Active Orders ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {active.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink dark:text-zinc-100">Active Proxy Orders</p>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500 text-white">
                {active.length} In Progress
              </span>
            </div>
            {loading && <Skeleton className="h-20" />}
            {active.map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => navigate(`/customer/track/${o.id}`)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Promo Carousel ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PromoCarousel />
      </motion.div>

      {/* ── Featured Proxy Categories ──────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-display font-extrabold text-ink dark:text-zinc-100 flex items-center gap-2">
            <Star size={17} className="text-amber-500 fill-amber-500" />
            Curated Proxy Shopping Categories
          </p>
        </div>
        <CategoryGrid limit={12} searchQuery={search} onSelect={handleServiceSelect} />
      </motion.div>

      {/* ── Verified Proxy Workers Nearby / Target Location ───────────── */}
      <motion.div variants={itemVariants} className="glass-card rounded-3xl p-5 space-y-3 bg-white/80 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink dark:text-zinc-100 flex items-center gap-2">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            Verified Proxy Shoppers in {targetCity}, {targetState}
          </h3>
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
            ● {filteredWorkers.length} Shoppers Online
          </span>
        </div>

        <div className="space-y-2">
          {filteredWorkers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-zinc-400 py-2">No active workers currently in {targetCity}. Request anyway and our system will dispatch the nearest available shopper!</p>
          ) : (
            filteredWorkers.slice(0, 4).map((w) => (
              <div key={w.id} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl text-xs border border-slate-100 dark:border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-600 font-extrabold flex items-center justify-center text-sm">
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-ink dark:text-zinc-100">{w.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} className="text-brand-500" />
                      {w.city || targetCity}, {w.area || "City Center Bazaar Specialist"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Ready to Shop
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/customer/new-request", { state: { workerId: w.id, workerName: w.name, targetState, targetCity } })}
                    className="btn-gradient-brand text-white font-bold text-[11px] px-3 py-1.5 rounded-xl shadow"
                  >
                    Select Shopper
                  </motion.button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Bottom Proxy Guarantee Callout ───────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="rounded-3xl p-6 text-white relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-pink-950 shadow-xl border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <h3 className="text-base font-extrabold">Live Photo & Bill Verification Guarantee</h3>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Your personal proxy shopper will send clear live photos of the product and price receipt directly to your app before paying. You inspect and approve everything before final purchase!
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-pink-300">
            <Check size={14} className="text-emerald-400" /> 100% Authentic Store Receipts Guaranteed
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
