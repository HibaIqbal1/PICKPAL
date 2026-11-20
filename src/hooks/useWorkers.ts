import { useEffect, useState } from "react";
import { PickPalUser } from "../types";
import { WorkerService } from "../services/worker.service";

export function useWorkers() {
  const [workers, setWorkers] = useState<PickPalUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = WorkerService.subscribeWorkers((items) => {
      setWorkers(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { workers, loading };
}
