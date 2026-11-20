import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import type { Order } from "../../types";
import { Skeleton } from "../ui/Skeleton";
import { RotateCcw, Package } from "lucide-react";

export function RecentOrders({ onReorder }: { onReorder: (order: Order) => void }) {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", firebaseUser.uid),
      where("status", "==", "completed"),
      orderBy("updatedAt", "desc"),
      limit(6)
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => d.data() as Order));
    }, () => setOrders([]));
    return unsub;
  }, [firebaseUser]);

  if (orders && orders.length === 0) return null;

  return (
    <div className="mt-6 px-5">
      <h2 className="font-display text-lg font-semibold text-ink mb-3">Previously requested</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {orders === null && [1, 2, 3].map((i) => <Skeleton key={i} className="w-40 h-28 shrink-0 rounded-2xl" />)}
        {orders?.map((o, i) => (
          <motion.button
            key={o.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onReorder(o)}
            className="shrink-0 w-40 rounded-2xl border border-line bg-white p-3 text-left shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center mb-2">
              <Package size={16} className="text-ink/60" />
            </div>
            <p className="text-sm font-semibold text-ink leading-tight line-clamp-1">{o.storeName}</p>
            <p className="text-[11px] text-ink/50 mt-0.5 capitalize">{o.category}</p>
            <div className="flex items-center gap-1 mt-2 text-coral text-xs font-semibold">
              <RotateCcw size={12} /> Reorder
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
