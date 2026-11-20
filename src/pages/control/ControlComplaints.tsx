import React, { useState, useEffect } from "react";
import { MessageSquareWarning, Search, Plus, CheckCircle2, Clock, AlertTriangle, ChevronRight, Edit2, ShieldAlert } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { ControlService } from "../../services/control.service";
import { ComplaintDoc, ComplaintPriority, ComplaintStatus } from "../../types";

const PRIORITY_BADGE: Record<string, string> = {
  Low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Critical: "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse",
};

const STATUS_BADGE: Record<string, string> = {
  Open: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Investigating: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Resolved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Closed: "bg-slate-700 text-slate-400 border-slate-600",
};

export default function ControlComplaints() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Complaint Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintDoc | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [updateStatus, setUpdateStatus] = useState<ComplaintStatus>("Open");
  const [saving, setSaving] = useState(false);

  // New Complaint Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIssue, setNewIssue] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newPriority, setNewPriority] = useState<ComplaintPriority>("Medium");

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<ComplaintDoc>("complaints", [], (comps) => {
      setComplaints(comps);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredComplaints = complaints.filter((c) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (c.id || "").toLowerCase().includes(query) ||
      (c.issue || "").toLowerCase().includes(query) ||
      (c.customerName || "").toLowerCase().includes(query) ||
      (c.workerName || "").toLowerCase().includes(query) ||
      (c.orderId || "").toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter !== "all") {
      return c.status === statusFilter;
    }

    return true;
  });

  const handleOpenDetail = (comp: ComplaintDoc) => {
    setSelectedComplaint(comp);
    setInternalNotes(comp.internalNotes || "");
    setUpdateStatus(comp.status);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !profile) return;
    setSaving(true);
    try {
      await ControlService.saveComplaint(
        {
          ...selectedComplaint,
          status: updateStatus,
          internalNotes,
          assignedTo: profile.id,
        },
        profile.id
      );
      setSelectedComplaint(null);
      alert("Complaint status & internal notes updated.");
    } catch (err: any) {
      alert("Failed to update complaint: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.trim() || !profile) return;
    setSaving(true);
    try {
      await ControlService.saveComplaint(
        {
          issue: newIssue.trim(),
          customerName: newCustomerName.trim() || "Customer Ticket",
          workerName: newWorkerName.trim() || "Unassigned Worker",
          priority: newPriority,
          status: "Open",
          assignedTo: profile.id,
        },
        profile.id
      );
      setShowAddModal(false);
      setNewIssue("");
      setNewCustomerName("");
      setNewWorkerName("");
      alert("Complaint ticket created.");
    } catch (err: any) {
      alert("Failed to create complaint: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ControlLayout
      title="Complaints & Resolution Center"
      subtitle="Track customer complaints, assign investigation managers, add internal notes, and resolve operational issues"
      action={
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-lg flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} /> Log New Complaint Ticket
        </button>
      }
    >
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by complaint ID, issue, customer or worker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[
            { id: "all", label: "All Tickets" },
            { id: "Open", label: "Open" },
            { id: "Investigating", label: "Investigating" },
            { id: "Resolved", label: "Resolved" },
            { id: "Closed", label: "Closed" },
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

      {/* Complaints Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading complaint tickets...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <MessageSquareWarning size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No complaint tickets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No complaints match the current status or search query. Logged customer feedback tickets will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplaints.map((comp) => (
            <div
              key={comp.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{comp.id.slice(-6)}</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          PRIORITY_BADGE[comp.priority] || "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {comp.priority}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white mt-1 line-clamp-1">{comp.issue}</h4>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                      STATUS_BADGE[comp.status] || "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <p>
                    Customer: <strong className="text-white">{comp.customerName || "Customer"}</strong>
                  </p>
                  <p>
                    Worker: <strong className="text-slate-300">{comp.workerName || "Unassigned"}</strong>
                  </p>
                  {comp.orderId && (
                    <p className="font-mono text-[11px] text-slate-500">Order: #{comp.orderId}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => handleOpenDetail(comp)}
                  className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 size={13} /> Manage Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Manage Ticket Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Manage Complaint #{selectedComplaint.id.slice(-6)}</h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[10px]">Issue:</span>
                <p className="text-sm font-extrabold text-white mt-0.5">{selectedComplaint.issue}</p>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Complaint Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as ComplaintStatus)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                >
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Manager Internal Notes</label>
                <textarea
                  rows={4}
                  placeholder="Record investigation notes, customer refund status, worker disciplinary action..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white shadow-md"
                >
                  {saving ? "Saving..." : "Update Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log New Complaint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Log New Complaint Ticket</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Complaint Summary / Issue</label>
                <input
                  required
                  placeholder="e.g. Worker delayed by 45 mins without notification"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Customer Name</label>
                  <input
                    placeholder="Customer Name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Worker Name</label>
                  <input
                    placeholder="Worker Name"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as ComplaintPriority)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white shadow-md"
                >
                  {saving ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
