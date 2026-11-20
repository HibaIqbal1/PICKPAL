import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Phone,
  Mail,
  MapPin,
  Star,
  RefreshCcw,
  UserCheck,
} from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { ControlService } from "../../services/control.service";
import { PickPalUser, UserStatus } from "../../types";

export default function ControlWorkers() {
  const { profile } = useAuth();
  const [workers, setWorkers] = useState<PickPalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<PickPalUser>("users", [], (users) => {
      const workerList = users.filter((u) => u.role === "worker");
      setWorkers(workerList);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredWorkers = workers.filter((w) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (w.name || "").toLowerCase().includes(query) ||
      (w.phone || "").toLowerCase().includes(query) ||
      (w.email || "").toLowerCase().includes(query) ||
      (w.skills || []).some((s) => s.toLowerCase().includes(query)) ||
      (w.area || w.city || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === "pending") {
      return w.status === "pendingApproval" || w.verificationStatus === "pending" || !w.verified;
    }
    if (statusFilter === "approved") {
      return w.status === "active" || w.verified;
    }
    if (statusFilter === "rejected") {
      return w.status === "rejected" || w.verificationStatus === "rejected";
    }
    if (statusFilter === "suspended") {
      return w.status === "suspended";
    }

    return true;
  });

  const handleSuspend = async (workerId: string) => {
    if (!profile) return;
    if (!window.confirm("Are you sure you want to SUSPEND this worker?")) return;
    try {
      await ControlService.suspendUser(workerId, profile.id, "Manager administrative suspension");
      alert("Worker suspended.");
    } catch (err: any) {
      alert("Failed to suspend worker: " + err.message);
    }
  };

  const handleReactivate = async (workerId: string) => {
    if (!profile) return;
    if (!window.confirm("Reactivate this worker account to active status?")) return;
    try {
      await ControlService.reactivateUser(workerId, profile.id);
      alert("Worker reactivated.");
    } catch (err: any) {
      alert("Failed to reactivate worker: " + err.message);
    }
  };

  return (
    <ControlLayout
      title="Worker Operations Roster"
      subtitle="Complete partner directory, service availability, ratings, and status management"
    >
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by worker name, phone, service, locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          {[
            { id: "all", label: "All Workers" },
            { id: "approved", label: "Active" },
            { id: "pending", label: "Pending" },
            { id: "rejected", label: "Rejected" },
            { id: "suspended", label: "Suspended" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Roster Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading worker roster...</div>
      ) : filteredWorkers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
          <Briefcase size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No workers found</h3>
          <p className="text-xs text-slate-400">No worker profiles match the selected status or search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => {
            const isApproved = worker.status === "active" || worker.verified;
            const isPending =
              worker.status === "pendingApproval" || worker.verificationStatus === "pending";
            const isRejected = worker.status === "rejected" || worker.verificationStatus === "rejected";
            const isSuspended = worker.status === "suspended";

            return (
              <div
                key={worker.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top info header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand-600/10 border border-brand-500/30 text-brand-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {worker.name?.slice(0, 2) || "WK"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">{worker.name}</h4>
                        <p className="text-xs text-slate-400 truncate">
                          {worker.workerType === "shop_service" ? "Shop / Business Service" : "Home Visit Worker"}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                        isApproved
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : isPending
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : isRejected
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-slate-700 text-slate-300 border-slate-600"
                      }`}
                    >
                      {isApproved
                        ? "Active"
                        : isPending
                        ? "Pending"
                        : isRejected
                        ? "Rejected"
                        : "Suspended"}
                    </span>
                  </div>

                  {/* Worker details */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        Rating: <strong className="text-white">{worker.rating || "5.0"}</strong>
                      </span>
                      <span>
                        Jobs Completed: <strong className="text-emerald-400">{worker.completedJobsCount || 0}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate">{worker.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate">{worker.area || worker.city || "Bengaluru"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Briefcase size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate">
                        Skills: {worker.skills?.slice(0, 3).join(", ") || "Electrician, Repair"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Worker actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isSuspended ? (
                    <button
                      onClick={() => handleReactivate(worker.id)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCcw size={14} /> Reactivate Worker
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspend(worker.id)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/10 border border-slate-700 text-slate-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Ban size={14} /> Suspend Account
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ControlLayout>
  );
}
