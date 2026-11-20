import { AppNotification } from "../types";
import { FirebaseService } from "./firebase.service";
import { where, Unsubscribe } from "firebase/firestore";

export class NotificationService {
  public static async createNotification(notifData: Omit<AppNotification, "id">): Promise<void> {
    const id = "notif_" + Math.random().toString(36).substring(2, 10);
    const notif: AppNotification = {
      ...notifData,
      id,
    };
    await FirebaseService.setDocument("notifications", id, notif);
  }

  public static async markAsRead(id: string): Promise<void> {
    await FirebaseService.updateDocument("notifications", id, { read: true });
  }

  public static async markAllAsRead(userId: string): Promise<void> {
    const notifs = await FirebaseService.queryCollection<AppNotification>(
      "notifications",
      where("userId", "==", userId),
      where("read", "==", false)
    );
    for (const n of notifs) {
      await this.markAsRead(n.id);
    }
  }

  public static subscribeUserNotifications(userId: string, onUpdate: (notifications: AppNotification[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<AppNotification>(
      "notifications",
      [where("userId", "==", userId)],
      (items) => {
        const sorted = items.sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""));
        onUpdate(sorted);
      }
    );
  }
}
