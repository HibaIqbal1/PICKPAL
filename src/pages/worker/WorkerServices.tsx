import React, { useState, useEffect } from "react";
import { Settings, MapPin, Briefcase, Check, Save } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { SERVICES } from "../../types";
import { PageContainer, SectionCard } from "../../components/ui/PageContainer";

const RADII = [3, 5, 10, 15, 20];

export default function WorkerServices() {
  const { profile } = useAuth();
  const [radius, setRadius] = useState(5);
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(5);
  const [maxSimultaneousJobs, setMaxSimultaneousJobs] = useState(2);
  const [offeredKeys, setOfferedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.radius) setRadius(profile.radius);
      if (profile.maxJobsPerDay) setMaxJobsPerDay(profile.maxJobsPerDay);
      if (profile.maxSimultaneousJobs) setMaxSimultaneousJobs(profile.maxSimultaneousJobs);
      if (profile.servicesOffered) setOfferedKeys(profile.servicesOffered);
    }
  }, [profile]);

  const toggleService = (key: string) => {
    setOfferedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        radius,
        maxJobsPerDay,
        maxSimultaneousJobs,
        servicesOffered: offeredKeys,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update services & limits:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Services Offered & Limits"
      subtitle="Configure your active service checklist and operation boundary settings"
      action={
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient-indigo text-white font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : success ? "Saved Successfully!" : <><Save size={14} /> Save Changes</>}
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Radius Card */}
        <SectionCard
          title="Service Radius"
          icon={<MapPin size={18} />}
        >
          <div className="space-y-4 pt-1">
            <p className="text-3xl font-display font-black text-ink dark:text-zinc-150">{radius} km</p>
            <div className="flex flex-wrap gap-1.5">
              {RADII.map((r) => (
                <button
                  key={r}
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
            <p className="text-[11px] text-ink-soft dark:text-zinc-500 leading-normal">
              You will receive open job requests matching your category catalog within this radius.
            </p>
          </div>
        </SectionCard>

        {/* Max Job Daily limits Card */}
        <SectionCard
          title="Daily Intake Limit"
          icon={<Briefcase size={18} />}
        >
          <div className="space-y-4 pt-1">
            <p className="text-3xl font-display font-black text-ink dark:text-zinc-150">{maxJobsPerDay} Jobs</p>
            <input
              type="range"
              min="1"
              max="20"
              value={maxJobsPerDay}
              onChange={(e) => setMaxJobsPerDay(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-black/5 dark:bg-white/10 rounded-lg appearance-none h-2 cursor-pointer"
            />
            <p className="text-[11px] text-ink-soft dark:text-zinc-500 leading-normal">
              Restricts additional matching once this daily cap is reached.
            </p>
          </div>
        </SectionCard>

        {/* Simultaneous limits Card */}
        <SectionCard
          title="Simultaneous Cap"
          icon={<Settings size={18} />}
        >
          <div className="space-y-4 pt-1">
            <p className="text-3xl font-display font-black text-ink dark:text-zinc-150">{maxSimultaneousJobs} Active</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxSimultaneousJobs(n)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    maxSimultaneousJobs === n
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-soft dark:text-zinc-500 leading-normal">
              Protects you from receiving concurrent requests while already on active assignments.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Services offered list */}
      <SectionCard title="Services Catalog">
        <p className="text-xs text-ink-soft dark:text-zinc-450 mb-4 leading-normal">
          Toggle which categories you can fulfill. Unselected services won't trigger dispatch alerts.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SERVICES.map((s) => {
            const active = offeredKeys.includes(s.key);
            return (
              <div
                key={s.key}
                onClick={() => toggleService(s.key)}
                className={`border rounded-2xl p-3.5 flex items-center justify-between gap-2 cursor-pointer transition-all duration-200 select-none ${
                  active
                    ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500/20"
                    : "border-black/5 bg-black/2 dark:border-white/5 text-ink-soft dark:text-zinc-400 dark:bg-white/2 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {s.group === "home" ? "🛠" : s.group === "shopping" ? "🛒" : s.group === "pickup" ? "📦" : "👤"}
                  </span>
                  <span className="text-xs font-bold truncate text-ink dark:text-zinc-200">{s.label}</span>
                </div>

                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  active
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-black/20 dark:border-white/20"
                }`}>
                  {active && <Check size={12} />}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
