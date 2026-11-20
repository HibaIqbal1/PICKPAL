import { where, Unsubscribe } from "firebase/firestore";
import { WalletTransaction, PickPalUser } from "../types";
import { FirebaseService } from "./firebase.service";

export class WalletService {
  public static async getBalance(userId: string): Promise<number> {
    const user = await FirebaseService.getDocument<PickPalUser>("users", userId);
    return user?.walletBalance ?? 0;
  }

  public static async addFunds(
    userId: string,
    amount: number,
    description: string,
    paymentMethod: "UPI" | "Card" | "QR Code" | "Net Banking" = "UPI"
  ): Promise<number> {
    const current = await this.getBalance(userId);
    const newBalance = current + amount;
    await FirebaseService.updateDocument("users", userId, { walletBalance: newBalance });

    const txId = "tx_" + Math.random().toString(36).substring(2, 10);
    const refNo = "REF" + Math.floor(10000000 + Math.random() * 90000000);
    const tx: WalletTransaction = {
      id: txId,
      userId,
      type: "credit",
      amount,
      description,
      paymentMethod,
      status: "success",
      referenceId: refNo,
      timestamp: new Date().toISOString(),
    };
    await FirebaseService.setDocument("transactions", txId, tx);

    return newBalance;
  }

  public static async deductFunds(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string
  ): Promise<boolean> {
    const current = await this.getBalance(userId);
    if (current < amount) {
      return false; // Insufficient balance
    }
    const newBalance = current - amount;
    await FirebaseService.updateDocument("users", userId, { walletBalance: newBalance });

    const txId = "tx_" + Math.random().toString(36).substring(2, 10);
    const refNo = referenceId || ("REF" + Math.floor(10000000 + Math.random() * 90000000));
    const tx: WalletTransaction = {
      id: txId,
      userId,
      type: "debit",
      amount,
      description,
      paymentMethod: "Wallet Settlement",
      status: "success",
      referenceId: refNo,
      timestamp: new Date().toISOString(),
    };
    await FirebaseService.setDocument("transactions", txId, tx);

    return true;
  }

  public static subscribeTransactions(userId: string, onUpdate: (txs: WalletTransaction[]) => void): Unsubscribe {
    return FirebaseService.subscribeQuery<WalletTransaction>(
      "transactions",
      [where("userId", "==", userId)],
      (items) => {
        const sorted = items.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
        onUpdate(sorted);
      }
    );
  }
}
