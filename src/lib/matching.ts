/**
 * Client-side worker ranking. Real production matching should run server-side
 * (Cloud Function triggered on order create) so it can't be gamed by the
 * client — this implementation is honest about that limitation but keeps the
 * same scoring logic so it's a straight lift-and-shift later.
 *
 * score = proximity + rating*2 - (activeLoad*3) + familiarityBonus
 */
import { PickPalUser, Order } from "../types";

export function haversineKm(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 5;
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export interface RankedWorker {
  worker: PickPalUser;
  score: number;
  distanceKm: number;
}

export function rankWorkers(
  workers: PickPalUser[],
  activeOrders: Order[],
  order: Order,
  customerLat?: number,
  customerLng?: number
): RankedWorker[] {
  return workers
    .filter((w) => w.isAvailable)
    .map((w) => {
      const distance = haversineKm(customerLat, customerLng, w.lat, w.lng);
      const activeLoad = activeOrders.filter(
        (o) => o.workerId === w.id && o.status !== "completed" && o.status !== "cancelled"
      ).length;
      const proximity = Math.max(0, 10 - distance);
      const ratingScore = (w.rating ?? 5) * 2;
      const loadPenalty = activeLoad * 3;
      const score = proximity + ratingScore - loadPenalty;
      return { worker: w, score, distanceKm: Math.round(distance * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score);
}

/** Simple ETA estimate from distance — swap for a real routing API later. */
export function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(8, Math.round(distanceKm * 3 + 5));
}
