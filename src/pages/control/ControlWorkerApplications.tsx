import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  IdCard,
  CreditCard,
  AlertCircle,
  FileText,
  Camera,
  Search,
  ChevronRight,
  ExternalLink,
  Ban,
  Briefcase,
} from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { ControlService } from "../../services/control.service";
import { PickPalUser } from "../../types";

export default function ControlWorkerApplications() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");

  const [workers, setWorkers] = useState<PickPalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<PickPalUser | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    // Subscribe to worker accounts in real-time
    const unsub = FirebaseService.subscribeQuery<PickPalUser>("users", [], (users) => {
      const pendingList = users.filter(
        (u) =>
          u.role === "worker" &&
          (u.status === "pendingApproval" || u.verificationStatus === "pending" || !u.verified)
      );
      setWorkers(pendingList);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Update selected worker if URL query changes or list updates
  useEffect(() => {
    if (selectedId && workers.length > 0) {
      const found = workers.find((w) => w.id === selectedId);
      if (found) setSelectedWorker(found);
    }
  }, [selectedId, workers]);

  const filteredWorkers = workers.filter((w) => {
    const query = searchTerm.toLowerCase();
    return (
      (w.name || "").toLowerCase().includes(query) ||
      (w.phone || "").toLowerCase().includes(query) ||
      (w.email || "").toLowerCase().includes(query) ||
      (w.skills || []).some((s) => s.toLowerCase().includes(query))
    );
  });

  const handleApprove = async (workerId: string) => {
    if (!profile) return;
    if (!window.confirm("Are you sure you want to APPROVE this worker application?")) return;
    setSubmittingAction(true);
    try {
      await ControlService.approveWorkerApplication(workerId, profile.id);
      setSelectedWorker(null);
      setSearchParams({});
      alert("Worker application APPROVED successfully!");
    } catch (err: any) {
      console.error("Worker approval error:", err);
      alert("Failed to approve worker: " + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !profile) return;
    if (!rejectReason.trim()) {
      alert("Please provide a valid reason for rejecting this application.");
      return;
    }

    setSubmittingAction(true);
    try {
      await ControlService.rejectWorkerApplication(selectedWorker.id, profile.id, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedWorker(null);
      setSearchParams({});
      alert("Worker application REJECTED with reason recorded.");
    } catch (err: any) {
      console.error("Worker rejection error:", err);
      alert("Failed to reject worker: " + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSuspend = async (workerId: string) => {
    if (!profile) return;
    if (!window.confirm("Are you sure you want to SUSPEND this worker profile?")) return;
    setSubmittingAction(true);
    try {
      await ControlService.suspendUser(workerId, profile.id, "Manager administrative action");
      setSelectedWorker(null);
      setSearchParams({});
      alert("Worker account suspended.");
    } catch (err: any) {
      console.error("Worker suspension error:", err);
      alert("Failed to suspend worker: " + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <ControlLayout
      title="Worker Applications & Verifications"
      subtitle="Review pending worker onboarding applications, identity documents, and payout details"
    >
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by worker name, phone, email or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={16} className="text-amber-400" />
          <span>
            Pending Review: <strong className="text-amber-300 font-extrabold">{workers.length}</strong>
          </span>
        </div>
      </div>

      {/* Applications Grid / Table View */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading worker applications...</div>
      ) : filteredWorkers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <ShieldCheck size={40} className="text-emerald-400 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No pending worker applications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All submitted partner applications have been reviewed. New onboarding submissions will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {worker.name?.slice(0, 2) || "WK"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">{worker.name}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {worker.workerType === "shop_service" ? "Shop Service" : "Home Visit Worker"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    Pending
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{worker.phone || "Phone not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{worker.email || "Email not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{worker.city || worker.address || "Bengaluru"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Briefcase size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">
                      Exp: {worker.experience || "N/A"} • {worker.skills?.slice(0, 2).join(", ") || "General Services"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedWorker(worker);
                    setSearchParams({ id: worker.id });
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>View Application</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Worker Application Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-extrabold text-lg flex items-center justify-center">
                  {selectedWorker.name?.slice(0, 2) || "WK"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedWorker.name}</h3>
                  <p className="text-xs text-slate-400">
                    Worker Verification Application • ID: {selectedWorker.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedWorker(null);
                  setSearchParams({});
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* 1. Personal Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText size={14} className="text-brand-400" /> Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <p className="font-bold text-white mt-0.5">{selectedWorker.name}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <p className="font-bold text-white mt-0.5">{selectedWorker.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Email:</span>
                  <p className="font-bold text-white mt-0.5">{selectedWorker.email || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Address & Locality:</span>
                  <p className="font-bold text-white mt-0.5">
                    {selectedWorker.address || selectedWorker.area || selectedWorker.city || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Professional Details & Availability */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Briefcase size={14} className="text-indigo-400" /> Professional Details & Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Worker Service Model:</span>
                  <p className="font-bold text-indigo-300 mt-0.5 uppercase">
                    {selectedWorker.workerType === "shop_service" ? "Shop / Business Service" : "Home Visit Worker"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Experience:</span>
                  <p className="font-bold text-white mt-0.5">{selectedWorker.experience || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Skills:</span>
                  <p className="font-bold text-white mt-0.5">
                    {selectedWorker.skills?.join(", ") || "General Technician"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Working Hours:</span>
                  <p className="font-bold text-white mt-0.5">
                    {selectedWorker.workingHours
                      ? `${selectedWorker.workingHours.start} - ${selectedWorker.workingHours.end}`
                      : "09:00 - 18:00"}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Government Identity Verification */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <IdCard size={14} className="text-emerald-400" /> Identity Verification Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Aadhaar Number:</span>
                  <p className="font-bold text-emerald-300 font-mono mt-0.5">
                    {selectedWorker.aadhaarNumber || "Submitted"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">PAN Number:</span>
                  <p className="font-bold text-emerald-300 font-mono mt-0.5">
                    {selectedWorker.panNumber || "Submitted"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Phone OTP Status:</span>
                  <p className="font-bold text-emerald-400 mt-0.5">
                    {selectedWorker.otpVerified?.phone ? "Verified" : "Pending"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Email OTP Status:</span>
                  <p className="font-bold text-emerald-400 mt-0.5">
                    {selectedWorker.otpVerified?.email ? "Verified" : "Verified"}
                  </p>
                </div>
              </div>

              {/* Photo & Document Link Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {selectedWorker.selfie && (
                  <a
                    href={selectedWorker.selfie}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-between hover:border-brand-500"
                  >
                    <span className="flex items-center gap-1.5"><Camera size={13} /> Selfie Photo</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {selectedWorker.aadhaarFront && (
                  <a
                    href={selectedWorker.aadhaarFront}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-between hover:border-brand-500"
                  >
                    <span className="flex items-center gap-1.5"><IdCard size={13} /> Aadhaar Front</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {selectedWorker.aadhaarBack && (
                  <a
                    href={selectedWorker.aadhaarBack}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-between hover:border-brand-500"
                  >
                    <span className="flex items-center gap-1.5"><IdCard size={13} /> Aadhaar Back</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* 4. Bank & UPI Payout Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard size={14} className="text-purple-400" /> Payout Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">UPI ID:</span>
                  <p className="font-bold text-purple-300 mt-0.5">{selectedWorker.upi || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Bank Account:</span>
                  <p className="font-bold text-white font-mono mt-0.5">
                    {selectedWorker.bankAccount || selectedWorker.bankDetails?.accountNo || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">IFSC Code:</span>
                  <p className="font-bold text-white font-mono mt-0.5">
                    {selectedWorker.ifsc || selectedWorker.bankDetails?.ifsc || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Manager Decision Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleSuspend(selectedWorker.id)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2"
              >
                <Ban size={15} className="text-slate-400" /> Suspend Account
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => setShowRejectModal(true)}
                  className="py-3 px-5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2"
                >
                  <XCircle size={16} /> REJECT APPLICATION
                </button>

                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleApprove(selectedWorker.id)}
                  className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> APPROVE WORKER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {showRejectModal && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={24} />
              <h3 className="text-base font-extrabold text-white">Reason for Rejection</h3>
            </div>
            <p className="text-xs text-slate-400">
              Provide a clear reason for rejecting <strong>{selectedWorker.name}</strong>'s application. The worker will receive this feedback when attempting to access the worker portal.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                placeholder="e.g. Identity document photo unreadable. Please re-upload clear Aadhaar card front and back image."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
