import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Wallet, QrCode, CreditCard, Landmark, CheckCircle2, Loader2, Smartphone,
  ArrowRight, ShieldCheck, Sparkles, AlertCircle, Copy, Check
} from "lucide-react";
import { PaymentGatewayService, PaymentMethodType } from "../../services/payment-gateway.service";

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const METHODS: { type: PaymentMethodType; label: string; icon: any; sub: string }[] = [
  { type: "UPI", label: "UPI (GPay / PhonePe / Paytm)", icon: Smartphone, sub: "Instant 0% fee" },
  { type: "QR Code", label: "Scan QR Code", icon: QrCode, sub: "Scan with any UPI app" },
  { type: "Card", label: "Credit / Debit Card", icon: CreditCard, sub: "Visa, Mastercard, RuPay" },
  { type: "Net Banking", label: "Net Banking", icon: Landmark, sub: "All major Indian banks" },
];

const BANKS = [
  { code: "HDFC", name: "HDFC Bank", logo: "🏦" },
  { code: "ICICI", name: "ICICI Bank", logo: "🏢" },
  { code: "SBI", name: "State Bank of India", logo: "🏛️" },
  { code: "AXIS", name: "Axis Bank", logo: "🏬" },
  { code: "KOTAK", name: "Kotak Mahindra", logo: "🏪" },
];

const UPI_APPS = [
  { name: "Google Pay", id: "gpay@okaxis" },
  { name: "PhonePe", id: "phonepe@ybl" },
  { name: "Paytm", id: "paytm@paytm" },
  { name: "BHIM", id: "bhim@upi" },
];

