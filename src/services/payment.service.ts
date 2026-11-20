import { Order } from "../types";
import { FirebaseService } from "./firebase.service";
import { WalletService } from "./wallet.service";
import { NotificationService } from "./notification.service";
import { InvoiceService } from "./invoice.service";
import { ChatService } from "./chat.service";

export class PaymentService {
  public static async processOrderPayment(order: Order, tipAmount: number = 0): Promise<boolean> {
    const baseAmount = order.totalAmount || order.budgetCap || 100;
    const gst = Math.round(baseAmount * 0.18);
    const totalToPay = baseAmount + gst + tipAmount;
    const commission = Math.round(baseAmount * 0.10);

    // 1. Deduct from customer wallet
    const success = await WalletService.deductFunds(
      order.customerId,
      totalToPay,
      `Payment for ${order.storeName} (#${order.id.slice(-6).toUpperCase()})`,
      `REF-${order.id.slice(-6).toUpperCase()}`
    );

    if (!success) {
      return false;
    }

    // 2. Credit earnings to worker if assigned
    if (order.workerId) {
      await WalletService.addFunds(
        order.workerId,
        baseAmount - commission + tipAmount,
        `Earnings payout for #${order.id.slice(-6).toUpperCase()}`
      );
    }

    // 3. Update order status & payment status
    await FirebaseService.updateDocument("orders", order.id, {
      status: "completed",
      paymentStatus: "paid",
      totalAmount: baseAmount,
      tipAmount,
    });

    // 4. Create Invoice Record
    const invId = "INV-" + Math.floor(1000 + Math.random() * 9000);
    await InvoiceService.createInvoiceRecord({
      id: invId,
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      workerName: order.workerName || "Assigned Partner",
      storeName: order.storeName,
      category: order.category,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      amount: baseAmount,
      commission,
      gst,
      totalPaid: totalToPay,
      paymentMethod: "PickPal Wallet Settlement",
      items: order.items,
    });

    // 5. Send System Notification
    await NotificationService.createNotification({
      userId: order.customerId,
      title: "Order Completed & Paid",
      desc: `Payment of ₹${totalToPay} was processed. Invoice #${invId} generated.`,
      time: "Just now",
      read: false,
      orderId: order.id,
      type: "payment",
    });

    // 6. Post Chat timeline update for Inbox synchronization
    await ChatService.sendMessage(order.id, {
      senderId: "system",
      senderName: "PickPal System",
      senderRole: "system",
      text: `Order completed successfully. Payment of ₹${totalToPay} settled via PickPal Wallet. Invoice #${invId} issued.`,
    });

    return true;
  }
}
