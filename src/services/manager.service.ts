import { SosAlert, SosStatus } from "../types";
import { FirebaseService } from "./firebase.service";
import { Unsubscribe } from "firebase/firestore";

export class ManagerService {
  public static async createSos(sosData: Omit<SosAlert, "id">): Promise<void> {
    const id = "sos_" + Math.random().toString(36).substring(2, 10);
    const sos: SosAlert = {
      ...sosData,
      id,
      createdAt: new Date().toISOString(),
    };
    await FirebaseService.setDocument("sos_alerts", id, sos);
  }

  public static async resolveSosAlert(alertId: string, resolvedBy: string): Promise<void> {
    await FirebaseService.updateDocument("sos_alerts", alertId, {
      status: "resolved",
      resolvedBy,
    });
  }

  public static subscribeSosAlerts(onUpdate: (alerts: SosAlert[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<SosAlert>(
      "sos_alerts",
      [],
      (items) => {
        const sorted = items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        onUpdate(sorted);
      }
    );
  }
}
