import React, { useState, useEffect } from "react";
import { Siren, MapPin, CheckCircle2, Clock, User, Phone, ShieldAlert, AlertTriangle } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { useSos, resolveSos } from "../../hooks/useSos";
import { SosAlert } from "../../types";

export default function ControlSos() {
  const { profile } = useAuth();
  const { alerts, open: openAlerts } = useSos();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolveAlert = async (alertId: string) => {
    if (!profile) return;
    if (!window.confirm("Confirm resolving emergency SOS alert?")) return;
    setResolvingId(alertId);
    try {
      await resolveSos(alertId, profile.id);
      alert("SOS Alert marked as Resolved.");
    } catch (err: any) {
      alert("Failed to resolve alert: " + err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <ControlLayout
      title="Emergency Operations & SOS Dispatch"
      subtitle="Real-time emergency signals triggered by customers or workers during live service orders"
    >
      {/* Top Banner */}
      <div className="bg-red-950/70 border border-red-600/40 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 animate-pulse shadow-lg shadow-red-600/30">
            <Siren size={24} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              Active SOS Emergencies ({openAlerts.length} Open)
            </h3>
            <p className="text-xs text-red-200 mt-0.5">
              Live location triggers automatically connect to local emergency dispatches.
            </p>
          </div>
        </div>

        <div className="text-right self-start sm:self-center">
          <span className="text-xs font-mono font-extrabold text-red-300">
            RESPONSE TIMELINE: IMMEDIATE
          </span>
        </div>
      </div>

      {/* SOS Alerts Grid */}
      {alerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <ShieldAlert size={40} className="text-emerald-400 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No active emergency SOS alerts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Platform operations are nominal. Any emergency distress signal triggered by a user will be escalated here immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alertItem) => {
            const isOpen = alertItem.status === "open";

            return (
              <div
                key={alertItem.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isOpen
                    ? "bg-red-950/40 border-red-600/60 shadow-xl"
                    : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          isOpen
                            ? "bg-red-600 text-white border-red-400 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {isOpen ? "ACTIVE SOS" : "RESOLVED"}
                      </span>

                      <span className="text-xs font-mono text-slate-400">ID: {alertItem.id}</span>
                      {alertItem.createdAt && (
                        <span className="text-xs text-slate-400">
                          {new Date(alertItem.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                        {alertItem.userName}
                        <span className="text-xs font-normal text-slate-400 uppercase">
                          ({alertItem.role})
                        </span>
                      </h4>
                      <p className="text-xs text-red-200 font-semibold mt-1">
                        Reason: <strong className="text-white">{alertItem.reason}</strong>
                        {alertItem.note ? ` — ${alertItem.note}` : ""}
                      </p>
                    </div>

                    {/* Coordinates & Order reference */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                      {alertItem.lat != null && alertItem.lng != null && (
                        <a
                          href={`https://maps.google.com/?q=${alertItem.lat},${alertItem.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-brand-400 font-bold hover:underline"
                        >
                          <MapPin size={14} />
                          <span>
                            Location: {alertItem.lat.toFixed(4)}, {alertItem.lng.toFixed(4)} (Open Map)
                          </span>
                        </a>
                      )}
                      {alertItem.orderId && (
                        <span className="font-mono text-slate-400">Order ID: #{alertItem.orderId}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    {isOpen ? (
                      <button
                        onClick={() => handleResolveAlert(alertItem.id)}
                        disabled={resolvingId === alertItem.id}
                        className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Resolve SOS Alert
                      </button>
                    ) : (
                      <div className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> Resolved by {alertItem.resolvedBy || "Manager"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ControlLayout>
  );
}
