import { FirebaseService } from "./firebase.service";
import { PickPalUser, ComplaintDoc, ComplaintStatus, ShopDoc, QueueDoc, SystemLog, SosAlert } from "../types";
import { Unsubscribe } from "firebase/firestore";

export class ControlService {
  /**
   * Log an append-only system audit log
   */
  public static async logSystemAction(action: string, details: string, createdBy: string): Promise<void> {
    const id = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const log: SystemLog = {
      id,
      action,
      details,
      createdBy,
      timestamp: new Date().toISOString(),
    };
    try {
      await FirebaseService.setDocument("system_logs", id, log);
    } catch (err) {
      console.warn("Failed to write system audit log:", err);
    }
  }

  /**
   * Approve worker application
   */
  public static async approveWorkerApplication(workerId: string, managerId: string): Promise<void> {
    const now = new Date().toISOString();
    await FirebaseService.updateDocument("users", workerId, {
      status: "active",
      verified: true,
      verificationStatus: "approved",
      approvedAt: now,
      approvedBy: managerId,
      updatedAt: now,
    });

    await this.logSystemAction(
      "Worker Approved",
      `Worker ID ${workerId} verification application approved by manager ${managerId}`,
      managerId
    );
  }

  /**
   * Reject worker application with mandatory reason
   */
  public static async rejectWorkerApplication(
    workerId: string,
    managerId: string,
    reason: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await FirebaseService.updateDocument("users", workerId, {
      status: "rejected",
      verificationStatus: "rejected",
      rejectionReason: reason,
      rejectedAt: now,
      updatedAt: now,
    });

    await this.logSystemAction(
      "Worker Rejected",
      `Worker ID ${workerId} rejected by manager ${managerId}. Reason: ${reason}`,
      managerId
    );
  }

  /**
   * Suspend a user account (worker or customer)
   */
  public static async suspendUser(userId: string, managerId: string, reason?: string): Promise<void> {
    const now = new Date().toISOString();
    await FirebaseService.updateDocument("users", userId, {
      status: "suspended",
      updatedAt: now,
    });

    await this.logSystemAction(
      "User Suspended",
      `User ID ${userId} suspended by ${managerId}.${reason ? ` Reason: ${reason}` : ""}`,
      managerId
    );
  }

  /**
   * Reactivate a suspended user account
   */
  public static async reactivateUser(userId: string, managerId: string): Promise<void> {
    const now = new Date().toISOString();
    await FirebaseService.updateDocument("users", userId, {
      status: "active",
      updatedAt: now,
    });

    await this.logSystemAction(
      "User Reactivated",
      `User ID ${userId} reactivated by ${managerId}`,
      managerId
    );
  }

  /**
   * Create or update shop
   */
  public static async saveShop(shopData: Partial<ShopDoc>, managerId: string): Promise<string> {
    const now = new Date().toISOString();
    const id = shopData.id || "shop_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    
    const payload: ShopDoc = {
      id,
      name: shopData.name || "New Shop",
      category: shopData.category || "General",
      address: shopData.address || "",
      latitude: shopData.latitude || 12.9716,
      longitude: shopData.longitude || 77.5946,
      phone: shopData.phone || "",
      openingTime: shopData.openingTime || "09:00",
      closingTime: shopData.closingTime || "21:00",
      services: shopData.services || [],
      status: shopData.status || "active",
      ownerId: shopData.ownerId || managerId,
      createdAt: shopData.createdAt || now,
      updatedAt: now,
    };

    await FirebaseService.setDocument("shops", id, payload);

    await this.logSystemAction(
      shopData.id ? "Shop Updated" : "Shop Created",
      `Shop "${payload.name}" (${id}) saved by ${managerId}`,
      managerId
    );

    return id;
  }

  /**
   * Save or update complaint
   */
  public static async saveComplaint(complaintData: Partial<ComplaintDoc>, managerId: string): Promise<void> {
    const now = new Date().toISOString();
    const id = complaintData.id || "comp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    
    const payload: ComplaintDoc = {
      id,
      issue: complaintData.issue || "Customer complaint",
      description: complaintData.description || "",
      priority: complaintData.priority || "Medium",
      status: complaintData.status || "Open",
      customerId: complaintData.customerId || "",
      customerName: complaintData.customerName || "Anonymous Customer",
      workerId: complaintData.workerId || "",
      workerName: complaintData.workerName || "Unassigned Worker",
      orderId: complaintData.orderId || "",
      internalNotes: complaintData.internalNotes || "",
      assignedTo: complaintData.assignedTo || managerId,
      createdAt: complaintData.createdAt || now,
      updatedAt: now,
    };

    await FirebaseService.setDocument("complaints", id, payload);

    await this.logSystemAction(
      "Complaint Updated",
      `Complaint ${id} status set to ${payload.status} by ${managerId}`,
      managerId
    );
  }

  /**
   * Advance or manage shop queue
   */
  public static async updateShopQueue(queueData: Partial<QueueDoc>, managerId: string): Promise<void> {
    if (!queueData.shopId) return;
    const now = new Date().toISOString();
    const id = queueData.id || "queue_" + queueData.shopId;
    
    const payload: QueueDoc = {
      id,
      shopId: queueData.shopId,
      shopName: queueData.shopName || "Shop Queue",
      currentToken: queueData.currentToken ?? 1,
      peopleWaiting: Math.max(0, queueData.peopleWaiting ?? 0),
      estimatedWaitMinutes: queueData.estimatedWaitMinutes ?? 15,
      todayAppointmentsCount: queueData.todayAppointmentsCount ?? 0,
      availableSlots: queueData.availableSlots ?? 10,
      status: queueData.status || "active",
      updatedAt: now,
    };

    await FirebaseService.setDocument("queue", id, payload);
  }
}
