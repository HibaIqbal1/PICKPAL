import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Bell, ChevronRight, User as UserIcon, CheckCircle, Clock, Trash2, FileText, Download } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCustomerOrders } from "../../hooks/useOrders";
import { useOrderMessages } from "../../hooks/useMessages";
import { useNotifications } from "../../hooks/useNotifications";
import { Skeleton } from "../../components/ui/Skeleton";
import { PageContainer, EmptyState, TabSwitcher } from "../../components/ui/PageContainer";
import { downloadInvoicePdf } from "./Orders";

function ConversationItem({ conv, onClick }: { conv: any; onClick: () => void; key?: React.Key }) {
  const { messages } = useOrderMessages(conv.orderId);
  
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMsgText = lastMsg ? lastMsg.text : "No messages yet. Tap to start chat.";
  const lastMsgTime = lastMsg ? lastMsg.timestamp : "";

  return (
    <motion.div
      className="w-full text-left glass-card rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col gap-3"
      whileHover={{ y: -2 }}
    >
      <div onClick={onClick} className="flex items-start justify-between gap-4 cursor-pointer">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center font-bold text-brand-500 text-lg relative shrink-0">
            {(conv.workerName || "U").charAt(0)}
            {lastMsg && lastMsg.senderRole === "worker" && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                {conv.status.replace("_", " ")}
              </span>
              <span className="text-[10px] font-mono text-ink-soft dark:text-zinc-500">#{conv.orderId.slice(-6).toUpperCase()}</span>
            </div>
            <h3 className="text-base font-bold text-ink dark:text-zinc-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {conv.storeName}
            </h3>
            <p className="text-xs text-ink-soft dark:text-zinc-400 truncate font-medium">
              {lastMsgText}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
          <span className="text-[10px] text-ink-soft dark:text-zinc-500 font-bold uppercase tracking-wider">
            {lastMsgTime ? lastMsgTime.split(",")[1] || lastMsgTime : ""}
          </span>
          <ChevronRight size={16} className="text-ink-soft dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {conv.status === "completed" && (
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-black/5 dark:border-white/5">
          <span className="text-[10px] text-ink-soft dark:text-zinc-500 font-medium">Invoice ready for download</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadInvoicePdf(conv.originalOrder);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
          >
            <Download size={12} />
            Download PDF
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function CustomerInbox() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { orders, loading: ordersLoading } = useCustomerOrders(profile?.id);
  const [activeTab, setActiveTab] = useState<"chats" | "notifications">("chats");
  
  // Track read and deleted dynamic notifications via localStorage
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("read_notifications") || "[]");
  });
  const [deletedNotifications, setDeletedNotifications] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("deleted_notifications") || "[]");
  });

  const conversations = useMemo(() => {
    if (!orders || ordersLoading) return [];
    return orders.map((order) => ({
      orderId: order.id,
      storeName: order.storeName,
      workerName: order.workerName || "Waiting for worker",
      workerId: order.workerId,
      status: order.status,
      budgetCap: order.budgetCap,
      createdAt: order.createdAt,
      originalOrder: order,
    }));
  }, [orders, ordersLoading]);

  // Dynamically generate notifications from actual orders list (source of truth)
  const notificationsList = useMemo(() => {
    const list: any[] = [];
    orders.forEach((o) => {
      const idStr = o.id.slice(-6).toUpperCase();
      const timeStr = o.updatedAt
        ? new Date(o.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now";

      if (o.status === "searching_worker") {
        const nid = `notif_${o.id}_searching`;
        list.push({
          id: nid,
          title: "Finding Worker",
          desc: `Searching for a matching worker nearby for your request at ${o.storeName || o.category}.`,
          time: timeStr,
          read: readNotifications.includes(nid),
          orderId: o.id,
        });
      } else if (o.status === "worker_assigned") {
        const nid = `notif_${o.id}_assigned`;
        list.push({
          id: nid,
          title: "Worker Assigned",
          desc: `Worker ${o.workerName || "Partner"} has been assigned to your task at ${o.storeName}.`,
          time: timeStr,
          read: readNotifications.includes(nid),
          orderId: o.id,
        });
      } else if (o.status === "in_progress") {
        const nid = `notif_${o.id}_progress`;
        list.push({
          id: nid,
          title: "Service Started",
          desc: `Your service at ${o.storeName} is now in progress. Check details for live updates.`,
          time: timeStr,
          read: readNotifications.includes(nid),
          orderId: o.id,
        });
      } else if (o.status === "completed") {
        const nid1 = `notif_${o.id}_completed`;
        const nid2 = `notif_${o.id}_paid`;
        list.push({
          id: nid1,
          title: "Order Completed",
          desc: `Your order #${idStr} at ${o.storeName} was successfully completed.`,
          time: timeStr,
          read: readNotifications.includes(nid1),
          orderId: o.id,
        });
        list.push({
          id: nid2,
          title: "Payment Successful",
          desc: `Payment of ₹${o.totalAmount || o.budgetCap} was successfully processed for #${idStr}.`,
          time: timeStr,
          read: readNotifications.includes(nid2),
          orderId: o.id,
        });
      } else if (o.status === "cancelled") {
        const nid = `notif_${o.id}_cancelled`;
        list.push({
          id: nid,
          title: "Order Cancelled",
          desc: `Your request #${idStr} was cancelled. Any reservation amount has been refunded.`,
          time: timeStr,
          read: readNotifications.includes(nid),
          orderId: o.id,
        });
      }
    });

    // Filter out deleted notifications
    return list.filter((n) => !deletedNotifications.includes(n.id));
  }, [orders, readNotifications, deletedNotifications]);

  const unreadChats = conversations.length; // Active count
  const unreadNotifications = notificationsList.filter((n) => !n.read).length;

  const markAllNotificationsRead = () => {
    const allIds = notificationsList.map((n) => n.id);
    const updated = Array.from(new Set([...readNotifications, ...allIds]));
    setReadNotifications(updated);
    localStorage.setItem("read_notifications", JSON.stringify(updated));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...deletedNotifications, id];
    setDeletedNotifications(updated);
    localStorage.setItem("deleted_notifications", JSON.stringify(updated));
  };

  const handleNotificationClick = (orderId: string, id: string) => {
    if (!readNotifications.includes(id)) {
      const updated = [...readNotifications, id];
      setReadNotifications(updated);
      localStorage.setItem("read_notifications", JSON.stringify(updated));
    }
    navigate(`/customer/track/${orderId}`);
  };

  return (
    <PageContainer
      title="Inbox & Messages"
      subtitle="Communicate with service partners and track important system alerts"
      action={
        activeTab === "notifications" && notificationsList.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Mark all read
          </button>
        )
      }
      narrow
    >
      {/* Tab Selector */}
      <div className="flex justify-start">
        <TabSwitcher
          tabs={[
            { value: "chats", label: `Chats (${conversations.length})` },
            { value: "notifications", label: `Alerts (${unreadNotifications})` },
          ]}
          active={activeTab}
          onChange={(v) => setActiveTab(v as "chats" | "notifications")}
        />
      </div>

      {ordersLoading && (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      )}

      {/* Conversations Tab */}
      {!ordersLoading && activeTab === "chats" && (
        <>
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={36} />}
              message="No active booking chats found. Create a request to start talking to a worker."
            />
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.orderId}
                  conv={conv}
                  onClick={() => navigate(`/customer/track/${conv.orderId}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Notifications Tab */}
      {!ordersLoading && activeTab === "notifications" && (
        <>
          {notificationsList.length === 0 ? (
            <EmptyState
              icon={<Bell size={36} />}
              message="All caught up! No notifications at the moment."
            />
          ) : (
            <div className="space-y-3">
              {notificationsList.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.orderId, n.id)}
                  className={`p-5 rounded-3xl border flex justify-between gap-4 transition-all duration-200 cursor-pointer glass-card relative overflow-hidden group ${
                    n.read
                      ? "border-black/5 dark:border-white/5 opacity-70"
                      : "border-brand-500/20 dark:border-brand-500/20 shadow-sm"
                  }`}
                >
                  <div className="flex gap-3.5">
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.read
                        ? "bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-400"
                        : "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                    }`}>
                      {n.read ? <Clock size={14} /> : <CheckCircle size={14} />}
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-ink dark:text-zinc-100">{n.title}</p>
                      <p className="text-xs text-ink-soft dark:text-zinc-405 leading-relaxed">{n.desc}</p>
                      <p className="text-[10px] text-ink-soft dark:text-zinc-500 font-medium">{n.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="p-1.5 rounded-lg text-ink-soft dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors self-start shrink-0"
                    title="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}