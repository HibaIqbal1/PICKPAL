import { useEffect, useState } from "react";
import { WalletTransaction } from "../types";
import { WalletService } from "../services/wallet.service";

export function useWallet(userId?: string) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    WalletService.getBalance(userId).then(setBalance);

    const unsub = WalletService.subscribeTransactions(userId, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const addFunds = async (amount: number, description: string) => {
    if (!userId) return;
    const newBal = await WalletService.addFunds(userId, amount, description);
    setBalance(newBal);
  };

  return { balance, transactions, loading, addFunds };
}
