import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Mic, Image, Loader2, MicOff, X } from "lucide-react";

export function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [isFocused, setIsFocused]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning]   = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported."); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart  = () => setIsListening(true);
    recognition.onerror  = () => setIsListening(false);
    recognition.onend    = () => setIsListening(false);
    recognition.onresult = (event: any) => onChange(event.results[0][0].transcript);
    recognition.start();
  };

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await new Promise((res) => setTimeout(res, 1500));
      const fn = file.name.toLowerCase();
      let query = "grocery";
      if (fn.includes("tv") || fn.includes("screen"))  query = "Appliance Repair";
      else if (fn.includes("pipe") || fn.includes("tap")) query = "Plumber";
      else if (fn.includes("wire") || fn.includes("bulb")) query = "Electrician";
      else if (fn.includes("milk") || fn.includes("food")) query = "Grocery";
      else if (fn.includes("med") || fn.includes("pill"))  query = "Medicine";
      else if (fn.includes("cloth") || fn.includes("laundry")) query = "Laundry";
      onChange(query);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.div
        animate={{ boxShadow: isFocused
          ? "0 0 0 3px rgba(232,35,107,.15), 0 4px 20px rgba(0,0,0,.08)"
          : "0 2px 8px rgba(0,0,0,.05)" }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-2 glass-card rounded-2xl px-4 py-3.5 relative transition-colors duration-200 ${
          isFocused ? "border-brand-400/50" : "border-transparent"
        }`}
      >
        <motion.div animate={{ scale: isFocused ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 400 }}>
          <Search size={18} className={`shrink-0 transition-colors duration-200 ${isFocused ? "text-brand-500" : "text-ink-soft dark:text-zinc-400"}`} />
        </motion.div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder ?? 'Search "electrician"'}
          className="flex-1 outline-none text-sm text-ink dark:text-zinc-100 placeholder:text-ink-muted dark:placeholder:text-zinc-500 bg-transparent"
        />

        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange("")}
              className="w-6 h-6 rounded-full bg-black/8 dark:bg-white/10 flex items-center justify-center shrink-0"
            >
              <X size={12} className="text-ink-soft dark:text-zinc-400" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Image Search */}
        <label
          className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          title="Search by image"
        >
          <input type="file" accept="image/*" onChange={handleImageSearch} className="hidden" />
          <Image size={15} className="text-brand-500" />
        </label>

        {/* Voice Search */}
        <motion.button
          onClick={startVoiceSearch}
          whileTap={{ scale: 0.9 }}
          type="button"
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isListening
              ? "bg-brand-500 shadow-lg shadow-brand-500/30"
              : "bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20"
          }`}
          title="Search by voice"
        >
          {isListening
            ? <MicOff size={14} className="text-white" />
            : <Mic size={14} className="text-brand-500" />
          }
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-2xl px-4 py-2.5 self-start"
          >
            <Loader2 size={13} className="animate-spin text-brand-500" />
            <span className="font-medium">AI scanning image…</span>
          </motion.div>
        )}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-2xl px-4 py-2.5 self-start"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
            </span>
            Listening… speak now
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
