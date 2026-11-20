import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, CheckCircle2, ChevronRight, Download, RefreshCw, User as UserIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCustomerOrders } from "../../hooks/useOrders";
import { PageContainer, TabSwitcher, EmptyState, SectionCard } from "../../components/ui/PageContainer";
import { Order } from "../../types";
import { ReviewService } from "../../services/review.service";
import { InvoiceService } from "../../services/invoice.service";

export function downloadInvoicePdf(order: any) {
  InvoiceService.downloadInvoicePdf(order);
}

export default function CustomerOrders() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { orders, loading } = useCustomerOrders(profile?.id, profile?.name);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [reviewOrder, setReviewOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittedReviews, setSubmittedReviews] = useState<string[]>([]);

  // Database-driven order filtering - absolute single source of truth
  const activeOrders = orders.filter((o) => 
    o.status !== "completed" && o.status !== "cancelled"
  );
  
  const pastOrders = orders.filter((o) => 
    o.status === "completed" || o.status === "cancelled"
  );

  const displayList = tab === "active" ? activeOrders : pastOrders;

  const submitReview = async (order: Order) => {
    if (!profile) return;
    try {
      await ReviewService.submitReview({
        orderId: order.id,
        workerId: order.workerId || "",
        customerId: profile.id,
        customerName: profile.name,
        rating,
        comment,
      });
      setSubmittedReviews((prev) => [...prev, order.id]);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewOrder(null);
      setComment("");
      setRating(5);
    }
  };

  const handleBookAgain = (o: Order) => {
    navigate("/customer/new-request", {
      state: {
        service: {
          key: o.category,
          label: o.storeName,
          category: o.category,
          group: "home",
          image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
        }
      }
    });
  };

  return (
    <PageContainer
      title="Your Bookings"
      subtitle="Track your active service requests or view past history"
      narrow
    >
      {/* Tab Switcher */}
      <div className="flex justify-start">
        <TabSwitcher
          tabs={[
            { value: "active", label: `Active (${activeOrders.length})` },
            { value: "history", label: `History (${pastOrders.length})` },
          ]}
          active={tab}
          onChange={(v) => setTab(v as "active" | "history")}
        />
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      )}

      {!loading && displayList.length === 0 && (
        <EmptyState
          icon={<Clock size={40} />}
          message={tab === "active" ? "No Active Bookings" : "No Booking History"}
        />
      )}

      <div className="space-y-4">
        {displayList.map((o) => {
          const dateFormatted = o.createdAt
            ? new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : "Today";
          const timeFormatted = o.createdAt
            ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";

          return (
            <div
              key={o.id}
              className="glass-card rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Header section with worker profile photo */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-brand-50 dark:bg-brand-500/15 shrink-0 shadow-sm border border-black/5 dark:border-white/5">
                    {o.workerId ? (
                      <img 
                        src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=120&q=80" 
                        alt="Worker avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-100 dark:bg-brand-500/25">
                        <UserIcon size={18} className="text-brand-500" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 uppercase">
                        {o.category}
                      </span>
                      <span className="text-[10px] font-mono text-ink-soft dark:text-zinc-500">
                        #{o.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-ink dark:text-zinc-100">{o.storeName}</h3>
                    <p className="text-xs text-ink-soft dark:text-zinc-400">
                      Worker: <span className="font-semibold text-ink dark:text-zinc-200">{o.workerName ?? "Searching worker..."}</span>
                    </p>
                    <p className="text-[10px] text-ink-soft dark:text-zinc-500 font-medium">
                      {dateFormatted} at {timeFormatted}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold text-ink-soft dark:text-zinc-500 uppercase tracking-wider">Price</p>
                  <p className="text-lg font-display font-black text-brand-600 dark:text-brand-450">₹{o.totalAmount || o.budgetCap}</p>
                  {(o as any).tipAmount && (o as any).tipAmount > 0 && (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">+ ₹{(o as any).tipAmount} Tip</p>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    o.status === "completed"
                      ? "bg-mint-100 dark:bg-mint-600/10 text-mint-600 dark:text-mint-400"
                      : o.status === "cancelled"
                      ? "bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-400"
                      : "bg-warning-50 dark:bg-warning-600/15 text-warning-600 dark:text-warning-500"
                  }`}>
                    {o.status.replace("_", " ")}
                  </span>
                  <span className="text-[9px] font-extrabold text-ink-soft dark:text-zinc-500 uppercase">
                    Payment: {(o as any).paymentStatus || "Paid"}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {o.status !== "completed" && o.status !== "cancelled" ? (
                    <button
                      onClick={() => navigate(`/customer/track/${o.id}`)}
                      className="btn-gradient-brand text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm"
                    >
                      Track Live <ChevronRight size={14} />
                    </button>
                  ) : (
                    <>
                      {o.status === "completed" && (
                        <>
                          <button
                            onClick={() => downloadInvoicePdf(o)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft dark:text-zinc-300 text-xs font-bold transition-colors"
                            title="Download PDF Invoice"
                          >
                            <Download size={13} /> Invoice
                          </button>
                          {submittedReviews.includes(o.id) ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 px-2">
                              <CheckCircle2 size={13} /> Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => setReviewOrder(o.id)}
                              className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold px-3.5 py-2 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors text-xs"
                            >
                              Rate & Review
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => handleBookAgain(o)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-ink dark:text-zinc-200 text-xs font-bold transition-all"
                      >
                        <RefreshCw size={12} /> Book Again
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Review Popup Drawer */}
              {reviewOrder === o.id && (
                <div className="mt-3 p-4 bg-black/3 dark:bg-white/3 rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
                  <p className="text-xs font-bold text-ink dark:text-zinc-200">Rate this service & worker</p>

                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                        <Star
                          size={20}
                          className={star <= rating ? "fill-amber-500 text-amber-500" : "text-ink-soft dark:text-zinc-600"}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Write a comment about your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 outline-none h-20 text-ink dark:text-zinc-100 focus:ring-1 focus:ring-brand-500"
                  />

                  <div className="flex justify-end gap-2 text-xs font-bold">
                    <button
                      onClick={() => setReviewOrder(null)}
                      className="px-4 py-2 rounded-xl text-ink-soft dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReview(o)}
                      className="btn-gradient-brand text-white px-4.5 py-2 rounded-xl"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