export function AddMoneyModal({ isOpen, onClose, userId, onSuccess }: AddMoneyModalProps) {
  const [step, setStep] = useState<"SELECT" | "PAY" | "PROCESSING" | "SUCCESS">("SELECT");
  const [amount, setAmount] = useState<string>("500");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("UPI");

  // Sub-flow states
  const [upiId, setUpiId] = useState("user@upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  
  // Card state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Net banking state
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // Result state
  const [result, setResult] = useState<{ refNo: string; newBalance: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;

  useEffect(() => {
    if (!isOpen) {
      setStep("SELECT");
      setErrorMessage(null);
      setResult(null);
    }
  }, [isOpen]);

  const handleFillSampleCard = () => {
    setCardNumber("4532 •••• •••• 8892");
    setCardExpiry("12/28");
    setCardCvv("888");
    setCardName("KEMPEGOWDA C");
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than ₹0.");
      return;
    }
    setErrorMessage(null);
    setStep("PAY");
  };

  const handleProcessPayment = async () => {
    setStep("PROCESSING");
    setErrorMessage(null);

    try {
      const res = await PaymentGatewayService.processPayment({
        userId,
        amount: numAmount,
        method: selectedMethod,
        upiId: selectedMethod === "UPI" ? upiId : undefined,
        upiApp: selectedMethod === "UPI" ? selectedUpiApp : undefined,
        cardNumber: selectedMethod === "Card" ? cardNumber : undefined,
        cardExpiry: selectedMethod === "Card" ? cardExpiry : undefined,
        cardCvv: selectedMethod === "Card" ? cardCvv : undefined,
        cardName: selectedMethod === "Card" ? cardName : undefined,
        bankCode: selectedMethod === "Net Banking" ? selectedBank : undefined,
        bankName: selectedMethod === "Net Banking" ? BANKS.find(b => b.code === selectedBank)?.name : undefined,
      });

      if (res.success) {
        setResult({ refNo: res.referenceId, newBalance: res.newBalance });
        setStep("SUCCESS");
        onSuccess?.();
      } else {
        setErrorMessage(res.message || "Payment failed. Please try again.");
        setStep("PAY");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during payment.");
      setStep("PAY");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative flex flex-col gap-5 text-ink dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center text-brand-500 font-bold">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base text-ink dark:text-zinc-100">Add Money to Wallet</h3>
                <p className="text-xs text-ink-soft dark:text-zinc-400">Instantly top up your PickPal balance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-ink-soft dark:text-zinc-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Amount & Payment Method */}
          {step === "SELECT" && (
            <form onSubmit={handleNextToPayment} className="space-y-5">
              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider block">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-display font-bold text-brand-600 dark:text-brand-400">₹</span>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-2xl font-display font-black pl-10 pr-4 py-3 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500 text-ink dark:text-zinc-100"
                    placeholder="0"
                    required
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex gap-2 pt-1">
                  {[100, 500, 1000, 2000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAmount(chip.toString())}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        numAmount === chip
                          ? "bg-brand-500 text-white shadow-sm scale-105"
                          : "bg-black/5 dark:bg-white/5 text-ink-soft dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                    >
                      +₹{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-soft dark:text-zinc-400 uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <div className="space-y-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setSelectedMethod(m.type)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        selectedMethod === m.type
                          ? "bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 font-bold shadow-sm"
                          : "border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/2 hover:bg-black/5 dark:hover:bg-white/5 text-ink dark:text-zinc-300 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          selectedMethod === m.type ? "bg-brand-500 text-white" : "bg-black/5 dark:bg-white/10 text-ink-soft"
                        }`}>
                          <m.icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{m.label}</p>
                          <p className="text-[10px] text-ink-soft dark:text-zinc-500">{m.sub}</p>
                        </div>
                      </div>
                      {selectedMethod === m.type && (
                        <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-white shrink-0">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={numAmount <= 0}
                className="w-full btn-gradient-brand text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                Proceed to Pay ₹{numAmount.toFixed(2)} <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* STEP 2: Dedicated Payment Sub-Flow Forms */}
          {step === "PAY" && (
            <div className="space-y-5">
              <div className="bg-black/3 dark:bg-white/5 rounded-2xl p-3.5 flex items-center justify-between text-xs border border-black/5 dark:border-white/5">
                <div>
                  <span className="text-ink-soft dark:text-zinc-400 block text-[10px]">Payment Amount</span>
                  <span className="font-display font-black text-base text-ink dark:text-zinc-100">₹{numAmount.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("SELECT")}
                  className="text-brand-600 dark:text-brand-400 font-bold text-xs hover:underline"
                >
                  Change Method
                </button>
              </div>

              {/* 1. UPI Sub-Flow */}
              {selectedMethod === "UPI" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-soft dark:text-zinc-400 block">
                      Enter VPA / UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. name@upi or phone@okaxis"
                      className="w-full text-sm font-semibold px-4 py-3 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500 text-ink dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-soft dark:text-zinc-400 block">
                      Or Select Installed App
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.name}
                          type="button"
                          onClick={() => {
                            setSelectedUpiApp(app.name);
                            setUpiId(app.id);
                          }}
                          className={`p-3 rounded-2xl border text-xs font-bold text-left flex items-center justify-between ${
                            selectedUpiApp === app.name
                              ? "bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-300"
                              : "border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/2"
                          }`}
                        >
                          <span>{app.name}</span>
                          {selectedUpiApp === app.name && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. QR Code Sub-Flow */}
              {selectedMethod === "QR Code" && (
                <div className="text-center space-y-4 py-2">
                  <p className="text-xs font-bold text-ink-soft dark:text-zinc-400">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM
                  </p>

                  <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-brand-500 shadow-lg flex flex-col items-center justify-center relative">
                    {/* Simulated SVG QR Code */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      {/* Position Markers */}
                      <rect x="10" y="10" width="25" height="25" fill="black" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="black" />

                      <rect x="65" y="10" width="25" height="25" fill="black" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="black" />

                      <rect x="10" y="65" width="25" height="25" fill="black" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="black" />

                      {/* Random QR pixels */}
                      <rect x="40" y="10" width="8" height="8" fill="black" />
                      <rect x="50" y="20" width="8" height="8" fill="black" />
                      <rect x="40" y="40" width="20" height="20" fill="black" />
                      <rect x="65" y="65" width="15" height="15" fill="black" />
                      <rect x="45" y="75" width="10" height="10" fill="black" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-brand-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow">
                        PICKPAL
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-ink-soft dark:text-zinc-500 font-mono">
                    upi://pay?pa=pickpal@icici&am={numAmount}&pn=PickPal
                  </p>
                </div>
              )}

              {/* 3. Card Sub-Flow */}
              {selectedMethod === "Card" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-ink-soft dark:text-zinc-400 block">
                      Card Details
                    </label>
                    <button
                      type="button"
                      onClick={handleFillSampleCard}
                      className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Auto-fill Sample Card
                    </button>
                  </div>

                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number (4532 •••• •••• 8892)"
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500 text-ink dark:text-zinc-100"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full text-sm font-semibold px-4 py-2.5 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500 text-ink dark:text-zinc-100"
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      maxLength={4}
                      className="w-full text-sm font-semibold px-4 py-2.5 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500 text-ink dark:text-zinc-100"
                    />
                  </div>

                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Cardholder Name"
                    className="w-full text-sm font-semibold px-4 py-2.5 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-brand-500 text-ink dark:text-zinc-100"
                  />
                </div>
              )}

              {/* 4. Net Banking Sub-Flow */}
              {selectedMethod === "Net Banking" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-ink-soft dark:text-zinc-400 block">
                    Select Your Bank
                  </label>
                  <div className="space-y-2">
                    {BANKS.map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.code)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs font-bold ${
                          selectedBank === b.code
                            ? "bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300"
                            : "border-black/10 dark:border-white/10 bg-black/2 dark:bg-white/2"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{b.logo}</span>
                          <span>{b.name}</span>
                        </div>
                        {selectedBank === b.code && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Payment Button */}
              <button
                type="button"
                onClick={handleProcessPayment}
                className="w-full btn-gradient-brand text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                Simulate {selectedMethod} Payment ₹{numAmount.toFixed(2)}
              </button>
            </div>
          )}

          {/* STEP 3: Processing State */}
          {step === "PROCESSING" && (
            <div className="py-12 text-center space-y-4">
              <Loader2 size={40} className="animate-spin text-brand-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-display font-extrabold text-ink dark:text-zinc-100">
                  Authorizing Payment...
                </h4>
                <p className="text-xs text-ink-soft dark:text-zinc-400">
                  Communicating with payment gateway test simulator.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Success State */}
          {step === "SUCCESS" && result && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={38} />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-display font-black text-ink dark:text-zinc-100">
                  ₹{numAmount.toFixed(2)} Added!
                </h4>
                <p className="text-xs text-ink-soft dark:text-zinc-400">
                  Updated Wallet Balance: <strong className="text-brand-600 dark:text-brand-400">₹{result.newBalance.toFixed(2)}</strong>
                </p>
              </div>

              <div className="p-3 bg-black/3 dark:bg-white/5 rounded-2xl text-[10px] font-mono text-ink-soft dark:text-zinc-400">
                Reference ID: {result.refNo}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full btn-gradient-brand text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
