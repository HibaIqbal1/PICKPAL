import { WalletService } from "./wallet.service";
import { NotificationService } from "./notification.service";

export type PaymentMethodType = "UPI" | "QR Code" | "Card" | "Net Banking";

export interface PaymentPayload {
  userId: string;
  amount: number;
  method: PaymentMethodType;
  upiId?: string;
  upiApp?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  bankCode?: string;
  bankName?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  referenceId: string;
  newBalance: number;
  message: string;
}

export interface IPaymentProvider {
  processPayment(payload: PaymentPayload): Promise<PaymentResult>;
}

export class TestPaymentProvider implements IPaymentProvider {
  public async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    // Simulate payment gateway API latency (1 second delay)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (payload.amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const refNo = "TXN-" + payload.method.replace(/\s+/g, "").toUpperCase() + "-" + Math.floor(10000000 + Math.random() * 90000000);
    const desc = this.buildDescription(payload);

    // Update wallet balance & add transaction record
    const newBalance = await WalletService.addFunds(
      payload.userId,
      payload.amount,
      desc,
      payload.method
    );

    // Send Notification
    await NotificationService.createNotification({
      userId: payload.userId,
      title: "Wallet Top-up Successful",
      desc: `₹${payload.amount.toFixed(2)} added to your wallet via ${payload.method}. Ref: ${refNo}`,
      time: "Just now",
      read: false,
      type: "payment",
    });

    return {
      success: true,
      transactionId: "tx_" + Math.random().toString(36).substring(2, 10),
      referenceId: refNo,
      newBalance,
      message: `Successfully added ₹${payload.amount.toFixed(2)} to your wallet!`,
    };
  }

  private buildDescription(payload: PaymentPayload): string {
    switch (payload.method) {
      case "UPI":
        return `Top-up via UPI (${payload.upiId || payload.upiApp || "GPay/PhonePe"})`;
      case "QR Code":
        return `Top-up via QR Code Scan`;
      case "Card":
        const last4 = payload.cardNumber ? payload.cardNumber.slice(-4) : "4242";
        return `Top-up via Credit/Debit Card (ending in ${last4})`;
      case "Net Banking":
        return `Top-up via Net Banking (${payload.bankName || "SBI/HDFC"})`;
      default:
        return `Top-up via ${payload.method}`;
    }
  }
}

export class PaymentGatewayService {
  private static provider: IPaymentProvider = new TestPaymentProvider();

  public static setProvider(newProvider: IPaymentProvider): void {
    this.provider = newProvider;
  }

  public static async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    return this.provider.processPayment(payload);
  }
}
