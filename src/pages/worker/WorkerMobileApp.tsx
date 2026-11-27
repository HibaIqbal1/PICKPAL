import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, Clock, MapPin,
  Camera, Video, Phone, MessageSquare, ChevronRight, Navigation, ArrowLeft,
  Zap, LogIn, Lock, Wallet, FileText, Bike, Building, Truck, Send, X, Check, FileCheck, RefreshCw
} from "lucide-react";
import { BookingService, FastApiOrder } from "../../services/booking.service";
import { LocationService } from "../../services/location.service";

export function WorkerMobileApp({
  onSwitchToCustomer,
  onNavigateHome,
  initialScreen = "login"
}: {
  onSwitchToCustomer: () => void;
  onNavigateHome: () => void;
  initialScreen?: "login" | "dashboard" | "task";
}) {
  // Screen state: "login" | "dashboard" | "task"
  const [currentScreen, setCurrentScreen] = useState<"login" | "dashboard" | "task">(initialScreen);
  const [isOnline, setIsOnline] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "local" | "state" | "global">("all");

  // Persistent Worker Login & KYC Credentials State
  const [phone, setPhone] = useState(() => localStorage.getItem("pickpal_worker_phone") || "9876500000");
  const [otp, setOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(true);
  const [aadhaarPan, setAadhaarPan] = useState(() => localStorage.getItem("pickpal_worker_aadhaar") || "ABCDE1234F");
  const [kycVerified, setKycVerified] = useState(() => localStorage.getItem("pickpal_worker_kyc") === "true" || true);
  const [city, setCity] = useState("Mysore");
  const [vehicle, setVehicle] = useState("Bike");
  const [isWorkerLoggedIn, setIsWorkerLoggedIn] = useState(() => localStorage.getItem("pickpal_worker_logged") === "true");

  // Live Orders & Active Task State connected to FastAPI & Neon Escrow
  const [liveOrders, setLiveOrders] = useState<FastApiOrder[]>([]);
  const [activeTask, setActiveTask] = useState<FastApiOrder | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);
  const [deliveryOtpInput, setDeliveryOtpInput] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const fetchOpenJobs = () => {
    setIsLoadingOrders(true);
    BookingService.getOrders("searching_worker", "worker")
      .then((orders) => setLiveOrders(orders))
      .catch((err) => console.warn("Failed fetching open orders:", err))
      .finally(() => setIsLoadingOrders(false));
  };

  useEffect(() => {
    if (currentScreen === "dashboard") {
      fetchOpenJobs();
    }
  }, [currentScreen]);

  // Live GPS WebSocket Broadcaster for Worker
  useEffect(() => {
    if (!activeTask?.id || currentScreen !== "task") return;
    const { sendCoords, close } = LocationService.connectWorkerLocation(activeTask.id, "WORKER_001");
    let step = 0;
    const baseLat = 12.3051;
    const baseLng = 76.6551;
    sendCoords(baseLat, baseLng);

    const interval = setInterval(() => {
      step += 1;
      const lat = baseLat + step * 0.0004;
      const lng = baseLng + step * 0.0004;
      sendCoords(lat, lng);
    }, 4000);

    return () => {
      clearInterval(interval);
      close();
    };
  }, [activeTask?.id, currentScreen]);

  const handleClaimJob = async (order: FastApiOrder) => {
    try {
      const claimed = await BookingService.claimOrder(order.id, "WORKER_001");
      setActiveTask(claimed);
      setActualBillAmount(claimed.budget_cap.toString());
      setCurrentScreen("task");
      alert(`Job #${order.id} claimed successfully! Proceeding to fulfillment.`);
    } catch (err: any) {
      alert("Failed to claim job: " + err.message);
    }
  };

  const handleUploadReceipt = async () => {
    if (!activeTask) return;
    const cost = Number(actualBillAmount);
    if (!cost || cost <= 0) {
      alert("Please enter a valid actual bill amount");
      return;
    }
    setIsUploadingReceipt(true);
    try {
      const fileToUpload = receiptFile || new File(["dummy_receipt_proof"], "receipt.jpg", { type: "image/jpeg" });
      const updated = await BookingService.recordStorePurchase(activeTask.id, cost, fileToUpload);
      setActiveTask(updated);
      alert(`Store purchase of Rs. ${cost} recorded! Order status advanced to IN_TRANSIT.`);
    } catch (err: any) {
      alert("Failed to upload bill: " + err.message);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!activeTask) return;
    if (!deliveryOtpInput.trim()) {
      alert("Please enter the 4-digit OTP provided by the customer.");
      return;
    }
    setIsCompletingDelivery(true);
    try {
      const escrow = await BookingService.completeDelivery(activeTask.id, deliveryOtpInput.trim());
      alert(`🎉 Delivery Verified! ₹${escrow.amount_released} released from Escrow to your wallet! Customer refund: ₹${escrow.amount_refunded}`);
      setActiveTask(null);
      setDeliveryOtpInput("");
      setCurrentScreen("dashboard");
      fetchOpenJobs();
    } catch (err: any) {
      alert("Delivery verification failed: " + err.message);
    } finally {
      setIsCompletingDelivery(false);
    }
  };

  // Task Fulfillment States
  const [actualBillAmount, setActualBillAmount] = useState("15200");
  const [returnChoice, setReturnChoice] = useState<"in_shop" | "left_shop" | null>(null);

  // Chat Modal State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "customer", text: "Hi Rajesh! Please check item zari pattern carefully before billing.", time: "10:33 AM" },
    { sender: "worker", text: "Yes! At shop now. Bill amount is Rs. 15,200. Uploading video proof.", time: "10:34 AM" }
  ]);
  const [inputMsg, setInputMsg] = useState("");

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleVerifyKyc = () => {
    setKycVerified(true);
    localStorage.setItem("pickpal_worker_kyc", "true");
    localStorage.setItem("pickpal_worker_aadhaar", aadhaarPan);
  };

  const handleWorkerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycVerified) {
      alert("KYC Verification is required! Please click 'Verify KYC' to complete verification before logging in.");
      return;
    }
    localStorage.setItem("pickpal_worker_phone", phone);
    localStorage.setItem("pickpal_worker_aadhaar", aadhaarPan);
    localStorage.setItem("pickpal_worker_kyc", "true");
    localStorage.setItem("pickpal_worker_logged", "true");
    setIsWorkerLoggedIn(true);
    setCurrentScreen("dashboard");
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;
    setChatMessages(prev => [...prev, { sender: "worker", text: inputMsg, time: "Just now" }]);
    setInputMsg("");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#E9D5FF] via-[#F3E8FF] to-[#FCE7F3] flex flex-col font-sans text-slate-900">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-screen relative shadow-2xl bg-gradient-to-br from-[#E9D5FF] via-[#F3E8FF] to-[#FCE7F3]">

        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-200/80 px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs hover:bg-purple-200"
              title="Back to Landing"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">⚡</span>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-none">
                  Pick<span className="text-purple-600">Pal</span> Worker
                </h1>
                <span className="text-[9.5px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Earn By Shopping</span>
                  {kycVerified && <span className="text-[8px] bg-emerald-600 text-white px-1 rounded font-black">KYC ✓</span>}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onSwitchToCustomer}
            className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[10.5px] shadow-sm hover:bg-slate-800 transition-all flex items-center gap-1"
          >
            <span>Customer Mode</span>
            <ArrowRight size={12} />
          </button>
        </header>

        {/* Navigation Tabs when Logged In */}
        {currentScreen !== "login" && (
          <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200/60 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentScreen("dashboard")}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentScreen === "dashboard" ? "bg-purple-600 text-white font-black" : "hover:bg-purple-100"
                }`}
              >
                1. Requests Live
              </button>
              <button
                onClick={() => setCurrentScreen("task")}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentScreen === "task" ? "bg-purple-600 text-white font-black" : "hover:bg-purple-100"
                }`}
              >
                2. Active Task #PP12345
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-4">

          {/* ── SCREEN 1: WORKER LOGIN (/worker/login) ────────────────────────── */}
          {currentScreen === "login" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-[20px] bg-white shadow-md border border-purple-200 text-purple-600 font-black text-2xl flex items-center justify-center mx-auto">
                  ⚡
                </div>
                <h2 className="text-xl font-black text-slate-900">I am Worker - Login to Earn</h2>
                <span className={`inline-flex items-center gap-1 text-[10.5px] font-black px-3 py-1 rounded-full ${
                  kycVerified ? "text-emerald-800 bg-emerald-100 border border-emerald-300" : "text-amber-800 bg-amber-100 border border-amber-300"
                }`}>
                  <ShieldCheck size={13} /> {kycVerified ? "KYC Verified & Active ✓" : "KYC Verification Mandatory"}
                </span>
              </div>

              {/* Earnings Card */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white p-4 rounded-[20px] shadow-md flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] font-bold text-purple-200 uppercase">Today's Earnings</div>
                  <div className="font-black text-xl text-white">Rs. 890</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <div className="text-[10px] font-bold text-purple-200 uppercase">Wallet Balance</div>
                  <div className="font-black text-xl text-orange-200">Rs. 1,200</div>
                </div>
              </div>

              {/* Worker Registration Form with Persistent Credentials & Mandatory KYC */}
              <form onSubmit={handleWorkerLogin} className="bg-white rounded-[20px] p-5 shadow-md shadow-purple-900/5 border border-purple-100 space-y-3.5 text-xs">
                
                {isWorkerLoggedIn && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                    <span>Saved Worker Credential ({phone})</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">KYC VERIFIED ✓</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Phone Number (Saved Credential)</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number..."
                      className="flex-1 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 font-bold text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3 py-2.5 bg-purple-100 text-purple-900 font-extrabold rounded-xl text-[11px] hover:bg-purple-200"
                    >
                      {otpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </div>

                {/* MANDATORY KYC VERIFICATION FIELD */}
                <div className="space-y-1 p-3 bg-purple-50/80 rounded-xl border border-purple-200">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-purple-950 flex items-center gap-1">
                      <FileCheck size={14} className="text-purple-600" />
                      Aadhaar / PAN Number (KYC)
                    </label>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      kycVerified ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900"
                    }`}>
                      {kycVerified ? "VERIFIED ✓" : "REQUIRED"}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={aadhaarPan}
                      onChange={(e) => setAadhaarPan(e.target.value)}
                      placeholder="Aadhaar or PAN number..."
                      className="flex-1 p-2.5 rounded-xl border border-purple-300 bg-white font-mono font-bold text-slate-900 uppercase text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVerifyKyc}
                      className={`px-3 py-2.5 rounded-xl font-black text-[11px] transition-all flex items-center gap-1 ${
                        kycVerified ? "bg-emerald-600 text-white shadow-xs" : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                    >
                      <Check size={14} />
                      {kycVerified ? "Verified ✓" : "Verify KYC"}
                    </button>
                  </div>
                  <p className="text-[9.5px] text-purple-800 font-extrabold pt-0.5">
                    🛡️ Instant payout to wallet requires government ID verification.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700">City Mysore</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-purple-200 bg-purple-50 font-bold text-slate-900"
                    >
                      <option value="Mysore">Mysore</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Varanasi">Varanasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Vehicle Bike</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-purple-200 bg-purple-50 font-bold text-slate-900"
                    >
                      <option value="Bike">Motorcycle / Scooter</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Walk">On Foot (Walk)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleVerifyKyc();
                    setCurrentScreen("dashboard");
                  }}
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  <span>Continue with Google</span>
                </button>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white font-black text-sm shadow-md shadow-purple-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>Login to Earn &rarr;</span>
                </button>
              </form>

              <div className="bg-white/70 p-3 rounded-[20px] border border-purple-200 text-center text-xs space-y-1">
                <p className="font-extrabold text-purple-900">⚡ Quick Demo Worker View</p>
                <button
                  onClick={() => {
                    handleVerifyKyc();
                    setCurrentScreen("dashboard");
                  }}
                  className="text-xs font-black text-orange-600 underline"
                >
                  Open Active Worker Dashboard &rarr;
                </button>
              </div>

            </motion.div>
          )}

          {/* ── SCREEN 2: WORKER DASHBOARD (/worker/dashboard) ────────────────── */}
          {currentScreen === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              
              <div className="bg-white rounded-[20px] p-3.5 shadow-md border border-purple-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                    <span className="font-black text-slate-900 uppercase">
                      {isOnline ? "ONLINE — Active in Mysore" : "OFFLINE"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition-all ${
                      isOnline ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isOnline ? "ONLINE ✓" : "GO ONLINE"}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-[11px] font-extrabold text-emerald-900">
                  <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> KYC Status:</span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px]">VERIFIED ✓ ({aadhaarPan})</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div className="bg-purple-50 p-2 rounded-xl border border-purple-100">
                    <div className="text-[9.5px] font-bold text-purple-700 uppercase">Today's Earnings</div>
                    <div className="font-black text-slate-900 text-sm">Rs. 890</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-xl border border-purple-100">
                    <div className="text-[9.5px] font-bold text-purple-700 uppercase">Wallet Balance</div>
                    <div className="font-black text-orange-600 text-sm">Rs. 1,200</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-extrabold scrollbar-none">
                {[
                  { id: "all", label: "All (8)" },
                  { id: "local", label: "Local (3)" },
                  { id: "state", label: "Across States (4)" },
                  { id: "global", label: "International (1)" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setActiveFilter(chip.id as any)}
                    className={`px-3.5 py-1.5 rounded-full shrink-0 border transition-all ${
                      activeFilter === chip.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white text-slate-700 border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-purple-900 tracking-wider">
                  Incoming Requests - You are Active - Live
                </h3>
                <button
                  onClick={fetchOpenJobs}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-[10px] font-black flex items-center gap-1 shadow-xs"
                >
                  <RefreshCw size={11} className={isLoadingOrders ? "animate-spin" : ""} /> Refresh
                </button>
              </div>

              {/* Render real orders from Neon PostgreSQL */}
              {liveOrders.length > 0 ? (
                liveOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-[20px] p-4 shadow-md border-2 border-purple-500 space-y-2 text-xs relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase bg-purple-600 text-white px-2.5 py-0.5 rounded-full">
                        {order.shipping_tier} • Neon Cloud
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Escrow: ₹{order.total_amount}
                      </span>
                    </div>

                    <div>
                      <div className="font-black text-slate-900 text-sm">#{order.id} — {order.items_description}</div>
                      <div className="text-[10.5px] text-slate-600 font-bold">Shop: {order.store_name} ({order.category})</div>
                    </div>

                    <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-[11px] flex justify-between">
                      <span className="text-slate-600 font-semibold">Budget Cap: ₹{order.budget_cap}</span>
                      <span className="font-black text-purple-800">Your Earning: ₹{order.delivery_fee}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => alert(`Skipped order #${order.id}`)}
                        className="py-2.5 rounded-xl bg-slate-100 text-slate-600 font-extrabold text-xs"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleClaimJob(order)}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 hover:opacity-95"
                      >
                        <Zap size={14} /> Accept & Start
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/80 rounded-[20px] p-3 text-center text-xs text-purple-900 border border-purple-200">
                  <p className="font-black">No open orders currently searching for shoppers.</p>
                  <p className="text-[10.5px] text-slate-500">Orders placed by customers will appear here live!</p>
                </div>
              )}

              {(activeFilter === "all" || activeFilter === "local") && (
                <div className="bg-white rounded-[20px] p-3.5 shadow-sm border-l-4 border-l-emerald-500 border-y border-r border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Local Buy
                    </span>
                    <span className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                      <Clock size={11} className="text-amber-600" /> Timer 01:45
                    </span>
                  </div>

                  <div>
                    <div className="font-black text-slate-900 text-sm">Buy Mysore Pak 1kg</div>
                    <div className="text-[10.5px] text-slate-600 font-bold">Shop: Guru Sweets (0.8km) → Customer (2.1km)</div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-slate-600 font-bold">Delivery: 60 min</span>
                    <span className="font-black text-emerald-700 text-sm">Earn Rs. 80</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button className="py-2 rounded-xl bg-slate-100 text-slate-600 font-extrabold">Decline</button>
                    <button onClick={() => setCurrentScreen("task")} className="py-2 rounded-xl bg-emerald-600 text-white font-black shadow-sm">
                      Accept
                    </button>
                  </div>
                </div>
              )}

              {(activeFilter === "all" || activeFilter === "state") && (
                <div className="bg-white rounded-[20px] p-4 shadow-md shadow-purple-900/10 border-2 border-purple-500 space-y-3 relative ring-2 ring-purple-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase bg-purple-600 text-white px-2.5 py-0.5 rounded-full">
                      Shop & Ship Across States
                    </span>
                    <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={10} /> Non-Returnable
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-900">Shop & Ship Saree Mysore to Delhi</h4>
                    <p className="text-[11px] font-bold text-purple-900 mt-0.5">
                      Shop: K.R. Market Mysore (1.2km) → Courier to Delhi
                    </p>
                  </div>

                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Customer Paid Escrow:</span>
                      <span className="font-extrabold text-slate-900">Rs. 15,800</span>
                    </div>
                    <div className="flex justify-between font-black text-purple-900 text-xs pt-1 border-t border-purple-200">
                      <span>Your Earning:</span>
                      <span className="text-purple-700 text-sm">Rs. 300 + Rs. 50 Bonus</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 flex items-center justify-between">
                    <span>📌 "Buy item first, then ship at DTDC hub"</span>
                    <span className="text-[9.5px] font-black text-amber-800">Timer 02:30</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button className="py-2.5 rounded-xl bg-slate-100 text-slate-600 font-extrabold">Decline</button>
                    <button onClick={() => setShowChat(true)} className="py-2.5 rounded-xl bg-purple-100 text-purple-900 font-extrabold flex items-center justify-center gap-1">
                      <MessageSquare size={12} /> Chat Customer
                    </button>
                    <button
                      onClick={() => setCurrentScreen("task")}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white font-black shadow-md"
                    >
                      Accept (Rs.350)
                    </button>
                  </div>
                </div>
              )}

              {(activeFilter === "all" || activeFilter === "global") && (
                <div className="bg-white rounded-[20px] p-3.5 shadow-sm border-2 border-blue-400 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      International
                    </span>
                    <span className="text-[10px] font-black text-slate-500">Shop 2.0km</span>
                  </div>

                  <div>
                    <div className="font-black text-slate-900">Sandal Soap to USA (10 Pack)</div>
                    <div className="text-[10.5px] text-slate-500 font-bold">Needs DHL Air Hub Drop</div>
                  </div>

                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded-xl border border-blue-100">
                    <span className="text-slate-600 font-bold">DHL Hub Drop</span>
                    <span className="font-black text-blue-700 text-sm">Earn Rs. 500 + Rs. 200</span>
                  </div>

                  <button onClick={() => setCurrentScreen("task")} className="w-full py-2 rounded-xl bg-blue-600 text-white font-black shadow-sm">
                    Accept International Request
                  </button>
                </div>
              )}

            </motion.div>
          )}

          {/* ── SCREEN 3: WORKER TASK (/worker/task) ─────────────────────────── */}
          {currentScreen === "task" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentScreen("dashboard")} className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center border border-purple-200">
                  <ArrowLeft size={16} />
                </button>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Task Active</span>
                  <h2 className="text-xs font-black text-slate-900">
                    Order #{activeTask ? activeTask.id : "PP12345"}
                  </h2>
                </div>
                <button onClick={() => setShowChat(true)} className="p-2 bg-purple-100 text-purple-900 rounded-xl text-xs font-extrabold flex items-center gap-1">
                  <MessageSquare size={14} /> Chat
                </button>
              </div>

              <div className="bg-white rounded-[20px] p-4 shadow-md border border-purple-100 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-black text-purple-950 uppercase text-[11px]">Task Execution Steps</h4>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Status: {activeTask ? activeTask.status.toUpperCase() : "ASSIGNED"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="font-extrabold text-slate-900">Step 1: Navigate to Shop</span>
                    <button
                      onClick={() => alert(`Opening Google Maps navigation to ${activeTask?.store_name || "Store"}...`)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center gap-1 hover:bg-purple-700"
                    >
                      <Navigation size={12} /> Navigate Maps
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-black text-slate-900">Step 2: Buy & Upload Store Bill</div>
                      {activeTask?.store_receipt_url && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          Receipt Uploaded ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="p-2 bg-white border border-purple-300 rounded-lg text-[10px] font-bold text-purple-700 flex items-center gap-1 cursor-pointer shrink-0 hover:bg-purple-50">
                        <Camera size={14} /> Bill Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setReceiptFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="number"
                        value={actualBillAmount}
                        onChange={(e) => setActualBillAmount(e.target.value)}
                        placeholder="Actual Bill Amount (Rs.)"
                        className="flex-1 p-2 rounded-lg border border-purple-300 font-black text-slate-900 bg-white text-xs"
                      />
                      <button
                        onClick={handleUploadReceipt}
                        disabled={isUploadingReceipt}
                        className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shrink-0 disabled:opacity-60 shadow-xs"
                      >
                        {isUploadingReceipt ? "Uploading..." : "Save Bill"}
                      </button>
                    </div>
                    {receiptFile && (
                      <div className="text-[10px] text-emerald-700 font-bold">
                        Attached: {receiptFile.name}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">Step 3: Live GPS Broadcasting</span>
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      GPS Broadcaster Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Completion & OTP Escrow Release Card */}
              <div className="bg-white rounded-[20px] p-4 shadow-md border-2 border-emerald-500 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-emerald-950 uppercase text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" /> Step 4: OTP Delivery & Escrow Release
                  </h4>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Instant Settlement
                  </span>
                </div>
                <p className="text-[10.5px] font-bold text-slate-600">
                  Ask customer for their 4-digit Delivery Verification OTP to confirm receipt and trigger instant wallet payout:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={deliveryOtpInput}
                    onChange={(e) => setDeliveryOtpInput(e.target.value)}
                    placeholder="Enter Customer OTP (e.g. 1234)"
                    className="flex-1 p-2.5 rounded-xl border-2 border-emerald-300 font-mono text-center tracking-widest text-lg font-black text-emerald-950 bg-emerald-50/50"
                  />
                  <button
                    onClick={handleCompleteDelivery}
                    disabled={isCompletingDelivery}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-black text-xs shadow-md shrink-0 disabled:opacity-60 flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>{isCompletingDelivery ? "Releasing..." : "Verify & Release"}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-4 shadow-md border-2 border-amber-300 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-amber-900 text-[11px] uppercase">If Customer Cancels After Buying</h4>
                  <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={10} /> Timer 10:00 mins
                  </span>
                </div>
                <p className="text-[10.5px] font-bold text-slate-600">
                  Return Window: Are you still inside the physical shop?
                </p>

                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => setReturnChoice("in_shop")}
                    className={`w-full p-2.5 rounded-xl font-extrabold text-[11px] text-left border flex items-center justify-between ${
                      returnChoice === "in_shop"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-emerald-50 text-emerald-950 border-emerald-300"
                    }`}
                  >
                    <span>STILL IN SHOP Return Now</span>
                    {returnChoice === "in_shop" && <span>✓ (0 penalty)</span>}
                  </button>

                  <button
                    onClick={() => setReturnChoice("left_shop")}
                    className={`w-full p-2.5 rounded-xl font-extrabold text-[11px] text-left border flex items-center justify-between ${
                      returnChoice === "left_shop"
                        ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                        : "bg-orange-50 text-orange-950 border-orange-300"
                    }`}
                  >
                    <span>LEFT SHOP Need Rs.100 trip</span>
                    {returnChoice === "left_shop" && <span>✓ (+Rs.100 compensated)</span>}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-[20px] bg-red-50 border-2 border-red-300 text-[11px] text-red-900 space-y-1">
                <div className="font-black text-red-700 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-red-600 shrink-0" /> NON-RETURNABLE SHOP SAFETY
                </div>
                <p className="leading-snug text-[10.5px]">
                  Non-returnable shop — <strong>you are safe</strong>! You get <strong>100% service fee</strong> guaranteed in Escrow.
                </p>
              </div>

              <button
                onClick={() => {
                  alert("Order #PP12345 marked shipped! Rs.400 credited to your PickPal Wallet.");
                  setCurrentScreen("dashboard");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Truck size={16} />
                <span>Mark Shipped & Claim Payout Rs.400</span>
              </button>
            </motion.div>
          )}

        </div>

        {/* Live Chat Modal */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute inset-0 bg-white z-50 flex flex-col"
            >
              <div className="p-3 bg-purple-600 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-purple-900 font-black flex items-center justify-center text-xs">
                    C
                  </div>
                  <div>
                    <div className="font-extrabold text-xs">Customer (Delhi)</div>
                    <div className="text-[9px] text-purple-200 font-medium">Order #PP12345</div>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-1 rounded-full hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 text-xs">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === "worker" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-2xl font-medium ${
                      msg.sender === "worker" ? "bg-purple-600 text-white rounded-br-none" : "bg-white text-slate-800 border rounded-bl-none shadow-xs"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold px-1 mt-0.5">{msg.time}</span>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-white border-t flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type message to customer..."
                  className="flex-1 p-2 border rounded-xl text-xs font-bold"
                />
                <button onClick={handleSendMessage} className="p-2.5 bg-purple-600 text-white rounded-xl">
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
