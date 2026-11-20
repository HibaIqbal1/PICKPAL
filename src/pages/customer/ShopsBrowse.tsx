import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, MapPin, Star, ShieldCheck, Clock, Users, Coffee, Tag } from "lucide-react";
import { Shop } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { Skeleton } from "../../components/ui/Skeleton";
import { demoShops } from "../../data/demoShops";

export default function ShopsBrowse() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedService = (location.state as { service?: any } | null)?.service;

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => [
    "All", "Salon", "Spa", "Car Wash", "Bike Service", "Mechanic", "Laundry", "Gym", "Clinic", "Tattoo Studio", "Beauty Parlour"
  ], []);

  useEffect(() => {
    // 2-second timeout to force loading off and load demo data if offline/slow
    const fallbackTimer = setTimeout(() => {
      setShops((prev) => {
        if (prev.length === 0) {
          return demoShops;
        }
        return prev;
      });
      setLoading(false);
    }, 2000);

    let unsub = () => {};
    try {
      unsub = ShopService.subscribeShops((data) => {
        if (data && data.length > 0) {
          setShops(data);
        } else {
          setShops(demoShops);
        }
        setLoading(false);
        clearTimeout(fallbackTimer);
      });
    } catch (err) {
      console.error("Error subscribing to shops:", err);
      setShops(demoShops);
      setLoading(false);
      clearTimeout(fallbackTimer);
    }

    return () => {
      unsub();
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    console.log("Loaded demo shops:", shops.length);
  }, [shops]);

  useEffect(() => {
    if (preselectedService) {
      const serviceName = (preselectedService.label || "").toLowerCase();
      const serviceCat = (preselectedService.category || "").toLowerCase();

      const matched = categories.find(
        (c) =>
          c.toLowerCase().includes(serviceName) ||
          serviceName.includes(c.toLowerCase()) ||
          c.toLowerCase().includes(serviceCat) ||
          serviceCat.includes(c.toLowerCase())
      );

      if (matched) {
        setSelectedCategory(matched);
      } else {
        setSearch(preselectedService.label || "");
      }
    }
  }, [preselectedService, categories]);

  const getShopStats = (shop: any) => {
    // Return parameters from the shop document itself if populated (e.g. from demoShops)
    const wait = shop.estimatedWait || (shop.id === "demo_toni_guy" || shop.id === "salon_1" ? "12 min" : "15 min");
    const queue = typeof shop.queueCount !== "undefined" ? shop.queueCount : (shop.id === "demo_toni_guy" || shop.id === "salon_1" ? 5 : 0);
    const price = typeof shop.tokenPrice !== "undefined" ? shop.tokenPrice : 0;
    return { wait, queue, price };
  };

  const isShopOpen = (shop: any) => {
    if (typeof shop.isOpen !== "undefined") return shop.isOpen;
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0].substring(0, 5);
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

    if (shop.workingHours?.holidays?.includes(dayName)) return false;
    if (shop.workingHours) {
      return timeStr >= shop.workingHours.open && timeStr <= shop.workingHours.close;
    }
    return true;
  };

  const filteredShops = shops.filter((shop) => {
    const matchesSearch = shop.name.toLowerCase().includes(search.toLowerCase()) ||
      shop.address.toLowerCase().includes(search.toLowerCase()) ||
      shop.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "All" || shop.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 to-indigo-650 p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Smart Queue & Shop Appointments</h1>
        <p className="text-xs text-white/80 mt-2 max-w-lg">
          Check live wait times, join active queues, or secure preferred booking slots with top local salons, clinics, spas, and auto service bays.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 dark:border-white/5">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
          <input
            type="text"
            placeholder="Search shops, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-ink-soft focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-brand-500 text-white shadow-md"
                  : "bg-gray-100 dark:bg-zinc-800 text-ink-soft hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Shops Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-3xl p-5 space-y-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 space-y-3">
          <Coffee size={40} className="mx-auto text-ink-soft/40" />
          <h3 className="font-bold text-ink">No Shops Available</h3>
          <p className="text-xs text-ink-soft">Try modifying your search filter terms or categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop: any) => {
            const stats = getShopStats(shop);
            const isOpen = isShopOpen(shop);
            const mockDistance = shop.distance || (((shop.name.length % 7) * 0.4 + 0.6).toFixed(1) + " km");
            const logoImage = shop.logo || shop.logoUrl;

            return (
              <div
                key={shop.id}
                onClick={() => {
                  console.log("Clicked shopId:", shop.id);
                  navigate(`/shops/${shop.id}`);
                }}
                className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-black/5 dark:border-white/5 flex flex-col justify-between"
              >
                <div>
                  {/* Shop Cover Image */}
                  <div className="relative h-44 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <img
                      src={shop.coverImage || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex gap-1.5 items-center">
                      <span className="bg-brand-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {shop.category}
                      </span>
                      <span className={`font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                        isOpen ? "bg-emerald-500 text-white" : "bg-rose-500/90 text-white"
                      }`}>
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>

                    {/* Logo Overlay */}
                    {logoImage && (
                      <div className="absolute bottom-3 right-3 w-12 h-12 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md">
                        <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Content details */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-extrabold text-base text-ink dark:text-zinc-100 group-hover:text-brand-500 transition-colors line-clamp-1">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1 font-bold text-[10px] text-amber-700 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg shrink-0">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        {(shop.rating || 0).toFixed(1)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-ink-soft dark:text-zinc-400">
                      <span className="flex items-center gap-1 truncate max-w-[60%]">
                        <MapPin size={13} className="text-brand-500 shrink-0" />
                        {shop.address}
                      </span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400 shrink-0">
                        {mockDistance} away
                      </span>
                    </div>

                    {/* Live Waiting and Queue Info */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-zinc-800/40 p-2.5 rounded-2xl border border-black/[0.03] dark:border-white/[0.03]">
                      <div className="text-center border-r border-black/5 dark:border-white/5 pr-1">
                        <div className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Estimated Wait</div>
                        <div className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 mt-0.5">
                          {stats.wait}
                        </div>
                      </div>
                      <div className="text-center pl-1">
                        <div className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Queue Size</div>
                        <div className="text-xs font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                          {stats.queue > 0 ? `${stats.queue} waiting` : "0 ahead"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 pt-0 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">Token Price</span>
                    <span className="text-sm font-extrabold text-ink">{stats.price > 0 ? `₹${stats.price}` : "Free"}</span>
                  </div>
                  <button className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-500/15">
                    Book Token
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
