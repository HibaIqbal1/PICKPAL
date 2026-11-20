import React, { useState, useEffect } from "react";
import { MessageSquare, Bell, CheckCircle2, ChevronRight, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkerOrders } from "../../hooks/useOrders";
import { NotificationService } from "../../services/notification.service";
import { PageContainer, SectionCard, TabSwitcher, EmptyState } from "../../components/ui/PageContainer";
import { AppNotification } from "../../types";

export default function WorkerInbox() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { mine } = useWorkerOrders(profile?.id);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "notifications" | "messages">("all");

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = NotificationService.subscribeUserNotifications(profile.id, (data) => {
      setNotifications(data);
    });
    return () => unsub();
  }, [profile?.id]);

  const activeJobs = mine.filter((o) => o.status !== "completed" && o.status !== "cancelled");

  const markAllRead = async () => {
    if (!profile?.id) return;
    await NotificationService.markAllAsRead(profile.id);
  };

  return (
    <PageContainer
      title="Messages & System Alerts"
      subtitle="Track incoming job alerts, customer messages, payment confirmations, and system notifications"
      action={
        notifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-200/50 hover:underline"
          >
            Mark all read
          </button>
        )
      }
    >
      <div className="flex justify-between items-center mb-4">
        <TabSwitcher
          tabs={[
            { value: "all", label: "All Inbox" },
            { value: "notifications", label: "System Notifications" },
            { value: "messages", label: "Active Job Chats" },
          ]}
          active={activeTab}
          onChange={(v) => setActiveTab(v as any)}
        />
      </div>

      {/* Active Job Chats Shortcut */}
      {(activeTab === "all" || activeTab === "messages") && activeJobs.length > 0 && (
        <SectionCard title="Active Customer Chats" icon={<MessageSquare size={18} className="text-indigo-500" />}>
          <div className="space-y-3 pt-1">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/worker/job/${job.id}`)}
                className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-500/40 transition-all border border-black/5 dark:border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      {job.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-ink-soft">#{job.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <p className="font-bold text-sm text-ink dark:text-zinc-100 mt-1.5">{job.storeName}</p>
                  <p className="text-xs text-ink-soft dark:text-zinc-400 truncate mt-0.5">
                    Customer: <span className="font-semibold text-ink dark:text-zinc-200">{job.customerName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  Open Chat <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* System Notifications List */}
      {(activeTab === "all" || activeTab === "notifications") && (
        <SectionCard title="Notifications Feed" icon={<Bell size={18} className="text-indigo-500" />}>
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={32} />}
              message="No notifications or messages yet. Incoming alerts will appear here."
            />
          ) : (
            <div className="space-y-3 pt-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => n.orderId && navigate(`/worker/job/${n.orderId}`)}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    n.orderId ? "cursor-pointer hover:border-indigo-500/30" : ""
                  } ${
                    !n.read
                      ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-500/20"
                      : "bg-black/2 dark:bg-white/2 border-black/5 dark:border-white/5"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === "payment"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : n.type === "order"
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                      : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {n.type === "payment" ? <CheckCircle2 size={18} /> : n.type === "order" ? <MessageSquare size={18} /> : <ShieldCheck size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-xs text-ink dark:text-zinc-100">{n.title}</p>
                      <span className="text-[10px] text-ink-soft dark:text-zinc-500">{n.time}</span>
                    </div>
                    <p className="text-xs text-ink-soft dark:text-zinc-350 mt-1 leading-relaxed">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
