import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Star, MapPin, Phone, Clock, Users, Shield, Calendar, Check, AlertCircle } from "lucide-react";
import { Shop, ShopServicePackage, StaffMember, Appointment } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { DEMO_SHOPS, DEMO_SERVICES, DEMO_STAFF, getDemoServicesForCategory, getDemoStaffForShop } from "../../data/demoShops";

export default function ShopProfile() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<ShopServicePackage[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const preselected = (location.state as { service?: any } | null)?.service;

  // Booking states
  const [selectedService, setSelectedService] = useState<ShopServicePackage | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    if (!shopId) return;

    console.log("Route shopId:", shopId);

    // Load initial fallback demo data directly if available in DEMO_SHOPS
    const fallbackShop = DEMO_SHOPS.find((s) => s.id === shopId) || null;
    if (fallbackShop) {
      setShop(fallbackShop);
      setServices(DEMO_SERVICES[shopId] || getDemoServicesForCategory(fallbackShop.category, shopId));
      setStaff(DEMO_STAFF[shopId] || getDemoStaffForShop(shopId));
      console.log("Initially loaded fallback demo shop:", fallbackShop.name);
    }

    let unsubShop = () => {};
    let unsubSrv = () => {};
    let unsubStaff = () => {};
    let unsubApts = () => {};

    try {
      unsubShop = ShopService.subscribeShopById(shopId, (data) => {
        console.log("Firestore query result for shop:", data);
        if (data) {
          setShop(data);
          console.log("Shop loaded successfully from Firestore:", data.name);
        } else if (fallbackShop) {
          setShop(fallbackShop);
          console.log("Shop loaded successfully from Demo Fallback:", fallbackShop.name);
        }
      });
    } catch (err) {
      console.error("Firestore shop subscription error:", err);
    }

    try {
      unsubSrv = ShopService.subscribeServices(shopId, (data) => {
        if (data && data.length > 0) {
          setServices(data);
        } else if (fallbackShop) {
          setServices(DEMO_SERVICES[shopId] || getDemoServicesForCategory(fallbackShop.category, shopId));
        }
      });
    } catch (err) {
      console.error("Firestore services subscription error:", err);
    }

    try {
      unsubStaff = ShopService.subscribeStaff(shopId, (data) => {
        if (data && data.length > 0) {
          setStaff(data);
        } else {
          setStaff(DEMO_STAFF[shopId] || getDemoStaffForShop(shopId));
        }
      });
    } catch (err) {
      console.error("Firestore staff subscription error:", err);
    }

    try {
      unsubApts = ShopService.subscribeAppointmentsByShopAndDate(shopId, selectedDate, setAppointments);
    } catch (err) {
      console.error("Firestore appointments subscription error:", err);
    }

    const timer = setTimeout(() => setLoading(false), 500);

    return () => {
      unsubShop();
      unsubSrv();
      unsubStaff();
      unsubApts();
      clearTimeout(timer);
    };
  }, [shopId, selectedDate]);

  useEffect(() => {
    if (!loading && !shop) {
      console.log("Invalid shopId detected. Redirecting to directory...");
      setToastMessage("Unable to open this shop.");
      const timer = setTimeout(() => {
        navigate("/customer/shops");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, shop, navigate]);

  useEffect(() => {
    if (preselected && services.length > 0) {
      const match = services.find(
        (s) =>
          s.name.toLowerCase() === preselected.label.toLowerCase() ||
          s.name.toLowerCase().includes(preselected.key.toLowerCase()) ||
          preselected.key.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) {
        setSelectedService(match);
      }
    }
  }, [preselected, services]);

  // Generates 7 dates from today
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isHoliday = shop?.workingHours.holidays?.includes(d.toLocaleDateString("en-US", { weekday: "long" }));
      if (!isHoliday) {
        dates.push({
          raw: d.toISOString().split("T")[0],
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          num: d.getDate(),
        });
      }
    }
    return dates;
  }, [shop]);

  // Dynamic slot generation logic with lunch breaks and conflict exclusion
  const availableSlots = useMemo(() => {
    if (!shop) return [];
    const slots = [];
    const openTime = shop.workingHours.open; // e.g. "09:00"
    const closeTime = shop.workingHours.close; // e.g. "21:00"
    const duration = shop.slotDuration || 30;

    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    let current = startMinutes;

    // Parse lunch hours
    let lunchStartM = -1;
    let lunchEndM = -1;
    if (shop.workingHours.lunchStart && shop.workingHours.lunchEnd) {
      const [lsH, lsM] = shop.workingHours.lunchStart.split(":").map(Number);
      const [leH, leM] = shop.workingHours.lunchEnd.split(":").map(Number);
      lunchStartM = lsH * 60 + lsM;
      lunchEndM = leH * 60 + leM;
    }

    while (current + duration <= endMinutes) {
      // Check if slot falls in lunch break
      const isDuringLunch = current >= lunchStartM && current < lunchEndM;

      if (!isDuringLunch) {
        const hh = Math.floor(current / 60).toString().padStart(2, "0");
        const mm = (current % 60).toString().padStart(2, "0");
        const timeSlotStr = `${hh}:${mm}`;

        // Check if slot is already fully booked
        const bookingConflict = appointments.some(
          (apt) =>
            apt.timeSlot === timeSlotStr &&
            (apt.status === "confirmed" || apt.status === "checked_in") &&
            (selectedStaff ? apt.staffId === selectedStaff.id : true)
        );

        if (!bookingConflict) {
          slots.push(timeSlotStr);
        }
      }
      current += duration;
    }

    return slots;
  }, [shop, appointments, selectedStaff]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !selectedService || !selectedSlot || !profile) {
      setBookingError("Please select a service, date, and available time slot.");
      return;
    }
    if (!phone.trim()) {
      setBookingError("Contact number is required for check-in confirmation.");
      return;
    }

    setBookingInProgress(true);
    setBookingError("");

    try {
      const newApt = await ShopService.bookAppointment({
        shopId: shop.id,
        shopName: shop.name,
        customerId: profile.id,
        customerName: profile.name,
        customerPhone: phone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        staffId: selectedStaff ? selectedStaff.id : null,
        staffName: selectedStaff ? selectedStaff.name : "Any Available Staff",
        date: selectedDate,
        timeSlot: selectedSlot,
        status: "confirmed",
      });

      navigate(`/customer/appointment/${newApt.id}`);
    } catch (err: any) {
      setBookingError(err.message || "Failed to confirm appointment. Please try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4">
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-rose-600/50 animate-bounce">
            <AlertCircle size={15} />
            <span>{toastMessage}</span>
          </div>
        )}
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        <p className="text-xs text-ink-soft">Redirecting to shop directory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Cover Header Details */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-black/5 dark:border-white/5 h-64 md:h-80">
        <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold bg-brand-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
              {shop.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-black leading-tight">{shop.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs opacity-90">
              <span className="flex items-center gap-1"><MapPin size={13} className="text-brand-400" /> {shop.address}</span>
              <span className="flex items-center gap-1"><Phone size={13} className="text-indigo-400" /> {shop.contactNumber}</span>
              <span className="flex items-center gap-1"><Star size={13} className="text-amber-400 fill-amber-400" /> {shop.rating} ({shop.reviewsCount} reviews)</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 shrink-0">
            {shop.amenities.map((item) => (
              <span key={item} className="bg-white/15 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-lg">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Services & Staff Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services Offered list */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-display font-extrabold text-ink flex items-center gap-2">
              <Shield size={18} className="text-brand-500" /> Choose Service
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex justify-between items-center ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/20 dark:bg-brand-500/10 shadow-sm"
                        : "border-black/5 dark:border-white/5 hover:bg-black/2 dark:hover:bg-white/2"
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <p className="font-bold text-xs text-ink">{srv.name}</p>
                      <p className="text-[10px] text-ink-soft line-clamp-2">{srv.description}</p>
                      <span className="inline-block text-[10px] text-brand-600 bg-brand-50 dark:bg-brand-500/15 font-semibold px-2 py-0.5 rounded">
                        {srv.duration} mins
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-black text-sm text-brand-500">₹{srv.price}</p>
                      {isSelected && (
                        <span className="inline-flex w-4 h-4 rounded-full bg-brand-500 items-center justify-center text-white mt-1">
                          <Check size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred Staff Horizontal list */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-display font-extrabold text-ink flex items-center gap-2">
              <Users size={18} className="text-brand-500" /> Select Staff Member (Optional)
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              <div
                onClick={() => setSelectedStaff(null)}
                className={`cursor-pointer flex flex-col items-center p-3 rounded-2xl border min-w-[100px] text-center ${
                  selectedStaff === null
                    ? "border-brand-500 bg-brand-50/20 dark:bg-brand-500/10"
                    : "border-black/5 dark:border-white/5"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-ink-soft text-xs font-bold shadow-inner">
                  ANY
                </div>
                <p className="font-bold text-[11px] text-ink mt-2">Any Available</p>
                <p className="text-[9px] text-ink-soft mt-0.5">Quickest entry</p>
              </div>

              {staff.map((member) => {
                const isSelected = selectedStaff?.id === member.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className={`cursor-pointer flex flex-col items-center p-3 rounded-2xl border min-w-[100px] text-center ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/20 dark:bg-brand-500/10"
                        : "border-black/5 dark:border-white/5"
                    }`}
                  >
                    <img
                      src={member.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover shadow-sm bg-zinc-200"
                    />
                    <p className="font-bold text-[11px] text-ink mt-2 truncate max-w-[80px]">{member.name}</p>
                    <p className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                      ★ {member.rating.toFixed(1)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Date & Slots Selection Column */}
        <div className="space-y-6">
          <form onSubmit={handleBooking} className="glass-card rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-display font-extrabold text-ink flex items-center gap-2">
              <Calendar size={18} className="text-brand-500" /> Booking Details
            </h2>

            {/* Date Carousel Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-soft">Select Date</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {availableDates.map((d) => {
                  const isActive = selectedDate === d.raw;
                  return (
                    <button
                      type="button"
                      key={d.raw}
                      onClick={() => {
                        setSelectedDate(d.raw);
                        setSelectedSlot(""); // reset slot
                      }}
                      className={`flex flex-col items-center p-2.5 rounded-xl border min-w-[50px] transition-all ${
                        isActive
                          ? "border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/15"
                          : "border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-800 text-ink-soft"
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold tracking-wider">{d.day}</span>
                      <span className="text-sm font-black mt-0.5">{d.num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Selector Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-soft">Select Available Time Slot</label>
              {availableSlots.length === 0 ? (
                <div className="p-4 border border-dashed rounded-2xl text-center text-ink-muted text-xs">
                  No slots available for this staff/date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableSlots.map((time) => {
                    const isSelected = selectedSlot === time;
                    return (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setSelectedSlot(time)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white dark:bg-zinc-900 text-ink border-black/5 dark:border-white/5 hover:bg-gray-55"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Additional verification details */}
            <div className="space-y-3.5 pt-2 border-t border-black/5 dark:border-white/5">
              <div>
                <label className="text-[11px] font-bold text-ink-soft uppercase block mb-1">Your Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink outline-none"
                />
              </div>

              {selectedService && selectedSlot && (
                <div className="bg-brand-50/30 dark:bg-brand-500/10 p-3 rounded-2xl border border-brand-200/20 text-xs space-y-1.5">
                  <p className="flex justify-between font-medium">
                    <span>{selectedService.name}</span>
                    <span className="font-bold">₹{selectedService.price}</span>
                  </p>
                  <p className="flex justify-between text-ink-soft">
                    <span>Staff</span>
                    <span>{selectedStaff ? selectedStaff.name : "Any Available"}</span>
                  </p>
                  <p className="flex justify-between text-ink-soft">
                    <span>Time</span>
                    <span className="font-mono">{selectedDate} @ {selectedSlot}</span>
                  </p>
                </div>
              )}

              {bookingError && <p className="text-[11px] font-bold text-red-500">{bookingError}</p>}

              <Button
                type="submit"
                disabled={bookingInProgress || !selectedService || !selectedSlot}
                className="w-full"
              >
                {bookingInProgress ? "Booking Queue Ticket..." : "Book Queue Ticket & Token"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
