import React, { useState, useEffect } from "react";
import { FileText, Search, ShieldCheck, Lock, Clock, User } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { FirebaseService } from "../../services/firebase.service";
import { SystemLog } from "../../types";

export default function ControlLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<SystemLog>("system_logs", [], (items) => {
      // Sort newest first
      const sorted = items.sort((a, b) =>
        (b.timestamp || "").localeCompare(a.timestamp || "")
      );
      setLogs(sorted);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const query = searchTerm.toLowerCase();
    return (
      (log.action || "").toLowerCase().includes(query) ||
      (log.details || "").toLowerCase().includes(query) ||
      (log.createdBy || "").toLowerCase().includes(query)
    );
  });

  return (
    <ControlLayout
      title="System Audit Logs"
      subtitle="Append-only immutable record of manager actions, worker approvals, suspensions, and administrative decisions"
    >
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by action, details or manager ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock size={14} className="text-emerald-400" />
          <span>Security Audit Trail • Append Only (Deletion Disabled)</span>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading system audit logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <FileText size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No system audit logs recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Manager actions such as approving/rejecting workers, updating shop queues, and resolving complaints write immutable audit logs here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Timestamp</th>
                  <th className="py-3.5 px-4 font-extrabold">Action</th>
                  <th className="py-3.5 px-4 font-extrabold">Details</th>
                  <th className="py-3.5 px-4 font-extrabold">Initiated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 shrink-0">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-brand-400">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {log.createdBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
