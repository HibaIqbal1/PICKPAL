import { where, orderBy, Unsubscribe } from "firebase/firestore";
import { Order, OrderStatus, PickPalUser } from "../types";
import { FirebaseService } from "./firebase.service";
import { NotificationService } from "./notification.service";
import { WorkerService } from "./worker.service";
import { rankWorkers } from "../lib/matching";

export class BookingService {
  public static async createBooking(orderData: Omit<Order, "id">): Promise<Order> {
    const id = "ord_" + Math.random().toString(36).substring(2, 10);
    const order: Order = {
      ...orderData,
      id,
      status: orderData.workerId ? "worker_assigned" : "searching_worker",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto match worker if none provided
    if (!order.workerId && order.customerLat && order.customerLng) {
      try {
        const workers = await WorkerService.getAvailableWorkers(order.category);
        const allOrders = await FirebaseService.queryCollection<Order>("orders");
        const ranked = rankWorkers(workers, allOrders, order, order.customerLat, order.customerLng);
        if (ranked.length > 0) {
          order.workerId = ranked[0].worker.id;
          order.workerName = ranked[0].worker.name;
          order.status = "worker_assigned";
        }
      } catch (err) {
        console.error("Worker auto-matching error:", err);
      }
    }

    await FirebaseService.setDocument("orders", id, order);

    // Trigger Notification
    await NotificationService.createNotification({
      userId: order.customerId,
      title: order.status === "worker_assigned" ? "Worker Assigned" : "Finding Worker",
      desc: order.status === "worker_assigned"
        ? `Worker ${order.workerName} assigned to your request.`
        : `Searching for a matching worker near ${order.storeName}.`,
      time: "Just now",
      read: false,
      orderId: id,
      type: "order",
    });

    return order;
  }

  public static async createOrder(orderData: Omit<Order, "id">): Promise<Order> {
    return this.createBooking(orderData);
  }

  public static async updateBookingStatus(orderId: string, status: OrderStatus, extraData: Partial<Order> = {}): Promise<void> {
    const order = await FirebaseService.getDocument<Order>("orders", orderId);
    if (!order) return;

    const updates: Partial<Order> = {
      status,
      ...extraData,
      updatedAt: new Date().toISOString(),
    };

    await FirebaseService.updateDocument("orders", orderId, updates);

    const workerId = extraData.workerId || order.workerId;
    const workerName = extraData.workerName || order.workerName;

    // Handle job completion earnings & metrics logic
    if (status === "completed" && workerId) {
      try {
        const workerUser = await FirebaseService.getDocument<PickPalUser>("users", workerId);
        const orderAmount = extraData.totalAmount || order.totalAmount || order.budgetCap || 0;
        const commissionRate = 0.10; // 10% platform commission
        const netEarnings = Math.round(orderAmount * (1 - commissionRate));

        if (workerUser) {
          const currentEarnings = workerUser.earnings || 0;
          const currentJobsCount = workerUser.completedJobsCount || 0;
          const currentPendingPayout = workerUser.pendingPayout || 0;

          await FirebaseService.updateDocument("users", workerId, {
            earnings: currentEarnings + netEarnings,
            completedJobsCount: currentJobsCount + 1,
            pendingPayout: currentPendingPayout + netEarnings,
            updatedAt: new Date().toISOString(),
          });

          // Log transaction for worker
          const txId = "tx_" + Math.random().toString(36).substring(2, 10);
          await FirebaseService.setDocument("transactions", txId, {
            id: txId,
            userId: workerId,
            type: "credit",
            amount: netEarnings,
            description: `Net earnings from order #${orderId.slice(-6).toUpperCase()} (${order.storeName})`,
            paymentMethod: "Wallet Settlement",
            status: "success",
            referenceId: orderId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Failed to credit worker earnings on completion:", err);
      }
    }

    // Send notifications to customer & worker
    const statusLabels: Record<string, string> = {
      worker_assigned: `Worker ${workerName || ""} accepted order #${orderId.slice(-6).toUpperCase()}`,
      travelling: `Worker ${workerName || ""} is en route to your location`,
      arrived: `Worker ${workerName || ""} has arrived at your location`,
      in_progress: `Service started for ${order.storeName}`,
      checkout_approvals: `Worker requested checkout approval for ${order.storeName}`,
      delivering: `Worker is delivering your items`,
      completed: `Order #${orderId.slice(-6).toUpperCase()} completed successfully!`,
      cancelled: `Order #${orderId.slice(-6).toUpperCase()} was cancelled`,
    };

    if (statusLabels[status]) {
      // Customer notification
      await NotificationService.createNotification({
        userId: order.customerId,
        title: `Booking Update`,
        desc: statusLabels[status],
        time: "Just now",
        read: false,
        orderId: orderId,
        type: "order",
      });

      // Worker notification
      if (workerId) {
        await NotificationService.createNotification({
          userId: workerId,
          title: status === "worker_assigned" ? "Job Confirmed" : "Job Status Updated",
          desc: `Order #${orderId.slice(-6).toUpperCase()} status is now ${status.replace("_", " ")}`,
          time: "Just now",
          read: false,
          orderId: orderId,
          type: "order",
        });
      }
    }
  }

  public static subscribeCustomerBookings(customerId: string, onUpdate: (orders: Order[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<Order>(
      "orders",
      [where("customerId", "==", customerId)],
      (items) => {
        const sorted = items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        onUpdate(sorted);
      }
    );
  }

  public static subscribeWorkerJobs(workerId: string, onUpdate: (jobs: Order[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<Order>(
      "orders",
      [where("workerId", "==", workerId)],
      (items) => {
        const sorted = items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        onUpdate(sorted);
      }
    );
  }

  public static subscribeAllBookings(onUpdate: (orders: Order[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<Order>("orders", [], (items) => {
      const sorted = items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      onUpdate(sorted);
    });
  }
}
