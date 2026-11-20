import { useEffect, useState } from "react";
import { OrderMessage } from "../types";
import { ChatService } from "../services/chat.service";

export function useOrderMessages(orderId?: string) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const unsub = ChatService.subscribeMessages(orderId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  const send = (message: Omit<OrderMessage, "id" | "timestamp">) => {
    if (!orderId) return Promise.reject(new Error("No orderId provided"));
    return ChatService.sendMessage(orderId, message);
  };

  return { messages, loading, send };
}
