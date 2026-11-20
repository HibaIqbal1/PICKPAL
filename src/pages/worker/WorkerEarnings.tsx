import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, CheckCircle2, DollarSign, ArrowUpRight, Clock, Award, Filter } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkerOrders } from "../../hooks/useOrders";
import { FirebaseService } from "../../services/firebase.service";
import { PageContainer, SectionCard } from "../../components/ui/PageContainer";
import { WalletTransaction } from "../../types";

export default function WorkerEarnings() {
  const { profile } = useAuth();
  const { mine, loading } = useWorkerOrders(profile?.id);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = FirebaseService.subscribeQuery<WalletTransaction>(
      "transactions",
      [],
      (items) => {
        const userTxs = items.filter((t) => t.userId === profile.id);
        const sorted = userTxs.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
        setTransactions(sorted);
      }
    );
    return () => unsub();
  }, [profile?.id]);

  const completed = mine.filter((o) => o.status === "completed");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const grossTotal = completed.reduce((sum, o) => sum + (o.totalAmount || o.budgetCap || 0), 0);
  const totalTips = completed.reduce((sum, o) => sum + (o.tip || o.tipAmount || 0), 0);

  const platformFee = Math.round(grossTotal * 0.10);
  const netEarnings = grossTotal - platformFee + totalTips;

  const todayCompleted = completed.filter((o) => (o.updatedAt || o.createdAt || "").startsWith(todayStr));
  const todayGross = todayCompleted.reduce((sum, o) => sum + (o.totalAmount || o.budgetCap || 0), 0);
  const todayNet = Math.round(todayGross * 0.9);

  const weeklyCompleted = completed.filter((o) => new Date(o.updatedAt || o.createdAt || 0) >= sevenDaysAgo);
  const weeklyGross = weeklyCompleted.reduce((sum, o) => sum + (o.totalAmount || o.budgetCap || 0), 0);
  const weeklyNet = Math.round(weeklyGross * 0.9);

  const monthlyCompleted = completed.filter((o) => new Date(o.updatedAt || o.createdAt || 0) >= thirtyDaysAgo);
  const monthlyGross = monthlyCompleted.reduce((sum, o) => sum + (o.totalAmount || o.budgetCap || 0), 0);
  const monthlyNet = Math.round(monthlyGross * 0.9);

  const pendingPayout = profile?.pendingPayout ?? netEarnings;
  const paidAmount = profile?.paidAmount ?? 0;

  return (
    <PageContainer
      title="Earnings & Payouts"
      subtitle="Complete financial breakdown, platform commission logs, and payout balances"
    >
      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Net", value: `₹${todayNet}`, desc: `${todayCompleted.length} job(s) today`, icon: Wallet, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20" },
          { label: "Weekly Net", value: `₹${weeklyNet}`, desc: `${weeklyCompleted.length} job(s) this week`, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20" },
          { label: "Monthly Net", value: `₹${monthlyNet}`, desc: `${monthlyCompleted.length} job(s) this month`, icon: DollarSign, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20" },
          { label: "Pending Payout", value: `₹${pendingPayout}`, desc: `Paid amount: ₹${paidAmount}`, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20" },
        ].map((c, i) => (
          <div key={i} className={`glass-card border rounded-3xl p-5 shadow-sm space-y-2 ${c.color.split(" ").slice(-1)[0]}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft dark:text-zinc-400">{c.label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color.split(" ").slice(1, 3).join(" ")}`}>
                <c.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-display font-black text-ink dark:text-zinc-100">{c.value}</p>
            <p className="text-[10px] text-ink-soft dark:text-zinc-500">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Financial Statement & Platform Fee Summary */}
      <SectionCard title="Commission & Net Payout Summary" icon={<Award size={18} className="text-indigo-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-3 text-center">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider">Gross Booking Total</p>
            <p className="text-xl font-bold text-ink dark:text-zinc-100 mt-1">₹{grossTotal}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-500/10">
            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Platform Commission (10%)</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">- ₹{platformFee}</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-500/10">
            <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Customer Tips Fulfill</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">+ ₹{totalTips}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/10">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Net Take-Home Earnings</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{netEarnings}</p>
          </div>
        </div>
      </SectionCard>

      {/* Detailed Earnings Itemized Breakdown */}
      <SectionCard title="Itemized Job Earnings History" icon={<Filter size={18} className="text-indigo-500" />}>
        {completed.length === 0 ? (
          <div className="p-8 text-center text-ink-soft dark:text-zinc-400">
            <Wallet size={32} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm font-bold">No completed jobs yet</p>
            <p className="text-xs mt-1">Your earned amounts and job payout statements will appear here as soon as you complete bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink dark:text-zinc-200">
              <thead className="bg-black/5 dark:bg-white/5 uppercase text-[10px] font-bold text-ink-soft dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Order ID</th>
                  <th className="px-4 py-3">Store / Service</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Gross Price</th>
                  <th className="px-4 py-3 text-right">Fee (10%)</th>
                  <th className="px-4 py-3 text-right">Net Earned</th>
                  <th className="px-4 py-3 text-center rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {completed.map((o) => {
                  const price = o.totalAmount || o.budgetCap || 0;
                  const fee = Math.round(price * 0.10);
                  const net = price - fee + (o.tip || 0);
                  return (
                    <tr key={o.id} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{o.id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3.5 font-bold">{o.storeName}</td>
                      <td className="px-4 py-3.5 text-ink-soft dark:text-zinc-400">{o.customerName}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold">₹{price}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-500">-₹{fee}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{net}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                          <CheckCircle2 size={10} /> Credited
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
