import React, { useState, useEffect } from "react";
import { Users, Search, Phone, Mail, MapPin, Wallet, Ban, RefreshCcw, ShieldCheck } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { ControlService } from "../../services/control.service";
import { PickPalUser } from "../../types";

export default function ControlCustomers() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<PickPalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<PickPalUser>("users", [], (users) => {
      const custList = users.filter((u) => u.role === "customer");
      setCustomers(custList);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const query = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.phone || "").toLowerCase().includes(query) ||
      (c.email || "").toLowerCase().includes(query) ||
      (c.city || c.address || "").toLowerCase().includes(query)
    );
  });

  const handleSuspend = async (userId: string) => {
    if (!profile) return;
    if (!window.confirm("Are you sure you want to SUSPEND this customer account?")) return;
    try {
      await ControlService.suspendUser(userId, profile.id, "Customer administrative suspension");
      alert("Customer account suspended.");
    } catch (err: any) {
      alert("Failed to suspend customer: " + err.message);
    }
  };

  const handleReactivate = async (userId: string) => {
    if (!profile) return;
    if (!window.confirm("Reactivate this customer account?")) return;
    try {
      await ControlService.reactivateUser(userId, profile.id);
      alert("Customer account reactivated.");
    } catch (err: any) {
      alert("Failed to reactivate customer: " + err.message);
    }
  };

  return (
    <ControlLayout
      title="Customer Management"
      subtitle="Registered customer directory, account status, wallet balances, and user security"
    >
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total Customers: <strong className="text-white font-extrabold">{customers.length}</strong>
        </div>
      </div>

      {/* Customers Table / Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading customer profiles...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
          <Users size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No customer profiles found</h3>
          <p className="text-xs text-slate-400">No customers match the current search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const isSuspended = cust.status === "suspended";

            return (
              <div
                key={cust.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {cust.name?.slice(0, 2) || "CU"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate">{cust.name}</h4>
                        <p className="text-xs text-slate-400 truncate">{cust.phone || "No phone"}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                        isSuspended
                          ? "bg-slate-700 text-slate-300 border-slate-600"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate">{cust.email || "Email not set"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={13} className="text-slate-500 shrink-0" />
                      <span className="truncate">{cust.city || cust.address || "Bengaluru"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Wallet size={13} className="text-purple-400" /> Wallet Balance:
                      </span>
                      <strong className="text-purple-300 font-mono">₹{cust.walletBalance || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  {isSuspended ? (
                    <button
                      onClick={() => handleReactivate(cust.id)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCcw size={14} /> Reactivate Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSuspend(cust.id)}
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
