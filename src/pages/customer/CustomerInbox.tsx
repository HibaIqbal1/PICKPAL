import React, { useState } from "react";
import { motion } from "motion/react";
import { MessageSquare, Bell, User, Phone, CheckCircle, Clock, Trash } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface ChatThread {
  id: string;
  workerName: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

interface SystemNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const CHAT_THREADS: ChatThread[] = [
  { id: "1", workerName: "Ramesh Kumar (Plumber)", avatar: "", lastMessage: "I will reach your location in 5 minutes.", time: "11:20 AM", unread: true },
  { id: "2", workerName: "Sunita Sharma (AC Repair)", avatar: "", lastMessage: "AC servicing is completed. Please approve invoice.", time: "Yesterday", unread: false },
  { id: "3", workerName: "Anil Goel (Electrician)", avatar: "", lastMessage: "Yes, I can pick up the parts from the store.", time: "July 15", unread: false },
];

const NOTIFICATIONS: SystemNotification[] = [
  { id: "n1", title: "Order Completed", desc: "Your plumbing order #ORD-8819 is successfully completed.", time: "10 mins ago", read: false },
  { id: "n2", title: "Payment Successful", desc: "₹350 paid successfully for plumbing repairs.", time: "9 mins ago", read: false },
  { id: "n3", title: "Loyalty Points Added", desc: "You have earned 15 loyalty points from your last order.", time: "9 mins ago", read: true },
  { id: "n4", title: "Profile Verified", desc: "Welcome to PickPal! Your customer account has been verified.", time: "3 days ago", read: true },
];

export default function CustomerInbox() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"chats" | "notifications">("chats");
  const [notifications, setNotifications] = useState<SystemNotification[]>(NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-extrabold text-ink dark:text-zinc-100">Inbox & Messages</h1>
        {activeTab === "notifications" && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-200
            ${activeTab === "chats"
              ? "bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm"
              : "text-ink-soft dark:text-zinc-400 hover:text-ink"
            }`}
        >
          <MessageSquare size={14} />
          Chats ({CHAT_THREADS.filter((c) => c.unread).length})
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-200
            ${activeTab === "notifications"
              ? "bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm"
              : "text-ink-soft dark:text-zinc-400 hover:text-ink"
            }`}
        >
          <Bell size={14} />
          Notifications ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Chats Pane */}
      {activeTab === "chats" && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-black/5 dark:border-white/5 shadow-sm divide-y divide-black/5 dark:divide-white/5">
          {CHAT_THREADS.map((c) => (
            <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 px-3 rounded-2xl transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center font-bold text-brand-500 text-lg relative shrink-0">
                  {c.workerName.charAt(0)}
                  {c.unread && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-ink dark:text-zinc-100 truncate">{c.workerName}</p>
                  <p className={`text-xs truncate ${c.unread ? "text-ink font-semibold dark:text-zinc-200" : "text-ink-soft dark:text-zinc-400"}`}>
                    {c.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] text-ink-soft dark:text-zinc-400">{c.time}</span>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 text-ink-soft dark:text-zinc-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 transition-colors">
                    <Phone size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications Pane */}
      {activeTab === "notifications" && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5">
              <Bell className="mx-auto text-ink-soft dark:text-zinc-400 mb-2 opacity-50" size={32} />
              <p className="text-sm text-ink-soft dark:text-zinc-400">All caught up! No notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex justify-between gap-4 transition-all duration-200
                  ${n.read
                    ? "bg-white dark:bg-zinc-900 border-black/5 dark:border-white/5 opacity-80"
                    : "bg-white dark:bg-zinc-900 border-brand-500/30 dark:border-brand-500/20 shadow-sm"
                  }`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
                    ${n.read
                      ? "bg-gray-100 dark:bg-zinc-800 text-ink-soft dark:text-zinc-400"
                      : "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                    }`}
                  >
                    {n.read ? <Clock size={14} /> : <CheckCircle size={14} />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-ink dark:text-zinc-100">{n.title}</p>
                    <p className="text-xs text-ink-soft dark:text-zinc-400">{n.desc}</p>
                    <p className="text-[10px] text-ink-soft dark:text-zinc-500">{n.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-1 rounded-lg text-ink-soft dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors self-start shrink-0"
                  title="Delete notification"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
