import React, { useState } from "react";
import { Wallet, Gift, Percent, Receipt, Copy, CheckCircle2, ChevronRight, Plus, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { PageContainer, SectionCard, TwoColGrid } from "../../components/ui/PageContainer";
import { downloadInvoicePdf } from "./Orders";
import { useAuth } from "../../contexts/AuthContext";
import { useWallet } from "../../hooks/useWallet";
import { useInvoices } from "../../hooks/useInvoices";
import { AddMoneyModal } from "../../components/shared/AddMoneyModal";

const COUPONS = [
  { code: "PICKPAL50", desc: "Get 50% off on your first plumbing task", expiry: "Valid till 31 July" },
  { code: "FREEDEL", desc: "Free delivery on grocery orders above ₹500", expiry: "Valid till 05 Aug" },
  { code: "REPAIR30", desc: "₹300 flat off on any home appliance repair", expiry: "Valid till 15 Aug" },
];

export default function CustomerWallet() {
  const { profile } = useAuth();
  const { balance, transactions, loading: walletLoading } = useWallet(profile?.id);
  const { invoices, loading: invoicesLoading } = useInvoices(profile?.id);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const displayBalance = profile?.walletBalance ?? balance;

  return (
    <PageContainer
      title="Wallet & Payments"
      subtitle="Manage your balance, active promotional coupons, transaction ledger, and invoices"
    >
      <TwoColGrid>
        {/* Wallet Balance Card */}
        <div
          className="rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-brand-500/20 flex flex-col justify-between min-h-[200px]"
          style={{ background: "linear-gradient(135deg, #E8236B, #9E0B46)" }}
        >
          {/* Decorative shapes */}
          <div className="absolute right-0 bottom-0 w-36 h-36 bg-white/5 rounded-full translate-x-12 translate-y-12 pointer-events-none" />
          <div className="absolute left-0 top-0 w-24 h-24 bg-white/5 rounded-full -translate-x-6 -translate-y-6 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold tracking-wider text-white/85">PICKPAL WALLET</span>
              <Wallet size={20} className="text-white/85" />
            </div>
            <div>
              <p className="text-[10px] text-white/75 font-semibold uppercase tracking-wider">Available Balance</p>
              <p className="text-4xl font-display font-black mt-1">₹{displayBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="relative z-10 pt-4 flex gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-brand-600 font-bold text-xs hover:bg-white/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Add Money
            </button>
          </div>

          <div className="relative z-10 flex justify-between items-center pt-3 text-xs border-t border-white/10 mt-4">
            <span className="text-white/80 font-medium">Auto-Settlement: Active</span>
            <span className="text-white/90 font-bold text-[10px] uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Instant
            </span>
          </div>
        </div>

        {/* Loyalty & Rewards */}
        <SectionCard
          title="Rewards & Loyalty"
          icon={<Gift size={18} className="text-amber-500" />}
          className="flex flex-col justify-between min-h-[200px]"
        >
          <div className="space-y-1">
            <p className="text-2xl font-display font-black text-ink dark:text-zinc-100">1,480 pts</p>
            <p className="text-xs font-semibold text-ink-soft dark:text-zinc-400">Current tier: Silver Member</p>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-ink-soft dark:text-zinc-400">Next Milestone (Gold Tier)</span>
              <span className="text-brand-600 dark:text-brand-400">1,500 pts</span>
            </div>
            <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: "95%" }} />
            </div>
            <p className="text-[10px] text-ink-soft dark:text-zinc-500">Earn 20 more points to unlock free priority matches</p>
          </div>
        </SectionCard>
      </TwoColGrid>

      {/* Transaction History Ledger */}
      <SectionCard
        title="Wallet Transaction History"
        icon={<Clock size={18} />}
      >
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-ink-soft dark:text-zinc-500">
            No transactions yet. Add money or book a service to see transactions here.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-5 sm:px-0">
              <table className="min-w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-ink-soft dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Type</th>
                    <th className="pb-3 text-left">Description</th>
                    <th className="pb-3 text-left">Method</th>
                    <th className="pb-3 text-left">Ref Number</th>
                    <th className="pb-3 text-left">Date & Time</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit";
                    const dateStr = tx.timestamp ? new Date(tx.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Recent";
                    return (
                      <tr key={tx.id} className="text-ink dark:text-zinc-250 font-medium">
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isCredit
                              ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400"
                          }`}>
                            {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-sm text-ink dark:text-zinc-100 max-w-[200px] truncate">
                          {tx.description}
                        </td>
                        <td className="py-3.5 text-xs text-ink-soft dark:text-zinc-400">
                          {tx.paymentMethod || "UPI"}
                        </td>
                        <td className="py-3.5 font-mono text-[10px] text-ink-soft dark:text-zinc-400">
                          {tx.referenceId || tx.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-3.5 text-xs text-ink-soft dark:text-zinc-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className={`py-3.5 font-display font-extrabold text-right text-sm ${
                          isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-ink dark:text-zinc-200"
                        }`}>
                          {isCredit ? "+" : "-"}₹{tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Offers & Coupons */}
      <SectionCard
        title="Active Coupons & Offers"
        icon={<Percent size={18} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {COUPONS.map((c) => (
            <div
              key={c.code}
              className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-black/2 dark:bg-white/2"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-ink dark:text-zinc-100 leading-normal">{c.desc}</p>
                <p className="text-[10px] text-ink-soft dark:text-zinc-500">{c.expiry}</p>
              </div>
              <div className="flex justify-between items-center gap-2 pt-2">
                <span className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                  {c.code}
                </span>
                <button
                  onClick={() => copyCode(c.code)}
                  className="p-1.5 rounded-lg text-ink-soft dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink dark:hover:text-zinc-200 transition-colors"
                  title="Copy coupon code"
                >
                  {copiedCode === c.code ? (
                    <CheckCircle2 size={15} className="text-emerald-500 animate-bounce" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Live Invoice Records */}
      <SectionCard
        title="Recent Invoices & Billing"
        icon={<Receipt size={18} />}
      >
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-ink-soft dark:text-zinc-500">
            No invoices generated yet. Completed booking receipts will automatically appear here.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-5 sm:px-0">
              <table className="min-w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5 text-ink-soft dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Invoice ID</th>
                    <th className="pb-3 text-left">Service / Partner</th>
                    <th className="pb-3 text-left">Date & Time</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="text-ink dark:text-zinc-250 font-medium">
                      <td className="py-3.5 font-mono text-[10px] text-ink-soft dark:text-zinc-400">{inv.id}</td>
                      <td className="py-3.5 font-bold text-sm text-ink dark:text-zinc-100">
                        {inv.storeName}
                        {inv.workerName && (
                          <span className="block text-[10px] font-normal text-ink-soft dark:text-zinc-400">
                            Partner: {inv.workerName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-ink-soft dark:text-zinc-400">{inv.date} {inv.time || ""}</td>
                      <td className="py-3.5 font-extrabold text-right">₹{inv.totalPaid.toFixed(2)}</td>
                      <td className="py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-mint-100 dark:bg-mint-600/10 text-mint-600 dark:text-mint-400 uppercase tracking-wide">
                          Paid
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => downloadInvoicePdf(inv)}
                          className="text-brand-600 dark:text-brand-400 font-bold flex items-center gap-0.5 hover:underline ml-auto"
                        >
                          PDF <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Add Money Modal */}
      {profile && (
        <AddMoneyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={profile.id}
        />
      )}
    </PageContainer>
  );
}
