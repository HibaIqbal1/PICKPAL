import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShieldCheck, RefreshCw, Smartphone } from "lucide-react";

interface OtpVerificationScreenProps {
  target: string;
  type?: "phone" | "email";
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void> | void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
  key?: React.Key;
}

export function OtpVerificationScreen({
  target,
  type = "phone",
  onVerify,
  onResend,
  onBack,
  loading = false,
  error = "",
}: OtpVerificationScreenProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [resendTimer, setResendTimer] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleInputChange = (index: number, val: string) => {
    const numericVal = val.replace(/\D/g, "");
    if (!numericVal) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    // Take last entered character if typed
    nextDigits[index] = numericVal.slice(-1);
    setDigits(nextDigits);

    // Auto-advance to next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    const filledCode = nextDigits.join("");
    if (filledCode.length === 6 && !nextDigits.includes("") && !loading) {
      onVerify(filledCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedText) return;

    const nextDigits = Array(6).fill("");
    for (let i = 0; i < pastedText.length; i++) {
      nextDigits[i] = pastedText[i];
    }
    setDigits(nextDigits);

    if (pastedText.length === 6 && !loading) {
      inputRefs.current[5]?.focus();
      onVerify(pastedText);
    } else {
      inputRefs.current[Math.min(pastedText.length, 5)]?.focus();
    }
  };

  const handleResendClick = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      await onResend();
      setResendTimer(45);
      setCanResend(false);
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.25 }}
      className="w-full flex flex-col items-center"
    >
      {/* Change phone number back button */}
      <button
        type="button"
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-xs font-semibold text-ink-soft dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-100 transition-colors mb-5"
      >
        <ArrowLeft size={16} /> Change {type === "phone" ? "Phone Number" : "Email"}
      </button>

      {/* Hero Icon */}
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25"
        style={{ background: "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)" }}
      >
        <ShieldCheck size={32} className="text-white" />
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-display font-extrabold text-ink dark:text-zinc-50">
          Verify Your Phone
        </h2>
        <p className="text-sm text-ink-soft dark:text-zinc-400 mt-1.5 leading-relaxed">
          We sent a verification code to{" "}
          <span className="font-bold text-ink dark:text-zinc-200">{target}</span>
        </p>
      </div>

      {/* 6 OTP Input Boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full mb-6" onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            disabled={loading}
            className={`w-11 h-14 sm:w-12 sm:h-14 rounded-2xl text-center text-xl font-bold font-mono outline-none transition-all duration-200 ${
              digit
                ? "border-2 border-indigo-500 bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 shadow-sm"
                : "border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-ink dark:text-zinc-100 focus:border-2 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full text-xs px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 mb-5 text-center font-semibold">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        disabled={loading || digits.join("").length < 6}
        onClick={() => onVerify(digits.join(""))}
        className="w-full h-13 rounded-2xl btn-gradient-indigo text-white text-sm font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:pointer-events-none mb-4 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <RefreshCw size={18} className="animate-spin" /> Verifying OTP...
          </>
        ) : (
          "Verify & Login"
        )}
      </button>

      {/* Resend OTP */}
      <div className="flex items-center gap-2 text-xs text-ink-soft dark:text-zinc-400">
        <span>Didn't receive code?</span>
        {canResend ? (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resending}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        ) : (
          <span className="font-semibold text-ink dark:text-zinc-300">
            Resend OTP in <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{resendTimer}s</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
