import React, { useState, useEffect } from "react";
import { CreditCard, Search, DollarSign, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { FirebaseService } from "../../services/firebase.service";
import { WalletTransaction, InvoiceRecord } from "../../types";

export default function ControlPayments() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const unsubTx = FirebaseService.subscribeQuery<WalletTransaction>("transactions", [], (txs) => {
      setTransactions(txs);
      setLoading(false);
    });

    const unsubInv = FirebaseService.subscribeQuery<InvoiceRecord>("invoices", [], (invs) => {
      setInvoices(invs);
    });

    return () => {
      unsubTx();
      unsubInv();
    };
  }, []);

  const filteredTxs = transactions.filter((tx) => {
    const query = searchTerm.toLowerCase();
    const matchesQuery =
      (tx.id || "").toLowerCase().includes(query) ||
      (tx.userId || "").toLowerCase().includes(query) ||
      (tx.description || "").toLowerCase().includes(query) ||
      (tx.paymentMethod || "").toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (statusFilter === "success") return tx.status === "success";
    if (statusFilter === "pending") return tx.status === "pending";
    if (statusFilter === "failed") return tx.status === "failed";

    return true;
  });

  return (
    <ControlLayout
      title="Payments & Invoices Overview"
      subtitle="Operational view of platform financial transactions, customer settlements, and invoice records"
    >
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by transaction ID, user ID or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[
            { id: "all", label: "All Transactions" },
            { id: "success", label: "Successful" },
            { id: "pending", label: "Pending" },
            { id: "failed", label: "Failed" },
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

      {/* Transactions Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading financial records...</div>
      ) : filteredTxs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
          <CreditCard size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No transactions recorded</h3>
          <p className="text-xs text-slate-400">Wallet settlements and customer order payments will appear here.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Tx ID</th>
                  <th className="py-3.5 px-4 font-extrabold">User ID</th>
                  <th className="py-3.5 px-4 font-extrabold">Type</th>
                  <th className="py-3.5 px-4 font-extrabold">Description</th>
                  <th className="py-3.5 px-4 font-extrabold">Payment Method</th>
                  <th className="py-3.5 px-4 font-extrabold">Status</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                      #{tx.id.slice(-8)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      {tx.userId.slice(0, 10)}...
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          tx.type === "credit" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {tx.type === "credit" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        <span className="uppercase">{tx.type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {tx.paymentMethod || "UPI / Card"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          tx.status === "success"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : tx.status === "pending"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-white font-mono text-sm">
                      ₹{tx.amount}
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
