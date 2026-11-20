import { Order, PlatformAnalytics } from "../types";
import { FirebaseService } from "./firebase.service";

export class AnalyticsService {
  public static async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const orders = await FirebaseService.queryCollection<Order>("orders");
    const workers = await FirebaseService.queryCollection<any>("users");
    const activeWorkersCount = workers.filter((w) => w.role === "worker" && w.isAvailable).length;

    const completed = orders.filter((o) => o.status === "completed");
    const totalRevenue = completed.reduce((acc, o) => acc + (o.totalAmount || o.budgetCap || 0), 0);

    const categoryBreakdown: Record<string, number> = {};
    orders.forEach((o) => {
      categoryBreakdown[o.category] = (categoryBreakdown[o.category] || 0) + 1;
    });

    return {
      totalOrders: orders.length,
      activeWorkers: activeWorkersCount,
      totalRevenue,
      avgFulfillmentMinutes: 18.5,
      categoryBreakdown,
    };
  }
}
