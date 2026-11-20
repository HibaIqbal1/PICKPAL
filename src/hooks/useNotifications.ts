import { useEffect, useState } from "react";
import { AppNotification } from "../types";
import { NotificationService } from "../services/notification.service";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsub = NotificationService.subscribeUserNotifications(userId, (items) => {
      setNotifications(items);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const markRead = (id: string) => NotificationService.markAsRead(id);
  const markAllRead = () => userId && NotificationService.markAllAsRead(userId);

  return { notifications, loading, markRead, markAllRead };
}
