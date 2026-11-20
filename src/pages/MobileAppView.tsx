import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CustomerMobileApp } from "./customer/CustomerMobileApp";
import { WorkerMobileApp } from "./worker/WorkerMobileApp";
import { ShoppingBag, Zap, ArrowRight, ShieldCheck, Sparkles, MapPin, Truck, Heart, ChevronRight } from "lucide-react";

export default function MobileAppView() {
  const location = useLocation();
  const navigate = useNavigate();

  // App Mode: "landing" | "customer" | "worker"
  const [appMode, setAppMode] = useState<"landing" | "customer" | "worker">("landing");
  const [customerScreen, setCustomerScreen] = useState<"login" | "home" | "tracking">("login");
  const [workerScreen, setWorkerScreen] = useState<"login" | "dashboard" | "task">("login");

  // Synchronize route paths with mobile screens
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/customer/login")) {
      setAppMode("customer");
      setCustomerScreen("login");
    } else if (path.includes("/customer/home") || path.includes("/customer")) {
      setAppMode("customer");
      setCustomerScreen("home");
    } else if (path.includes("/customer/tracking")) {
      setAppMode("customer");
      setCustomerScreen("tracking");
    } else if (path.includes("/worker/login")) {
      setAppMode("worker");
      setWorkerScreen("login");
    } else if (path.includes("/worker/dashboard") || path.includes("/worker")) {
      setAppMode("worker");
      setWorkerScreen("dashboard");
    } else if (path.includes("/worker/task")) {
      setAppMode("worker");
      setWorkerScreen("task");
    }
  }, [location.pathname]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#E9D5FF] via-[#F3E8FF] to-[#FCE7F3] font-sans text-slate-900 flex flex-col">
      
      {/* ── MASTER LANDING SCREEN (appMode === "landing") ──────────────────── */}
      {appMode === "landing" && (
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between px-5 py-6 space-y-6 shadow-2xl bg-gradient-to-br from-[#E9D5FF] via-[#F3E8FF] to-[#FCE7F3]">

          {/* Top Logo & Tagline */}
          <div className="text-center space-y-2 pt-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-900 text-xs font-black tracking-wider uppercase">
              <span>🛍️</span> PickPal Mobile
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Pick<span className="text-purple-600">Pal</span>
            </h1>
            <p className="text-xs font-extrabold text-purple-900 max-w-xs mx-auto leading-snug">
              "Any City Any Shop — We Will Buy For You"
            </p>
          </div>

          {/* Delivery Boy / Personal Shopper Illustration Graphic */}
          <div className="bg-white rounded-[20px] p-4 shadow-md shadow-purple-900/5 border border-purple-100 text-center space-y-3">
            <div className="w-full h-44 rounded-[16px] overflow-hidden relative bg-slate-900 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
                alt="Personal Shopper Delivery"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-950/25 to-transparent flex flex-col justify-end p-4 text-left">
                <span className="text-[10px] font-black uppercase text-pink-300 tracking-wider">Verified Personal Shopper Network</span>
                <p className="text-xs font-extrabold text-white leading-tight mt-0.5">
                  Request any item from any shop in India or Abroad — local shoppers buy & ship it safely!
                </p>
              </div>
            </div>
          </div>

          {/* Two Big Stacked Action Buttons */}
          <div className="space-y-3 pt-1">
            {/* Button 1: Customer (Purple to Orange Gradient) */}
            <button
              onClick={() => {
                setAppMode("customer");
                setCustomerScreen("login");
              }}
              className="w-full py-4 px-5 rounded-[20px] bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white font-black text-base shadow-xl shadow-purple-600/30 flex items-center justify-between hover:opacity-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛍️</span>
                <div className="text-left">
                  <div className="text-sm font-black leading-none">I am Customer</div>
                  <div className="text-[11px] font-bold text-purple-100 mt-1">I want to Buy &rarr;</div>
                </div>
              </div>
              <ArrowRight size={20} />
            </button>

            {/* Button 2: Worker (White with Purple Border) */}
            <button
              onClick={() => {
                setAppMode("worker");
                setWorkerScreen("login");
              }}
              className="w-full py-4 px-5 rounded-[20px] bg-white border-2 border-purple-400 text-purple-950 font-black text-base shadow-sm flex items-center justify-between hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div className="text-left">
                  <div className="text-sm font-black leading-none">I am Worker</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1">I want to Earn &rarr;</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-orange-600 font-extrabold text-xs">
                <span>Earn Daily</span>
                <ArrowRight size={16} />
              </div>
            </button>
          </div>

          {/* Footer: How It Works 3 Steps */}
          <div className="bg-white/85 backdrop-blur-sm rounded-[20px] p-4 shadow-sm border border-purple-200/80 space-y-2.5">
            <h3 className="text-xs font-black uppercase text-purple-950 tracking-wider text-center">
              How PickPal Works in 3 Easy Steps
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-800">
              <div className="p-2.5 rounded-xl bg-purple-50 space-y-1 border border-purple-100">
                <div className="text-lg">1️⃣</div>
                <div className="leading-tight font-extrabold text-slate-900">Request Item</div>
                <div className="text-[9px] text-slate-500 font-medium">Pick shop & item</div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 space-y-1 border border-purple-100">
                <div className="text-lg">2️⃣</div>
                <div className="leading-tight font-extrabold text-slate-900">Shopper Visits</div>
                <div className="text-[9px] text-slate-500 font-medium">Live bill & video proof</div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 space-y-1 border border-purple-100">
                <div className="text-lg">3️⃣</div>
                <div className="leading-tight font-extrabold text-slate-900">Deliver / Ship</div>
                <div className="text-[9px] text-slate-500 font-medium">Escrow safe delivery</div>
              </div>
            </div>
          </div>

          <p className="text-[10.5px] text-center font-extrabold text-purple-950/80 pb-2">
            🔒 Escrow Safe & Verified Personal Shopper Network
          </p>
        </div>
      )}

      {/* ── CUSTOMER FLOW (appMode === "customer") ───────────────────────── */}
      {appMode === "customer" && (
        <CustomerMobileApp
          onSwitchToWorker={() => {
            setAppMode("worker");
            setWorkerScreen("dashboard");
          }}
          onNavigateHome={() => setAppMode("landing")}
          initialScreen={customerScreen}
        />
      )}

      {/* ── WORKER FLOW (appMode === "worker") ───────────────────────────── */}
      {appMode === "worker" && (
        <WorkerMobileApp
          onSwitchToCustomer={() => {
            setAppMode("customer");
            setCustomerScreen("home");
          }}
          onNavigateHome={() => setAppMode("landing")}
          initialScreen={workerScreen}
        />
      )}
    </div>
  );
}
