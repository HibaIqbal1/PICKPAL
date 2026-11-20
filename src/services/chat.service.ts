import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, Unsubscribe } from "firebase/firestore";
import { OrderMessage } from "../types";

export class ChatService {
  public static sendMessage(orderId: string, message: Omit<OrderMessage, "id" | "timestamp">): Promise<void> {
    const messagesRef = collection(db, "orders", orderId, "messages");
    return addDoc(messagesRef, {
      ...message,
      timestamp: new Date().toISOString(),
    }).then(() => {});
  }

  public static subscribeMessages(orderId: string, onUpdate: (msgs: OrderMessage[]) => void): Unsubscribe {
    const q = query(collection(db, "orders", orderId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderMessage));
      onUpdate(msgs);
    });
  }
}
