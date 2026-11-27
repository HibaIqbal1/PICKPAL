import { auth } from "../lib/firebase";
import { Order, OrderStatus } from "../types";
import { FirebaseService } from "./firebase.service";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

export interface FastApiOrder {
  id: string;
  customer_id: string;
  worker_id?: string | null;
  store_name: string;
  category: string;
  items_description: string;
  shipping_tier: "LOCAL" | "STATE" | "GLOBAL";
  budget_cap: number;
  actual_item_cost: number;
  delivery_fee: number;
  service_fee: number;
  total_amount: number;
  status: OrderStatus;
  delivery_otp?: string;
  store_receipt_url?: string | null;
  replacement_notes?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface FastApiEscrow {
  id: string;
  order_id: string;
  customer_id: string;
  worker_id?: string | null;
  amount_held: number;
  amount_released: number;
  amount_refunded: number;
  status: "HELD" | "RELEASED" | "REFUNDED" | "DISPUTED";
  created_at: string;
  released_at?: string | null;
}

export class BookingService {
  /**
   * Helper to retrieve auth token for FastAPI requests.
   * If logged in with Firebase, sends the Firebase ID token.
   * If not logged in, falls back to role identifier (CUST_001 or WORKER_001).
   */
  private static async getAuthHeader(roleFallback: "customer" | "worker" = "customer"): Promise<Record<string, string>> {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      }
    } catch {
      // Fallback to role token
    }
    const fallbackId = roleFallback === "worker" ? "WORKER_001" : "CUST_001";
    return {
      Authorization: `Bearer ${fallbackId}`,
      "X-User-Id": fallbackId,
    };
  }

  /**
   * Creates a new Order and atomically holds funds in Escrow in Neon PostgreSQL.
   */
  public static async createOrder(orderData: any): Promise<FastApiOrder> {
    const authHeaders = await this.getAuthHeader("customer");

    const payload = {
      store_name: orderData.store_name || orderData.storeName || "Spencer's Daily",
      category: orderData.category || "Groceries",
      items_description:
        orderData.items_description ||
        orderData.itemsDescription ||
        (Array.isArray(orderData.items) ? orderData.items.map((i: any) => i.name).join(", ") : "Order items"),
      shipping_tier: (orderData.shipping_tier || orderData.shippingTier || "LOCAL").toUpperCase(),
      budget_cap: Number(orderData.budget_cap ?? orderData.budgetCap ?? 500),
      delivery_fee: Number(orderData.delivery_fee ?? orderData.deliveryFee ?? orderData.shippingFee ?? 40),
    };

    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.detail || errorMsg;
      } catch {
        errorMsg = errText || errorMsg;
      }
      throw new Error(`Order creation failed: ${errorMsg}`);
    }

    const createdOrder: FastApiOrder = await res.json();

    // Mirror to Firestore so legacy components also update seamlessly
    try {
      const legacyOrder: Partial<Order> = {
        id: createdOrder.id,
        customerId: createdOrder.customer_id,
        storeName: createdOrder.store_name,
        category: createdOrder.category as any,
        budgetCap: createdOrder.budget_cap,
        totalAmount: createdOrder.total_amount,
        status: createdOrder.status,
        createdAt: createdOrder.created_at,
        updatedAt: createdOrder.created_at,
        shippingFee: createdOrder.delivery_fee,
        serviceFee: createdOrder.service_fee,
        items: [{ name: createdOrder.items_description, price: createdOrder.budget_cap, qty: 1 }],
      };
      await FirebaseService.setDocument("orders", createdOrder.id, legacyOrder);
    } catch {
      // Non-blocking Firestore sync
    }

    return createdOrder;
  }

  /**
   * Legacy alias for createOrder
   */
  public static async createBooking(orderData: any): Promise<Order> {
    const fastApiOrder = await this.createOrder(orderData);
    return {
      id: fastApiOrder.id,
      customerId: fastApiOrder.customer_id,
      customerName: (orderData as any)?.customerName || "Customer",
      storeName: fastApiOrder.store_name,
      category: fastApiOrder.category as any,
      budgetCap: fastApiOrder.budget_cap,
      totalAmount: fastApiOrder.total_amount,
      status: fastApiOrder.status,
      createdAt: fastApiOrder.created_at,
      updatedAt: fastApiOrder.created_at,
      shippingFee: fastApiOrder.delivery_fee,
      serviceFee: fastApiOrder.service_fee,
      items: [{ name: fastApiOrder.items_description, price: fastApiOrder.budget_cap, qty: 1 }],
    };
  }

  /**
   * Fetches orders from FastAPI backend with optional status filter.
   */
  public static async getOrders(statusFilter?: string, role: "customer" | "worker" = "worker"): Promise<FastApiOrder[]> {
    const authHeaders = await this.getAuthHeader(role);
    const query = statusFilter ? `?status_filter=${statusFilter}` : "";
    const res = await fetch(`${API_BASE_URL}/api/orders${query}`, {
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Fetches single order details by ID from Neon.
   */
  public static async getOrderById(orderId: string): Promise<FastApiOrder> {
    const authHeaders = await this.getAuthHeader("customer");
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      throw new Error(`Order #${orderId} not found`);
    }

    return res.json();
  }

  /**
   * Worker claims an unassigned order.
   */
  public static async claimOrder(orderId: string, _workerId?: string): Promise<FastApiOrder> {
    const authHeaders = await this.getAuthHeader("worker");
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/claim`, {
      method: "POST",
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to claim order");
    }

    return res.json();
  }

  /**
   * Worker records the physical store purchase and uploads the receipt.
   */
  public static async recordStorePurchase(
    orderId: string,
    actualItemCost: number,
    receiptFile: File | Blob
  ): Promise<FastApiOrder> {
    const authHeaders = await this.getAuthHeader("worker");
    const formData = new FormData();
    formData.append("actual_item_cost", actualItemCost.toString());
    formData.append("receipt_file", receiptFile, (receiptFile as any).name || "store_receipt.jpg");

    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/store-purchase`, {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Failed to record store purchase");
    }

    return res.json();
  }

  /**
   * Worker completes delivery by verifying customer OTP and triggering escrow payout.
   */
  public static async completeDelivery(orderId: string, otp: string): Promise<FastApiEscrow> {
    const authHeaders = await this.getAuthHeader("worker");
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/complete-delivery?otp=${encodeURIComponent(otp)}`, {
      method: "POST",
      headers: {
        ...authHeaders,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Invalid OTP or delivery completion failed");
    }

    return res.json();
  }

  /**
   * Updates booking status in Firestore & backend.
   */
  public static async updateBookingStatus(orderId: string, status: OrderStatus, extraData: Partial<Order> = {}): Promise<void> {
    try {
      await FirebaseService.updateDocument("orders", orderId, {
        status,
        ...extraData,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Ignore if Firestore is unavailable
    }
  }

  public static subscribeCustomerBookings(customerId: string, onUpdate: (orders: Order[]) => void) {
    try {
      return FirebaseService.subscribeQuery<Order>("orders", [], (items) => {
        const filtered = items.filter((o) => o.customerId === customerId);
        onUpdate(filtered);
      });
    } catch {
      return () => {};
    }
  }

  public static subscribeWorkerJobs(workerId: string, onUpdate: (jobs: Order[]) => void) {
    try {
      return FirebaseService.subscribeQuery<Order>("orders", [], (items) => {
        const filtered = items.filter((o) => o.workerId === workerId);
        onUpdate(filtered);
      });
    } catch {
      return () => {};
    }
  }

  public static subscribeAllBookings(onUpdate: (orders: Order[]) => void) {
    try {
      return FirebaseService.subscribeQuery<Order>("orders", [], onUpdate);
    } catch {
      return () => {};
    }
  }
}
