import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, UserCheck, Calendar, Clock, Plus, Play, UserX, CheckCircle, RefreshCw, Settings, Users, ShieldAlert } from "lucide-react";
import { Shop, Appointment, LiveQueueState, StaffMember, ShopServicePackage } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";

export default function ShopDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [shop, setShop] = useState<Shop | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueState, setQueueState] = useState<LiveQueueState | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ShopServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"queue" | "completed" | "skipped" | "staff">("queue");

  // Walk-in modal
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [selectedSrvId, setSelectedSrvId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [walkInError, setWalkInError] = useState("");
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!profile?.id) return;

    // Fetch this worker's shop
    const unsubShops = ShopService.subscribeShops((data) => {
      const myShop = data.find((s) => s.ownerId === profile.id);
      if (myShop) {
        setShop(myShop);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubShops();
  }, [profile]);

  useEffect(() => {
    if (!shop) return;

    // Subscriptions
    const unsubApts = ShopService.subscribeAppointmentsByShopAndDate(shop.id, todayStr, setAppointments);
    const unsubQueue = ShopService.subscribeQueueState(shop.id, todayStr, setQueueState);
    const unsubStaff = ShopService.subscribeStaff(shop.id, setStaffList);
    const unsubServices = ShopService.subscribeServices(shop.id, setServices);

    return () => {
      unsubApts();
      unsubQueue();
      unsubStaff();
      unsubServices();
    };
  }, [shop, todayStr]);

  const activeQueue = appointments.filter(
    (apt) => apt.status === "confirmed" || apt.status === "checked_in"
  );
  const completedQueue = appointments.filter((apt) => apt.status === "completed");
  const skippedQueue = appointments.filter((apt) => apt.status === "skipped" || apt.status === "cancelled");

  // Queue actions
  const handleCheckIn = async (id: string) => {
    try {
      await ShopService.checkInAppointment(id);
    } catch (err) { console.error(err); }
  };

  const handleSkip = async (id: string) => {
    try {
      await ShopService.skipAppointment(id);
    } catch (err) { console.error(err); }
  };

  const handleComplete = async (id: string, staffId: string | null) => {
    if (!shop) return;
    try {
      await ShopService.completeAppointment(id, shop.id, todayStr, staffId);
    } catch (err) { console.error(err); }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    if (!walkInName.trim() || !walkInPhone.trim() || !selectedSrvId) {
      setWalkInError("Name, phone, and service selection are required.");
      return;
    }

    const serviceObj = services.find((s) => s.id === selectedSrvId);
    if (!serviceObj) return;

    const staffObj = staffList.find((st) => st.id === selectedStaffId);

    setSubmittingWalkIn(true);
    setWalkInError("");

    try {
      await ShopService.addWalkInCustomer(
        shop.id,
        shop.name,
        walkInName,
        walkInPhone,
        serviceObj.name,
        serviceObj.price,
        staffObj ? staffObj.id : null,
        staffObj ? staffObj.name : "Any Available Staff"
      );

      // Reset
      setWalkInName("");
      setWalkInPhone("");
      setSelectedSrvId("");
      setSelectedStaffId("");
      setIsWalkInOpen(false);
    } catch (err: any) {
      setWalkInError(err.message || "Failed to add walk-in.");
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Onboarding prompt if no shop exists
  if (!shop) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
        <ShieldAlert size={48} className="mx-auto text-indigo-600" />
        <div>
          <h2 className="font-display font-black text-xl text-ink">Establish Shop Workspace</h2>
          <p className="text-xs text-ink-soft mt-1">
            Configure your shop operating hours, service catalog, weekly holidays, slot durations, and staff list to activate smart queues.
          </p>
        </div>
        <Button onClick={() => navigate("/worker/shop-setup")} className="w-full">
          Configure Business Shop Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-750 p-6 rounded-3xl text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Store size={20} className="opacity-95" />
            <h1 className="text-xl font-display font-black leading-none">{shop.name}</h1>
          </div>
          <p className="text-xs opacity-90">Live Queue dashboard for {todayStr}</p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-6 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Running Token</span>
            <p className="text-2xl font-display font-black mt-0.5">
              Q-{queueState?.currentRunningToken || 0}
            </p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Total Queue</span>
            <p className="text-2xl font-display font-black mt-0.5">{queueState?.totalQueueCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Control Actions Shortcut bar */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setIsWalkInOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-brand-500/15"
        >
          <Plus size={15} /> Add Walk-In Customer
        </button>
        <button
          onClick={() => navigate("/worker/shop-staff")}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 border border-black/5 dark:border-white/5"
        >
          <Users size={15} /> Manage Staff List
        </button>
        <button
          onClick={() => navigate("/worker/shop-services")}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 border border-black/5 dark:border-white/5"
        >
          <Settings size={15} /> Manage Service Catalog
        </button>
        <button
          onClick={() => navigate("/worker/shop-setup")}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-ink font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 border border-black/5 dark:border-white/5"
        >
          Timing Configuration
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-1.5 border-b border-black/5 dark:border-white/5 pb-px">
        {[
          { key: "queue", label: `Active Queue (${activeQueue.length})` },
          { key: "completed", label: `Completed (${completedQueue.length})` },
          { key: "skipped", label: `Skipped/Cancelled (${skippedQueue.length})` },
          { key: "staff", label: `Staff Availability` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`pb-3.5 px-3 text-xs font-bold transition-all relative ${
              selectedTab === tab.key
                ? "text-brand-500 font-extrabold border-b-2 border-brand-500"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {selectedTab === "queue" && (
        <div className="space-y-4">
          {activeQueue.length === 0 ? (
            <div className="p-12 border border-dashed rounded-3xl text-center text-ink-muted text-xs">
              No clients currently waiting in queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeQueue.map((apt) => {
                const isCheckedIn = apt.status === "checked_in";
                return (
                  <div
                    key={apt.id}
                    className={`glass-card rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all duration-200 ${
                      isCheckedIn
                        ? "border-emerald-500 bg-emerald-50/5 dark:bg-emerald-500/5 shadow-md"
                        : "border-black/5 dark:border-white/5"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-sm text-brand-500">
                            {apt.queueNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-ink-soft">
                            OTP: {apt.otp}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-xs text-ink">{apt.customerName}</h3>
                        <p className="text-[10px] text-ink-soft">{apt.serviceName} · ₹{apt.price}</p>
                        <p className="text-[10px] text-indigo-500 font-semibold font-mono">
                          Slot: {apt.timeSlot}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCheckedIn
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}>
                        {isCheckedIn ? "Checked In" : "Confirmed"}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                      {!isCheckedIn ? (
                        <>
                          <button
                            onClick={() => handleCheckIn(apt.id)}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
                          >
                            <UserCheck size={12} /> Check In
                          </button>
                          <button
                            onClick={() => handleSkip(apt.id)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-ink-soft text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1"
                          >
                            <UserX size={12} /> Skip Slot
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleComplete(apt.id, apt.staffId)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 shadow-md"
                        >
                          <CheckCircle size={13} /> Complete Session & Next
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTab === "completed" && (
        <div className="glass-card rounded-3xl overflow-hidden border border-black/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-ink-soft border-b border-black/5">
              <tr>
                <th className="p-3">Token</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Service</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {completedQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink-muted">No completed jobs today.</td>
                </tr>
              ) : (
                completedQueue.map((apt) => (
                  <tr key={apt.id}>
                    <td className="p-3 font-mono font-bold text-brand-500">{apt.queueNumber}</td>
                    <td className="p-3 font-semibold">{apt.customerName}</td>
                    <td className="p-3 text-ink-soft">{apt.serviceName}</td>
                    <td className="p-3 font-semibold">{apt.staffName}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-500">₹{apt.price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTab === "skipped" && (
        <div className="glass-card rounded-3xl overflow-hidden border border-black/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-zinc-850 font-bold text-ink-soft border-b border-black/5">
              <tr>
                <th className="p-3">Token</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Service</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {skippedQueue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-ink-muted">No skipped or cancelled sessions today.</td>
                </tr>
              ) : (
                skippedQueue.map((apt) => (
                  <tr key={apt.id}>
                    <td className="p-3 font-mono font-bold text-ink-soft">{apt.queueNumber}</td>
                    <td className="p-3 font-semibold">{apt.customerName}</td>
                    <td className="p-3 text-ink-soft">{apt.serviceName}</td>
                    <td className="p-3 font-bold text-red-500 capitalize">{apt.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTab === "staff" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffList.map((st) => (
            <div key={st.id} className="glass-card rounded-3xl p-5 border border-black/5 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <img src={st.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-zinc-200" />
                <div>
                  <h3 className="font-bold text-xs">{st.name}</h3>
                  <p className="text-[10px] text-ink-soft">Experience: {st.experience}</p>
                  <p className="text-[9px] text-amber-500 font-semibold">★ {st.rating.toFixed(1)} rating</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className="block text-[9px] text-ink-soft">Served Today</span>
                <span className="block text-sm font-black text-indigo-600">{st.customersServedToday || 0}</span>
                <button
                  onClick={() => ShopService.updateStaffAvailability(st.id, !st.isAvailable)}
                  className={`mt-1.5 px-3 py-1 rounded-full text-[9px] font-bold border transition-colors ${
                    st.isAvailable
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-red-50 text-red-500 border-red-200"
                  }`}
                >
                  {st.isAvailable ? "Available" : "On Break"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fast Walk-In Add Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-black/10 shadow-2xl">
            <h3 className="font-display font-black text-base text-ink">Add Walk-In Customer</h3>
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-55 dark:bg-zinc-800 text-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Choose Service</label>
                  <select
                    required
                    value={selectedSrvId}
                    onChange={(e) => setSelectedSrvId(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-black/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none font-bold"
                  >
                    <option value="">Select...</option>
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} (₹{srv.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Assign Staff</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-black/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none font-bold"
                  >
                    <option value="">Any Available</option>
                    {staffList.filter(s => s.isAvailable).map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {walkInError && <p className="text-[10px] font-bold text-red-500">{walkInError}</p>}

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsWalkInOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-ink-soft"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={submittingWalkIn}>
                  {submittingWalkIn ? "Adding..." : "Add to Queue"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
