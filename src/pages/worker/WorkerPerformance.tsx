import React, { useState, useEffect } from "react";
import { Star, BarChart3, Award, MessageSquare } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkerOrders } from "../../hooks/useOrders";
import { PageContainer, SectionCard, TwoColGrid } from "../../components/ui/PageContainer";
import { ReviewService } from "../../services/review.service";
import { ServiceReview } from "../../types";

export default function WorkerPerformance() {
  const { profile } = useAuth();
  const { mine } = useWorkerOrders(profile?.id);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = ReviewService.subscribeWorkerReviews(profile.id, (data) => {
      setReviews(data);
    });
    return () => unsub();
  }, [profile?.id]);

  const completed = mine.filter((o) => o.status === "completed");
  const totalJobs = mine.length;
  const completionRate = totalJobs > 0 ? ((completed.length / totalJobs) * 100).toFixed(1) + "%" : "100%";

  const totalEarnings = completed.reduce((s, o) => s + o.totalAmount, 0);
  const totalTips = completed.reduce((s, o) => s + (o.tip || 0), 0);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : profile?.rating ? profile.rating.toFixed(1) : "No ratings yet";

  return (
    <PageContainer
      title="Performance & Analytics"
      subtitle="Track your overall performance scores, earnings history, and customer reviews"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Completed Jobs", value: `${completed.length}`, desc: `Total assigned: ${totalJobs}`, color: "border-indigo-500/20" },
          { label: "Completion Rate", value: completionRate, desc: "Successful deliveries", color: "border-emerald-500/20" },
          { label: "Total Earnings", value: `₹${totalEarnings}`, desc: "From completed orders", color: "border-purple-500/20" },
          { label: "Average Rating", value: avgRating, desc: `${reviews.length} customer review(s)`, color: "border-amber-500/20" },
        ].map((kpi, idx) => (
          <div key={idx} className={`glass-card border rounded-3xl p-5 shadow-sm space-y-1 ${kpi.color}`}>
            <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-display font-black text-ink dark:text-zinc-100">{kpi.value}</p>
            <p className="text-[10px] text-ink-soft dark:text-zinc-500">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Analytics Summary */}
      <SectionCard
        title="Earnings Breakdown"
        icon={<BarChart3 size={18} className="text-indigo-500" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-center">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider">NET SERVICE EARNINGS</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalEarnings}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider">TOTAL TIPS RECEIVED</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">₹{totalTips}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider">COMPLETED ORDERS</p>
            <p className="text-xl font-bold text-ink dark:text-zinc-100 mt-1">{completed.length}</p>
          </div>
        </div>
      </SectionCard>

      <TwoColGrid>
        {/* Badges */}
        <SectionCard
          title="Account Status & Badges"
          icon={<Award size={18} className="text-indigo-500" />}
        >
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-4 p-3.5 border border-black/5 dark:border-white/5 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/40">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600">
                ⚡
              </span>
              <div>
                <p className="font-bold text-sm text-ink dark:text-zinc-100">
                  {profile?.verified ? "Verified PickPal Worker" : "Pending Verification"}
                </p>
                <p className="text-xs text-ink-soft dark:text-zinc-400 mt-0.5">
                  {profile?.verified ? "Approved and active for receiving local orders." : "Awaiting local manager credential review."}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Real Customer Reviews */}
        <SectionCard
          title="Customer Reviews"
          icon={<Star size={18} className="text-indigo-500" />}
        >
          <div className="space-y-4 pt-1 divide-y divide-black/5 dark:divide-white/5">
            {reviews.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={24} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
                <p className="text-xs font-bold text-ink-soft dark:text-zinc-400">No reviews received yet</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">Reviews submitted by customers upon completing orders will appear here.</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-bold text-sm text-ink dark:text-zinc-100">{rev.customerName || "Customer"}</p>
                      <p className="text-[10px] text-ink-soft dark:text-zinc-500">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-500/10">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      {rev.rating.toFixed(1)}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-ink-soft dark:text-zinc-350 mt-2 bg-black/3 dark:bg-white/3 p-3 rounded-xl leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </TwoColGrid>
    </PageContainer>
  );
}
