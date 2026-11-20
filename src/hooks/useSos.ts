import { useEffect, useState } from "react";
import { SosAlert } from "../types";
import { ManagerService } from "../services/manager.service";

/** Live SOS alert feed for the manager/admin panel. */
export function useSos() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = ManagerService.subscribeSosAlerts((items) => {
      setAlerts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const open = alerts.filter((a) => a.status === "open");
  return { alerts, open, loading };
}

/** Create an SOS alert. */
export async function createSos(sosData: Omit<SosAlert, "id">) {
  await ManagerService.createSos(sosData);
}

/** Manager resolves an open SOS alert. */
export async function resolveSos(id: string, resolvedBy: string) {
  await ManagerService.resolveSosAlert(id, resolvedBy);
}
