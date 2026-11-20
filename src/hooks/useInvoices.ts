import { useEffect, useState } from "react";
import { InvoiceRecord } from "../types";
import { InvoiceService } from "../services/invoice.service";

export function useInvoices(userId?: string) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsub = InvoiceService.subscribeUserInvoices(userId, (items) => {
      setInvoices(items);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { invoices, loading };
}
