import React, { useState, useEffect } from "react";
import { Bell, Plus, Send, CheckCircle2, Search, Megaphone, User } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { AppNotification } from "../../types";

export default function ControlNotifications() {
  const { profile, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastDesc, setBroadcastDesc] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<AppNotification>("notifications", [], (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastDesc.trim() || !profile) return;
    setSending(true);

    const id = "notif_" + Date.now();
    const payload: AppNotification = {
      id,
      userId: "broadcast",
      title: broadcastTitle.trim(),
      desc: broadcastDesc.trim(),
      time: new Date().toISOString(),
      read: false,
      type: "system",
    };

    try {
      await FirebaseService.setDocument("notifications", id, payload);
      setShowBroadcastModal(false);
      setBroadcastTitle("");
      setBroadcastDesc("");
      alert("Platform broadcast announcement sent.");
    } catch (err: any) {
      alert("Failed to send broadcast: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ControlLayout
      title="Platform Operational Notifications"
      subtitle="System notification log and platform-wide manager announcements"
      action={
        isAdmin ? (
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Send size={15} /> Send Broadcast Announcement
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading system notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Bell size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No notifications recorded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Order dispatches, payment alerts, and broadcast announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600/10 border border-brand-500/30 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">{notif.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{notif.desc}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {new Date(notif.time).toLocaleString()} • Target: {notif.userId}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Send Platform Announcement</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Title</label>
                <input
                  required
                  placeholder="e.g. Scheduled System Maintenance"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Message Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write message content..."
                  value={broadcastDesc}
                  onChange={(e) => setBroadcastDesc(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white shadow-md"
                >
                  {sending ? "Sending..." : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
