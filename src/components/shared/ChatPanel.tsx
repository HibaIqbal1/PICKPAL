import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Check, X } from "lucide-react";
import { OrderMessage } from "../../types";

/**
 * Renders order chat, including AI-authored substitution proposals
 * (senderRole "ai") with inline approve/decline — matches the Message
 * schema's substitutionDecision/proposedItem fields exactly.
 */
export function ChatPanel({
  messages, currentUserId, onSend, onDecision,
}: {
  messages: OrderMessage[];
  currentUserId: string;
  onSend: (text: string) => void;
  onDecision?: (messageId: string, decision: "approved" | "declined") => void;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-1">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.senderId === currentUserId;
            const isAi = m.senderRole === "ai";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm
                  ${mine ? "bg-brand-500 text-white" : isAi ? "bg-sky-100 text-ink" : "bg-white border border-black/10 text-ink"}`}>
                  {isAi && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 mb-1">
                      <Sparkles size={11} /> AI Assistant
                    </div>
                  )}
                  {!mine && !isAi && <p className="text-[10px] font-semibold text-ink-soft mb-0.5">{m.senderName}</p>}
                  <p>{m.text}</p>

                  {m.proposedItem && (
                    <div className="mt-2 bg-white/70 rounded-xl p-2.5 border border-black/10">
                      <p className="text-xs font-semibold text-ink">{m.proposedItem.name}</p>
                      <p className="text-xs text-ink-soft">₹{m.proposedItem.price} {m.proposedItem.reason && `— ${m.proposedItem.reason}`}</p>
                      {!m.substitutionDecision && onDecision && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => onDecision(m.id, "approved")}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-mint-100 text-mint-600">
                            <Check size={12} /> Approve
                          </button>
                          <button onClick={() => onDecision(m.id, "declined")}
                                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-black/5 text-ink-soft">
                            <X size={12} /> Decline
                          </button>
                        </div>
                      )}
                      {m.substitutionDecision && (
                        <p className="text-[11px] font-semibold mt-2" style={{ color: m.substitutionDecision === "approved" ? "#14A866" : "#6B6478" }}>
                          {m.substitutionDecision === "approved" ? "Approved" : "Declined"}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] opacity-60 mt-1">{m.timestamp}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 pt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none border border-black/10 bg-white"
        />
        <button type="submit" className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
          <Send size={15} color="#fff" />
        </button>
      </form>
    </div>
  );
}
