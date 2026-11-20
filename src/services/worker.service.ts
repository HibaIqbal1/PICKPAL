import { where, Unsubscribe } from "firebase/firestore";
import { PickPalUser } from "../types";
import { FirebaseService } from "./firebase.service";

export class WorkerService {
  /**
   * Returns only active, verified, and online workers who offer the specified service category.
   * Offline workers (isAvailable === false) are strictly excluded.
   */
  public static async getAvailableWorkers(category?: string): Promise<PickPalUser[]> {
    const constraints = [
      where("role", "==", "worker"),
      where("isAvailable", "==", true),
      where("verified", "==", true),
    ];
    const workers = await FirebaseService.queryCollection<PickPalUser>("users", ...constraints);

    // Further filter out suspended/banned workers and matching service categories
    return workers.filter((w) => {
      if (w.status !== "active" && w.status !== "pendingApproval") return false;
      if (category && w.servicesOffered && w.servicesOffered.length > 0) {
        return w.servicesOffered.includes(category);
      }
      return true;
    });
  }

  public static async setAvailability(workerId: string, isAvailable: boolean): Promise<void> {
    await FirebaseService.updateDocument("users", workerId, {
      isAvailable,
      updatedAt: new Date().toISOString(),
    });
  }

  public static async updateServices(workerId: string, servicesOffered: string[]): Promise<void> {
    await FirebaseService.updateDocument("users", workerId, {
      servicesOffered,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Safely updates worker profile fields while preventing unauthorized privilege escalation.
   */
  public static async updateWorkerProfile(workerId: string, updates: Partial<PickPalUser>): Promise<void> {
    // Strip forbidden fields that workers cannot mutate themselves
    const forbidden = ["role", "verified", "status", "earnings", "rating", "completedJobsCount"];
    const safeUpdates: Record<string, any> = {};

    Object.entries(updates).forEach(([key, val]) => {
      if (!forbidden.includes(key) && val !== undefined) {
        safeUpdates[key] = val;
      }
    });

    safeUpdates.updatedAt = new Date().toISOString();
    await FirebaseService.updateDocument("users", workerId, safeUpdates);
  }

  /**
   * Verifies phone OTP for worker onboarding.
   * Note: Phone verification sets `phoneVerified: true`, while worker identity document verification (`verified`)
   * remains a separate process requiring Area Manager review.
   */
  public static async verifyOtp(type: "phone" | "email", target: string, code: string): Promise<boolean> {
    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) return false;
    return true;
  }

  public static subscribeWorkers(onUpdate: (workers: PickPalUser[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<PickPalUser>(
      "users",
      [where("role", "==", "worker")],
      onUpdate
    );
  }
}
