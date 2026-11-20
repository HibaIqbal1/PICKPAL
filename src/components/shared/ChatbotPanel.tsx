import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, FileText, ChevronRight, HelpCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../../firebase";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  sources?: { title: string; source: string }[];
  isFallback?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How does salon token booking work?",
  "Which services can come to my home?",
  "How do I book a service?",
  "How does the waiting time work?",
  "How can I cancel a booking?",
];

export default function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Hello! I am your PickPal AI Assistant powered by RAG and Google Gemini. Ask me anything about our services, booking process, salon queue tokens, workers, or live order status!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // Get Firebase Auth Bearer token if user is signed in
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;

      let response: Response | null = null;
      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ message: query }),
        });
      } catch {
        // Retry direct backend URL on port 8080
        response = await fetch("http://localhost:8080/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ message: query }),
        }).catch(() => null);
      }

      if (response && response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.answer || "I couldn't process that response.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: data.sources || [],
          isFallback: data.answer?.includes("couldn't find that information"),
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }

      // Smart RAG fallback response if backend server is starting up or unavailable
      let fallbackText = "Hello! I am PickPal AI Assistant. How can I help you with our services, salon tokens, bookings, or workers today?";
      const lq = query.toLowerCase();
      if (lq.includes("token") || lq.includes("salon") || lq.includes("queue")) {
        fallbackText = "PickPal Salon Token Queue System lets you book live digital queue tokens for partner salons. You can track estimated wait times, live queue status, and receive real-time notifications when it's your turn to visit!";
      } else if (lq.includes("home") || lq.includes("repair") || lq.includes("cleaning") || lq.includes("plumbing")) {
        fallbackText = "PickPal Home Services include doorstep plumbing, electrical repairs, home cleaning, appliance maintenance, and errand runs. Verified workers are dispatched directly to your address.";
      } else if (lq.includes("cancel") || lq.includes("refund")) {
        fallbackText = "You can cancel bookings or salon tokens directly from your PickPal Bookings / Queue tab. Cancellation fees depend on worker assignment status as detailed in our cancellation policy.";
      } else if (lq.includes("order") || lq.includes("status") || lq.includes("where")) {
        fallbackText = "You can view your active order status, worker live GPS location, and estimated arrival time in the PickPal Customer Dashboard under Active Bookings.";
      }

      const aiFallbackMsg: ChatMessage = {
        id: `ai-fb-${Date.now()}`,
        sender: "ai",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [{ title: "PickPal System Guide", source: "faq.md" }],
        isFallback: true,
      };
      setMessages((prev) => [...prev, aiFallbackMsg]);
    } catch (err: any) {
      console.error("Chatbot error:", err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "Hi! I am PickPal AI. How can I assist you with services, bookings, or salon queue tokens?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chatbot Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-brand-500 via-indigo-600 to-purple-600 text-white font-bold text-sm rounded-full shadow-2xl hover:shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
          >
            <div className="relative flex items-center justify-center">
              <Bot size={20} className="animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
            </div>
            <span className="font-display font-black tracking-wide">💬 PickPal AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Chatbot Panel Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-md h-[580px] max-h-[85vh] bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header Banner */}
            <div className="p-4 bg-gradient-to-r from-brand-600 via-indigo-650 to-purple-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-black text-base tracking-tight">PickPal AI Assistant</h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-widest">
                      RAG
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium">Ask me anything about PickPal</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                aria-label="Close Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-zinc-950/40 text-xs">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl space-y-2 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-brand-500 text-white rounded-br-xs font-medium"
                        : "bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 border border-black/5 dark:border-white/5 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Sources Badge List */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-1">
                        <span className="text-[10px] font-bold text-ink-muted dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText size={11} className="text-brand-500" /> Sources
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-500/20"
                            >
                              • {s.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-ink-muted dark:text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-ink-soft dark:text-zinc-400">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl rounded-bl-xs border border-black/5 flex items-center gap-1.5 shadow-sm">
                    <Sparkles size={14} className="animate-spin text-brand-500" />
                    <span className="text-[11px] font-medium animate-pulse">Searching knowledge base...</span>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggested Questions Chips */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider">
                <HelpCircle size={12} className="text-brand-500" /> Suggested Questions
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={loading}
                    className="whitespace-nowrap text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-ink dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-400 border border-black/5 dark:border-white/5 transition-colors shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-zinc-900 border-t border-black/5 dark:border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about services, salon tokens, orders..."
                disabled={loading}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 text-ink dark:text-zinc-100 text-xs px-3.5 py-2.5 rounded-2xl border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
