import React, { useState, useEffect } from "react";
import { Power, MapPin, Clock, Calendar, Briefcase, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { PageContainer, SectionCard } from "../../components/ui/PageContainer";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const RADII = [3, 5, 10, 15, 20];

export default function WorkerAvailability() {
  const { profile } = useAuth();
  const [isAvailable, setIsAvailable] = useState(profile?.isAvailable ?? false);
  const [area, setArea] = useState(profile?.area || "");
  const [radius, setRadius] = useState(profile?.radius || 5);
  const [startTime, setStartTime] = useState(profile?.workingHours?.start || "09:00");
  const [endTime, setEndTime] = useState(profile?.workingHours?.end || "18:00");
  const [availableDays, setAvailableDays] = useState<string[]>(
    profile?.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  );
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(profile?.maxJobsPerDay || 5);
  const [maxSimultaneousJobs, setMaxSimultaneousJobs] = useState(profile?.maxSimultaneousJobs || 2);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.isAvailable !== undefined) setIsAvailable(profile.isAvailable);
      if (profile.area) setArea(profile.area);
      if (profile.radius) setRadius(profile.radius);
      if (profile.workingHours?.start) setStartTime(profile.workingHours.start);
      if (profile.workingHours?.end) setEndTime(profile.workingHours.end);
      if (profile.availableDays) setAvailableDays(profile.availableDays);
      if (profile.maxJobsPerDay) setMaxJobsPerDay(profile.maxJobsPerDay);
      if (profile.maxSimultaneousJobs) setMaxSimultaneousJobs(profile.maxSimultaneousJobs);
    }
  }, [profile]);

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        isAvailable,
        area,
        radius,
        workingHours: { start: startTime, end: endTime },
        availableDays,
        maxJobsPerDay,
        maxSimultaneousJobs,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update worker availability:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!profile) return;
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        isAvailable: next,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      setIsAvailable(!next);
    }
  };

  return (
    <PageContainer
      title="Availability & Working Schedule"
      subtitle="Manage online status, working hours, operational area, and daily job intake caps"
      action={
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="btn-gradient-indigo text-white font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : success ? "Saved Successfully!" : <><Save size={14} /> Save Availability</>}
        </button>
      }
    >
      {/* Online Status Header Banner */}
      <div className={`rounded-3xl p-6 border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isAvailable
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-500/20"
          : "bg-amber-50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-500/20"
      }`}>
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
            isAvailable ? "bg-emerald-600 shadow-lg shadow-emerald-600/30" : "bg-amber-500 shadow-lg shadow-amber-500/30"
          }`}>
            <Power size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="font-display font-extrabold text-lg text-ink dark:text-zinc-100">
                {isAvailable ? "You are currently ONLINE" : "You are currently OFFLINE"}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-emerald-600 animate-pulse" : "bg-amber-500"}`} />
            </div>
            <p className="text-xs text-ink-soft dark:text-zinc-400 mt-1 max-w-md">
              {isAvailable
                ? "You will receive nearby matching service requests instantly on your dashboard."
                : "Offline workers will NOT receive any new job requests or customer match alerts."}
            </p>
          </div>
        </div>

        <button
          onClick={toggleOnlineStatus}
          className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md shrink-0 border ${
            isAvailable
              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
              : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
          }`}
        >
          {isAvailable ? "Switch to OFFLINE" : "Go ONLINE Now"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Working Area & Radius */}
        <SectionCard title="Operational Service Area" icon={<MapPin size={18} className="text-indigo-500" />}>
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Primary Service Locality / Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Indiranagar, Koramangala, Whitefield"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Dispatch Radius</label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{radius} km</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      radius === r
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-soft dark:text-zinc-500 mt-1">
                Requests within {radius} km of your location will be routed to your dashboard.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Working Hours */}
        <SectionCard title="Daily Working Hours" icon={<Clock size={18} className="text-indigo-500" />}>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border border-black/10 dark:border-white/10 bg-transparent text-ink dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <p className="text-[11px] text-ink-soft dark:text-zinc-500">
              Orders will only be automatically matched during your active working hours ({startTime} - {endTime}).
            </p>
          </div>
        </SectionCard>

        {/* Days of Week */}
        <SectionCard title="Active Days Schedule" icon={<Calendar size={18} className="text-indigo-500" />}>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between ${
                      active
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-black/2 dark:bg-white/2 border-black/5 dark:border-white/5 text-ink-soft dark:text-zinc-500 hover:bg-black/5"
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    {active && <CheckCircle2 size={14} className="text-indigo-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* Max Job Capacities */}
        <SectionCard title="Capacity & Intake Limits" icon={<Briefcase size={18} className="text-indigo-500" />}>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Maximum Jobs Per Day</label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{maxJobsPerDay} Jobs</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={maxJobsPerDay}
                onChange={(e) => setMaxJobsPerDay(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-black/5 dark:bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase">Simultaneous Active Cap</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxSimultaneousJobs(n)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      maxSimultaneousJobs === n
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                        : "bg-black/5 dark:bg-white/5 border-black/5 text-ink-soft dark:text-zinc-400"
                    }`}
                  >
                    {n} Active
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
