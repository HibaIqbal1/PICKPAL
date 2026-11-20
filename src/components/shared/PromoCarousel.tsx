import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, X, Percent, Check, Copy } from "lucide-react";

const PROMOS = [
  {
    title: "First task free",
    sub: "Up to ₹99 off your first booking",
    bg: "linear-gradient(135deg, #E8236B 0%, #A80E4E 100%)",
    badge: "New User Offer",
    img: "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80",
    details: "Get up to ₹99 flat discount on any household service or shopping task. Offer valid for first-time users of PickPal.",
    code: "PICKPAL50",
  },
  {
    title: "Verified workers only",
    sub: "Background-checked & community rated",
    bg: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
    badge: "Trust & Safety",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    details: "All service partners on PickPal undergo intensive identity verification, police record clearance, and continuous rating checks to guarantee your safety.",
    code: "FREEDEL",
  },
  {
    title: "Live GPS tracking",
    sub: "Watch your worker arrive in real time",
    bg: "linear-gradient(135deg, #14A866 0%, #0D8050 100%)",
    badge: "Real-time",
    img: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80",
    details: "Stay updated with real-time GPS tracking coordinates on a live map as your assigned partner travels to source your items and deliver them to your door.",
    code: "REPAIR30",
  },
];

export function PromoCarousel() {
  const [active, setActive] = useState(0);
  const [selectedPromo, setSelectedPromo] = useState<typeof PROMOS[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % PROMOS.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleDot = (i: number) => {
    setActive(i);
    if (timerRef.current) clearInterval(timerRef.current);
    startTimer();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden">
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x scrollbar-hide">
          {PROMOS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="min-w-[280px] sm:min-w-[320px] rounded-3xl p-6 text-white shrink-0 snap-start relative overflow-hidden cursor-pointer select-none"
              style={{ background: p.bg, boxShadow: "0 8px 32px rgba(0,0,0,.18)" }}
              onClick={() => setSelectedPromo(p)}
            >
              {/* Background image overlay */}
              <img
                src={p.img}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
              />

              {/* Decorative circles */}
              <div className="absolute -right-8 -bottom-10 w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute -right-2 top-4 w-16 h-16 rounded-full bg-white/8" />

              {/* Badge */}
              <span className="relative inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm mb-3">
                {p.badge}
              </span>

              {/* Content */}
              <p className="relative text-xl font-display font-extrabold leading-tight">{p.title}</p>
              <p className="relative text-sm text-white/85 mt-1.5">{p.sub}</p>

              <div
                className="relative mt-4 inline-flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-xl transition-colors"
              >
                Learn more <ArrowRight size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {PROMOS.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => handleDot(i)}
            animate={{ width: active === i ? 20 : 6, opacity: active === i ? 1 : 0.35 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="h-1.5 rounded-full bg-brand-500"
          />
        ))}
      </div>

      {/* Interactive Learn More Details Modal */}
      <AnimatePresence>
        {selectedPromo && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative flex flex-col gap-4 text-ink dark:text-zinc-155"
            >
              <button
                onClick={() => setSelectedPromo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-400"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <Percent size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider block">Promo Details</span>
                  <h3 className="font-display font-black text-sm text-ink dark:text-zinc-100">{selectedPromo.title}</h3>
                </div>
              </div>

              <p className="text-xs text-ink-soft dark:text-zinc-400 leading-relaxed bg-black/2 dark:bg-white/2 p-3.5 rounded-2xl border border-black/5">
                {selectedPromo.details}
              </p>

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <span className="text-[9px] font-bold text-ink-soft dark:text-zinc-550 uppercase tracking-wider block">Use Coupon</span>
                  <span className="font-mono font-extrabold text-sm text-brand-600 dark:text-brand-400">{selectedPromo.code}</span>
                </div>

                <button
                  onClick={() => copyCode(selectedPromo.code)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check size={12} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy Code
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
