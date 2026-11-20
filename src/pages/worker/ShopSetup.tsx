import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Clock, Calendar, CheckSquare, Plus, Save } from "lucide-react";
import { Shop } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";

const CATEGORIES = ["Salon", "Spa", "Mechanic", "Clinic", "Laundry", "Gym", "Tattoo", "Tailor"];
const AMENITIES = ["AC Available", "UPI Accepted", "Parking Available", "Wheelchair Accessible"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ShopSetup() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Salon");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [coverImage, setCoverImage] = useState("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80");
  const [logoUrl, setLogoUrl] = useState("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=150&q=80");
  
  // Working timings
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    // Check if worker has an existing shop registered
    const unsub = ShopService.subscribeShops((data) => {
      const myShop = data.find((s) => s.ownerId === profile.id);
      if (myShop) {
        setShopId(myShop.id);
        setName(myShop.name);
        setCategory(myShop.category);
        setDescription(myShop.description);
        setAddress(myShop.address);
        setContactNumber(myShop.contactNumber);
        setCoverImage(myShop.coverImage);
        setLogoUrl(myShop.logoUrl);
        setOpenTime(myShop.workingHours.open);
        setCloseTime(myShop.workingHours.close);
        if (myShop.workingHours.lunchStart) setLunchStart(myShop.workingHours.lunchStart);
        if (myShop.workingHours.lunchEnd) setLunchEnd(myShop.workingHours.lunchEnd);
        if (myShop.workingHours.holidays) setHolidays(myShop.workingHours.holidays);
        setSlotDuration(myShop.slotDuration || 30);
        if (myShop.amenities) setSelectedAmenities(myShop.amenities);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const toggleHoliday = (day: string) => {
    setHolidays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || saving) return;

    setSaving(true);
    const generatedId = shopId || "shp_" + Math.random().toString(36).substring(2, 9);

    try {
      await ShopService.registerShop({
        id: generatedId,
        name,
        ownerId: profile.id,
        category,
        description,
        address,
        coverImage,
        logoUrl,
        contactNumber,
        lat: profile.lat || 12.9716,
        lng: profile.lng || 77.5946,
        rating: 4.8,
        reviewsCount: 1,
        amenities: selectedAmenities,
        workingHours: {
          open: openTime,
          close: closeTime,
          lunchStart,
          lunchEnd,
          holidays,
        },
        slotDuration,
      });

      alert("Shop parameters saved successfully!");
      navigate("/worker/shop-dashboard");
    } catch (err: any) {
      console.error(err);
      alert("Failed to register shop: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded" />
        <div className="h-44 w-full bg-gray-200 animate-pulse rounded-2xl" />
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Store size={22} className="text-brand-500" />
        <h1 className="text-xl font-display font-extrabold text-ink">
          {shopId ? "Configure Shop Details" : "Register Your Shop"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 space-y-6">
        {/* Core details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-ink-soft uppercase border-b pb-2">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Shop/Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Classic Salon & Spa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Business Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none font-semibold"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Contact Number</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Shop Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 12th Main, Indiranagar, Bengaluru"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft block mb-1">Short Description / Intro</label>
            <textarea
              rows={2}
              placeholder="e.g. Professional hair cuts, massages, styling & groom service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none resize-none"
            />
          </div>
        </div>

        {/* Timings settings */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-ink-soft uppercase border-b pb-2">Hours & Slot Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Open Time</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Close Time</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Lunch Start</label>
              <input
                type="time"
                value={lunchStart}
                onChange={(e) => setLunchStart(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Lunch End</label>
              <input
                type="time"
                value={lunchEnd}
                onChange={(e) => setLunchEnd(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft block mb-1">Appointment Slot Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none font-semibold"
              >
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-soft block mb-1">Weekly Holidays</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const isActive = holidays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleHoliday(day)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                      isActive
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-gray-100 dark:bg-zinc-800 text-ink-soft border-black/5"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-ink-soft uppercase border-b pb-2">Amenities</h2>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map((item) => {
              const active = selectedAmenities.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleAmenity(item)}
                  className={`p-3 text-left rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${
                    active
                      ? "border-indigo-650 bg-indigo-50/20 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                      : "border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-850 hover:bg-gray-100"
                  }`}
                >
                  {item}
                  {active && <span className="text-emerald-500">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Submission */}
        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={saving} className="flex items-center gap-1.5 px-6">
            <Save size={14} />
            {saving ? "Saving Business Data..." : "Save Shop Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
