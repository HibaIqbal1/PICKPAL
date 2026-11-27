import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, Truck, Globe, ShieldCheck, AlertTriangle, ArrowRight,
  CheckCircle2, Clock, MapPin, Camera, Video, Phone, MessageSquare,
  ChevronRight, ArrowLeft, Info, LogIn, KeyRound, Mail, UserCheck, Send, X, PlusCircle, Check, Home, Package, Navigation
} from "lucide-react";
import { BookingService, FastApiOrder } from "../../services/booking.service";
import { LocationService } from "../../services/location.service";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

// Service Option Interface
export interface ServiceOption {
  id: string;
  name: string;
  category: string;
  shopName: string;
  price: number;
  serviceFee: number;
  shippingFee: number;
  customsFee?: number;
  image: string;
  isNonReturnable: boolean;
}

// 1. LOCAL SHOP-TO-HOME SERVICES (DEFAULT TAB 1 - SHOP TO HOME PURCHASE & DELIVERY)
export const LOCAL_SERVICES: ServiceOption[] = [
  { id: "", name: "-- Select a Local Service (Shop-to-Home Purchase & Delivery) --", category: "", shopName: "", price: 0, serviceFee: 0, shippingFee: 0, image: "", isNonReturnable: false },
  { id: "custom_local_item", name: "✨ Custom Option A: Type Any Local Shop Name & Product Name", category: "Custom Local Purchase", shopName: "", price: 0, serviceFee: 80, shippingFee: 60, image: "", isNonReturnable: false },
  { id: "custom_local_pickup", name: "✨ Custom Option B: Pick Up Prescription / Order from Any Local Shop", category: "Shop Pickup & Delivery", shopName: "", price: 0, serviceFee: 60, shippingFee: 50, image: "", isNonReturnable: false },
  { id: "custom_local_grocery", name: "✨ Custom Option C: Fresh Grocery & Market Produce Shop-to-Home", category: "Fresh Market Purchase", shopName: "", price: 0, serviceFee: 90, shippingFee: 60, image: "", isNonReturnable: false },
  { id: "local_pak", name: "Authentic Mysore Pak Sweets Box (1kg Fresh from Guru Sweets)", category: "Sweets & Bakery", shopName: "Guru Sweets, Devaraja Market Mysore", price: 500, serviceFee: 80, shippingFee: 60, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "local_prasadam", name: "Chamundi Temple Flowers & Sacred Prasadam Box", category: "Pooja & Temple", shopName: "Chamundi Hill Temple Store, Mysore", price: 350, serviceFee: 70, shippingFee: 50, image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "local_soap", name: "Mysore Sandal Soap Pack (10 Bars)", category: "Personal Care", shopName: "Karnataka Soaps Store, K.R. Circle Mysore", price: 650, serviceFee: 80, shippingFee: 50, image: "https://images.unsplash.com/photo-1607006482602-76ca97ac4714?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "local_coffee", name: "Coorg Fresh Roasted Coffee Powder (500g)", category: "Gourmet Coffee", shopName: "Local Coffee Works, Sayyaji Rao Road Mysore", price: 280, serviceFee: 60, shippingFee: 40, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "local_toys", name: "Channapatna Handcrafted Wooden Toy Set", category: "Handicrafts", shopName: "Handloom Emporium, Mysore Bazaar", price: 850, serviceFee: 80, shippingFee: 60, image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "local_garland", name: "Fresh Jasmine & Rose Flower Garland", category: "Fresh Flowers", shopName: "Devaraja Flower Market, Mysore", price: 200, serviceFee: 50, shippingFee: 40, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "local_cake", name: "Fresh Cream Birthday Cake (1kg Chocolate)", category: "Bakery & Desserts", shopName: "Local Premier Bakery, Mysore", price: 650, serviceFee: 90, shippingFee: 70, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "local_medicine", name: "Urgent Pharmacy Medicine & Prescription Purchase", category: "Pharmacy & Wellness", shopName: "Apollo Medical Store, Saraswathipuram Mysore", price: 400, serviceFee: 70, shippingFee: 50, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "local_fruits", name: "Fresh Organic Fruit Basket (Apple, Pomegranate, Grapes)", category: "Fresh Produce", shopName: "City Fruit Stall, Devaraja Market Mysore", price: 550, serviceFee: 80, shippingFee: 50, image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80", isNonReturnable: false }
];

// 2. ACROSS STATES SERVICES (TAB 2)
export const STATE_SERVICES: ServiceOption[] = [
  { id: "", name: "-- Select an Interstate Service (Across States) --", category: "", shopName: "", price: 0, serviceFee: 0, shippingFee: 0, image: "", isNonReturnable: false },
  { id: "custom_state", name: "✨ Custom Option — Type Any Interstate Item & Shop Name", category: "Custom Interstate", shopName: "", price: 0, serviceFee: 300, shippingFee: 500, image: "", isNonReturnable: false },
  { id: "saree", name: "Pure Mysore Silk Saree (Gold Zari)", category: "Clothing & Handloom", shopName: "KSIC Silk Emporium, K.R. Circle Mysore", price: 15000, serviceFee: 300, shippingFee: 500, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "banarasi", name: "Varanasi Pure Banarasi Silk Dupatta", category: "Clothing & Handloom", shopName: "Kashi Weavers Hub, Chowk Varanasi", price: 4500, serviceFee: 250, shippingFee: 350, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "kanchipuram", name: "Kanchipuram Heavy Zari Bridal Saree", category: "Clothing & Handloom", shopName: "Pothys Weavers Outlet, Kanchipuram", price: 22000, serviceFee: 500, shippingFee: 600, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "mango", name: "Alphonso Mango Box (1 Dozen Devgad)", category: "Fresh Produce", shopName: "Ratnagiri Fruit Yard, Maharashtra", price: 1800, serviceFee: 200, shippingFee: 300, image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "tea", name: "Darjeeling First Flush Whole Leaf Tea (500g)", category: "Gourmet Food", shopName: "Nathmulls Tea Estate, Darjeeling", price: 1600, serviceFee: 150, shippingFee: 150, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "lamp", name: "Antique Brass Kamatchi Pooja Lamp", category: "Handicrafts", shopName: "Kumbakonam Brass Bazaar, Tamil Nadu", price: 2800, serviceFee: 200, shippingFee: 250, image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "chips", name: "Kerala Nendran Banana Chips (2kg Pack)", category: "Sweets & Snacks", shopName: "Calicut Chips Centre, Kozhikode", price: 750, serviceFee: 100, shippingFee: 120, image: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "biryani", name: "Hyderabadi Frozen Special Mutton Biryani", category: "Gourmet Food", shopName: "Shadab Hotel, Charminar Hyderabad", price: 1400, serviceFee: 200, shippingFee: 300, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "chappal", name: "Original Kolhapuri Leather Chappals", category: "Footwear", shopName: "Chappal Gali Artisan Market, Kolhapur", price: 1900, serviceFee: 150, shippingFee: 180, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "hairoil", name: "Kerala Neelibringadi Herbal Hair Oil (500ml)", category: "Wellness", shopName: "Kottakkal Arya Vaidya Sala, Kerala", price: 850, serviceFee: 100, shippingFee: 100, image: "https://images.unsplash.com/photo-1608248597263-00079996576b?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "saffron", name: "Kashmir Organic Saffron (5g Authentic Pack)", category: "Gourmet Food", shopName: "Pampore Saffron Farmers, Kashmir", price: 2100, serviceFee: 150, shippingFee: 150, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "bedspread", name: "Jaipuri Hand Block Print Cotton Bedspread", category: "Home & Living", shopName: "Sanganer Textile Market, Jaipur", price: 2400, serviceFee: 200, shippingFee: 220, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "sculpture", name: "Handmade Sandalwood Ganesha Carving (6 inch)", category: "Handicrafts", shopName: "Mysore Sandalwood Craft Guild", price: 4200, serviceFee: 250, shippingFee: 250, image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "spices", name: "Idukki Black Pepper & Green Cardamom Box", category: "Gourmet Food", shopName: "High Range Spice Farmers, Idukki Kerala", price: 1100, serviceFee: 120, shippingFee: 120, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "claypots", name: "Terracotta Cooking Handi Set", category: "Home & Living", shopName: "Pots Pottery Market, Madurai", price: 780, serviceFee: 120, shippingFee: 150, image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80", isNonReturnable: false }
];

// 3. INTERNATIONAL SERVICES (TAB 3)
export const GLOBAL_SERVICES: ServiceOption[] = [
  { id: "", name: "-- Select an International Service (DHL Air Express) --", category: "", shopName: "", price: 0, serviceFee: 0, shippingFee: 0, customsFee: 0, image: "", isNonReturnable: false },
  { id: "custom_global", name: "✨ Custom Option — Type Any International Item & Destination", category: "Custom International", shopName: "", price: 0, serviceFee: 500, shippingFee: 2500, customsFee: 800, image: "", isNonReturnable: false },
  { id: "global_soap", name: "Mysore Sandal Soap Export Pack (10 Bars)", category: "Personal Care", shopName: "Mysore India → New York USA", price: 2000, serviceFee: 500, shippingFee: 2500, customsFee: 800, image: "https://images.unsplash.com/photo-1607006482602-76ca97ac4714?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "global_spices", name: "Authentic Organic Indian Spice Gift Box (12 Spices)", category: "Gourmet", shopName: "Kochi India → London UK", price: 3500, serviceFee: 600, shippingFee: 3200, customsFee: 900, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80", isNonReturnable: false },
  { id: "global_statue", name: "Handcrafted Brass Peacock Pooja Statue", category: "Handicrafts", shopName: "Kumbakonam India → Toronto Canada", price: 5200, serviceFee: 700, shippingFee: 4500, customsFee: 1200, image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80", isNonReturnable: true },
  { id: "global_shawl", name: "Pure Kashmir Pashmina Shawl (Hand-Embroidered)", category: "Apparel", shopName: "Srinagar India → Sydney Australia", price: 12500, serviceFee: 1000, shippingFee: 4000, customsFee: 1500, image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80", isNonReturnable: true }
];

export function CustomerMobileApp({
  onSwitchToWorker,
  onNavigateHome,
  initialScreen = "login"
}: {
  onSwitchToWorker: () => void;
  onNavigateHome: () => void;
  initialScreen?: "login" | "home" | "tracking";
}) {
  const [currentScreen, setCurrentScreen] = useState<"login" | "home" | "tracking">(initialScreen);
  // LOCAL PURCHASING IS NOW DEFAULT ACTIVE TAB!
  const [activeTab, setActiveTab] = useState<"local" | "state" | "global">("local");

  // Persistent Login Credentials State
  const [phone, setPhone] = useState(() => localStorage.getItem("pickpal_cust_phone") || "9876543210");
  const [otp, setOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(true);
  const [email, setEmail] = useState(() => localStorage.getItem("pickpal_cust_email") || "customer@pickpal.app");
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("pickpal_cust_logged") === "true");

  // Dynamic Item Selection States (Initially Empty across all 3 options!)
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [fromCity, setFromCity] = useState("Mysore");
  const [toCity, setToCity] = useState("Mysore"); // Local default: Mysore → Mysore
  const [productName, setProductName] = useState("");
  const [shopName, setShopName] = useState("");
  const [productPrice, setProductPrice] = useState<number>(0);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [customsFee, setCustomsFee] = useState<number>(0);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [isNonReturnable, setIsNonReturnable] = useState<boolean>(false);

  // Order & Tracking State connected to FastAPI & Neon Escrow
  const [activeOrder, setActiveOrder] = useState<FastApiOrder | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [workerLocation, setWorkerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Live WebSocket tracking stream for customer
  useEffect(() => {
    if (!activeOrder?.id || currentScreen !== "tracking") return;
    const unsub = LocationService.listenToOrderLocation(activeOrder.id, (coords) => {
      setWorkerLocation({ lat: coords.latitude, lng: coords.longitude });
    });
    return () => unsub();
  }, [activeOrder?.id, currentScreen]);

  const handlePayAndCreateOrder = async () => {
    if (!selectedServiceId) {
      alert("Please select a local service or Custom Option from the dropdown first!");
      return;
    }
    setIsSubmittingOrder(true);
    try {
      const order = await BookingService.createOrder({
        store_name: shopName || "Guru Sweets Mysore",
        category: activeTab === "local" ? "Local" : (activeTab === "state" ? "State" : "Global"),
        items_description: productName || "Daily essentials",
        shipping_tier: activeTab.toUpperCase() as "LOCAL" | "STATE" | "GLOBAL",
        budget_cap: Number(productPrice) || 500,
        delivery_fee: Number(shippingFee) || 40,
      });
      setActiveOrder(order);
      setCurrentScreen("tracking");
    } catch (err: any) {
      console.error("Order creation failed:", err);
      alert("Could not process order in database: " + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Live Chat Modal State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "worker", text: "Hello! I am at the local shop in Mysore. Buying item for you now.", time: "10:32 AM" },
    { sender: "customer", text: "Please check fresh batch before billing!", time: "10:33 AM" },
    { sender: "worker", text: "Sure! Uploading video proof now.", time: "10:34 AM" }
  ]);
  const [inputMsg, setInputMsg] = useState("");

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("pickpal_cust_phone", phone);
    localStorage.setItem("pickpal_cust_email", email);
    localStorage.setItem("pickpal_cust_logged", "true");
    setIsLoggedIn(true);
    setCurrentScreen("home");
  };

  // Reset service selection when tab changes so fields start empty for that tab
  const handleTabChange = (tab: "local" | "state" | "global") => {
    setActiveTab(tab);
    setSelectedServiceId("");
    setProductName("");
    setShopName("");
    setProductPrice(0);
    setServiceFee(0);
    setShippingFee(0);
    setCustomsFee(0);
    setRefImage(null);
    setIsNonReturnable(false);
    if (tab === "local") {
      setToCity("Mysore");
    } else if (tab === "state") {
      setToCity("Delhi");
    } else {
      setToCity("New York USA");
    }
  };

  // Generic Dropdown Selection Handler for all 3 tabs
  const handleServiceSelect = (serviceId: string, serviceList: ServiceOption[]) => {
    setSelectedServiceId(serviceId);
    if (!serviceId) {
      setProductName("");
      setShopName("");
      setProductPrice(0);
      setServiceFee(0);
      setShippingFee(0);
      setCustomsFee(0);
      setRefImage(null);
      setIsNonReturnable(false);
      return;
    }

    const selected = serviceList.find((s) => s.id === serviceId);
    if (selected) {
      if (selected.id.startsWith("custom")) {
        // Custom Option — Empty input mode
        setProductName("");
        setShopName("");
        setProductPrice(0);
        setServiceFee(selected.serviceFee);
        setShippingFee(selected.shippingFee);
        setCustomsFee(selected.customsFee || 0);
        setRefImage("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80");
        setIsNonReturnable(false);
      } else {
        // Predefined Option — Populate text and details
        setProductName(selected.name);
        setShopName(selected.shopName);
        setProductPrice(selected.price);
        setServiceFee(selected.serviceFee);
        setShippingFee(selected.shippingFee);
        setCustomsFee(selected.customsFee || 0);
        setRefImage(selected.image);
        setIsNonReturnable(selected.isNonReturnable);
      }
    }
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;
    setChatMessages((prev) => [...prev, { sender: "customer", text: inputMsg, time: "Just now" }]);
    setInputMsg("");
  };

  const totalAmount = (productPrice || 0) + (serviceFee || 0) + (shippingFee || 0) + (customsFee || 0);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#E9D5FF] via-[#F3E8FF] to-[#FCE7F3] flex flex-col font-sans text-slate-900">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-screen relative shadow-2xl bg-gradient-to-br from-[#E9D5FF] via-[#F3E8FF] to-[#FCE7F3]">

        {/* Top App Header */}
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
              <span className="text-xl">🛍️</span>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-none">
                  Pick<span className="text-purple-600">Pal</span>
                </h1>
                <span className="text-[9.5px] font-extrabold text-orange-600 uppercase tracking-wider">
                  {isLoggedIn ? `Customer (${phone.slice(-4)})` : "Customer App"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onSwitchToWorker}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-extrabold text-[10.5px] shadow-sm hover:opacity-95 transition-all flex items-center gap-1"
          >
            <span>Worker Mode</span>
            <ArrowRight size={12} />
          </button>
        </header>

        {/* Navigation Bar when Logged In */}
        {currentScreen !== "login" && (
          <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200/60 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentScreen("home")}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentScreen === "home" ? "bg-purple-600 text-white font-black" : "hover:bg-purple-100"
                }`}
              >
                1. Select Service
              </button>
              <button
                onClick={() => setCurrentScreen("tracking")}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentScreen === "tracking" ? "bg-purple-600 text-white font-black" : "hover:bg-purple-100"
                }`}
              >
                2. Live Order #PP12345
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-4">

          {/* ── SCREEN 1: CUSTOMER LOGIN (/customer/login) ───────────────────── */}
          {currentScreen === "login" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-[20px] bg-white shadow-md border border-purple-200 text-purple-600 font-black text-2xl flex items-center justify-center mx-auto">
                  🛍️
                </div>
                <h2 className="text-xl font-black text-slate-900">I am Customer - Login to Buy</h2>
                <p className="text-xs font-extrabold text-purple-900/90">Any City Any Shop • We Will Buy For You</p>
              </div>

              {/* Login Form with Credentials Persistence */}
              <form onSubmit={handleLoginSubmit} className="bg-white rounded-[20px] p-5 shadow-md shadow-purple-900/5 border border-purple-100 space-y-4">
                
                {isLoggedIn && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                    <span>Saved Credentials Active ({phone})</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">Logged In ✓</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Phone Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-700">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10-digit number..."
                      className="flex-1 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">One-Time Password (OTP)</label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[11px] font-extrabold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md hover:bg-purple-200"
                    >
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono font-bold text-slate-900"
                    />
                    {otpSent && (
                      <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        OTP Sent ✓
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Email Address (Saved Credential)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full p-2.5 rounded-xl border border-purple-100 bg-slate-50 text-xs font-medium text-slate-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentScreen("home")}
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
                  <span>Login to Buy &rarr;</span>
                </button>
              </form>

              <div className="bg-white/70 p-3 rounded-[20px] border border-purple-200 text-center text-xs space-y-1">
                <p className="font-extrabold text-purple-900">🚀 Quick Demo Credential Access</p>
                <button
                  onClick={() => setCurrentScreen("home")}
                  className="text-xs font-black text-orange-600 underline"
                >
                  Quick Enter Customer Home Screen &rarr;
                </button>
              </div>

              <p className="text-[11px] text-center font-extrabold text-purple-900/80">
                🔒 100% Escrow Protected Personal Shopping
              </p>
            </motion.div>
          )}

          {/* ── SCREEN 2: CUSTOMER HOME (/customer/home) ────────────────────── */}
          {currentScreen === "home" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              
              {/* Top Tabs (LOCAL IS DEFAULT!) */}
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-purple-200/80 backdrop-blur-md rounded-[20px] border border-purple-300/80 shadow-xs">
                {/* Tab 1: Local (DEFAULT ACTIVE) */}
                <button
                  onClick={() => handleTabChange("local")}
                  className={`py-2.5 px-1 rounded-[16px] text-xs font-black flex items-center justify-center gap-1 transition-all relative ${
                    activeTab === "local" ? "bg-purple-600 text-white shadow-md scale-[1.02]" : "text-purple-900 hover:text-purple-950"
                  }`}
                >
                  <ShoppingBag size={14} />
                  <span>1. Local</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
                </button>

                {/* Tab 2: State */}
                <button
                  onClick={() => handleTabChange("state")}
                  className={`py-2.5 px-1 rounded-[16px] text-xs font-black flex items-center justify-center gap-1 transition-all ${
                    activeTab === "state" ? "bg-white text-purple-950 shadow-md scale-[1.02]" : "text-purple-900 hover:text-purple-950"
                  }`}
                >
                  <Truck size={14} />
                  <span>2. State</span>
                </button>

                {/* Tab 3: Global */}
                <button
                  onClick={() => handleTabChange("global")}
                  className={`py-2.5 px-1 rounded-[16px] text-xs font-black flex items-center justify-center gap-1 transition-all ${
                    activeTab === "global" ? "bg-white text-purple-950 shadow-md scale-[1.02]" : "text-purple-900 hover:text-purple-950"
                  }`}
                >
                  <Globe size={14} />
                  <span>3. Global</span>
                </button>
              </div>

              {/* RENDER FORM FOR LOCAL (DEFAULT), STATE, OR GLOBAL TAB */}
              <div className="bg-white rounded-[20px] p-4 shadow-md shadow-purple-900/10 border-2 border-purple-400 space-y-3.5 relative">
                
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Home size={12} />
                    {activeTab === "local" ? "Local Shop-to-Home Purchase & Doorstep Delivery" : activeTab === "state" ? "Interstate Personal Shopper" : "DHL International Express"}
                  </span>
                  {isNonReturnable && (
                    <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={10} /> Non-Returnable Shop
                    </span>
                  )}
                </div>

                {/* City Dropdowns */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-extrabold text-purple-800 uppercase">From City (Shop Location):</label>
                    <select
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="w-full mt-0.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50 font-black text-slate-900 text-xs"
                    >
                      <option value="Mysore">Mysore</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Varanasi">Varanasi</option>
                      <option value="Kochi">Kochi</option>
                      <option value="Jaipur">Jaipur</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-purple-800 uppercase">To City (Delivery Home):</label>
                    <select
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="w-full mt-0.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50 font-black text-slate-900 text-xs"
                    >
                      {activeTab === "local" ? (
                        <>
                          <option value="Mysore">Mysore (Same City Home)</option>
                          <option value="Bangalore">Bangalore (Same City Home)</option>
                        </>
                      ) : activeTab === "global" ? (
                        <>
                          <option value="New York USA">New York, USA</option>
                          <option value="London UK">London, UK</option>
                          <option value="Toronto Canada">Toronto, Canada</option>
                          <option value="Sydney Australia">Sydney, Australia</option>
                        </>
                      ) : (
                        <>
                          <option value="Delhi">Delhi</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Hyderabad">Hyderabad</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* SERVICE DROPDOWN WITH CUSTOM OPTIONS */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-purple-950 flex items-center justify-between">
                    <span>Select {activeTab === "local" ? "Local Shop-to-Home" : activeTab === "state" ? "Interstate" : "International"} Service:</span>
                    <span className="text-[10px] text-orange-600 font-extrabold">+ Custom Options Included</span>
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceSelect(
                      e.target.value,
                      activeTab === "local" ? LOCAL_SERVICES : activeTab === "state" ? STATE_SERVICES : GLOBAL_SERVICES
                    )}
                    className="w-full p-2.5 rounded-xl border-2 border-purple-400 bg-white font-extrabold text-slate-900 text-xs shadow-xs focus:ring-2 focus:ring-purple-500"
                  >
                    {(activeTab === "local" ? LOCAL_SERVICES : activeTab === "state" ? STATE_SERVICES : GLOBAL_SERVICES).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} {opt.price > 0 ? `(Rs. ${opt.price})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* IF NO SERVICE SELECTED YET (FIELDS START EMPTY) */}
                {!selectedServiceId && (
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-dashed border-purple-300 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-white text-purple-600 font-black text-lg flex items-center justify-center mx-auto shadow-xs">
                      🛍️
                    </div>
                    <p className="text-xs font-extrabold text-purple-900">
                      Please select a service from the dropdown above or pick one of the <span className="text-orange-600 font-black">✨ Custom Options</span> to enter custom local shop & product details.
                    </p>
                  </div>
                )}

                {/* IF SERVICE SELECTED OR CUSTOM OPTION CHOSEN (FIELDS BECOME VISIBLE) */}
                {selectedServiceId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-1">
                    
                    {selectedServiceId.startsWith("custom") && (
                      <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-950 flex items-center gap-2">
                        <PlusCircle size={16} className="text-orange-600 shrink-0" />
                        <div>
                          <div className="font-black text-orange-900">Custom Shop-to-Home Order Active</div>
                          <div className="text-[10px] text-orange-700">Enter local shop name, product description, and budget below:</div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700">Product / Item Name</label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter item name..."
                        className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 font-extrabold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700">Local Shop Name & Address</label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Guru Sweets, Devaraja Market Mysore"
                        className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 font-extrabold text-slate-900"
                      />
                    </div>

                    {selectedServiceId.startsWith("custom") && (
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700">Estimated Item Price (Rs.)</label>
                        <input
                          type="number"
                          value={productPrice || ""}
                          onChange={(e) => setProductPrice(Number(e.target.value))}
                          placeholder="Enter price in Rs..."
                          className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 font-extrabold text-slate-900"
                        />
                      </div>
                    )}

                    {/* Reference Photo Upload */}
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700 flex items-center justify-between">
                        <span>Upload Reference Image</span>
                        {refImage && <span className="text-purple-600 font-extrabold text-[10px]">Photo Attached</span>}
                      </label>
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-dashed border-purple-300">
                        {refImage ? (
                          <img src={refImage} alt="Reference" className="w-12 h-12 rounded-lg object-cover border" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                            📷
                          </div>
                        )}
                        <div className="flex-1 text-[11px] font-bold text-slate-800">
                          <div>{productName ? `${productName.slice(0, 22)}.jpg` : "reference_item.jpg"}</div>
                          <div className="text-[10px] text-slate-500 font-normal">Shopper verifies quality in shop before purchase</div>
                        </div>
                        <button type="button" className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                          <Camera size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Price Breakdown Card */}
                    <div className="bg-purple-50/90 rounded-xl p-3.5 text-xs space-y-1.5 border border-purple-200">
                      <div className="flex justify-between text-slate-700 font-medium"><span>Item Price:</span><span className="font-extrabold text-slate-900">Rs. {productPrice}</span></div>
                      <div className="flex justify-between text-slate-700 font-medium"><span>Shopper Purchase Fee:</span><span className="font-extrabold text-slate-900">Rs. {serviceFee}</span></div>
                      <div className="flex justify-between text-slate-700 font-medium"><span>Home Delivery Fee:</span><span className="font-extrabold text-slate-900">Rs. {shippingFee}</span></div>
                      {customsFee > 0 && (
                        <div className="flex justify-between text-slate-700 font-medium"><span>Customs Clearance:</span><span className="font-extrabold text-slate-900">Rs. {customsFee}</span></div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-purple-300 font-black text-sm text-purple-950">
                        <span>Total Payable:</span>
                        <span className="text-purple-700 text-base font-black">Rs. {totalAmount}</span>
                      </div>
                    </div>

                    {isNonReturnable && (
                      <div className="p-3 rounded-xl bg-red-50 border-2 border-red-300 text-[11px] text-red-900 space-y-1">
                        <div className="font-black text-red-700 flex items-center gap-1">
                          <AlertTriangle size={14} className="text-red-600 shrink-0" /> NO RETURN SHOP WARNING
                        </div>
                        <p className="leading-snug text-[10.5px]">
                          ⚠️ This shop has <strong>NO RETURN</strong>. Once purchased, <strong>NO cancellation</strong>. Escrow Protected.
                        </p>
                      </div>
                    )}

                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <Clock size={14} /> Estimated Doorstep Delivery Time: 60-90 mins
                    </div>

                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

          {/* ── SCREEN 3: CUSTOMER TRACKING (/customer/tracking) ─────────────── */}
          {currentScreen === "tracking" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white rounded-[20px] p-3.5 shadow-md border border-purple-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] font-black text-purple-700 uppercase">Live Shop-to-Home Order</div>
                  <div className="font-black text-slate-900 text-sm">
                    Order #{activeOrder ? activeOrder.id : "PP12345"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {activeOrder ? activeOrder.items_description : (productName || "Mysore Pak (Guru Sweets)")} • {activeOrder ? activeOrder.store_name : (shopName || "Mysore Shop")}
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(true)}
                  className="px-3 py-2 rounded-xl bg-purple-100 text-purple-900 font-extrabold text-xs flex items-center gap-1.5 hover:bg-purple-200"
                >
                  <MessageSquare size={14} className="text-purple-600" />
                  <span>Chat Shopper</span>
                </button>
              </div>

              {/* Delivery OTP Card */}
              {activeOrder?.delivery_otp && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-[20px] p-3.5 flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      Customer Delivery Verification OTP
                    </div>
                    <div className="text-2xl font-black text-emerald-950 tracking-widest mt-0.5">
                      {activeOrder.delivery_otp}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      Give this 4-digit OTP to shopper ONLY after receiving parcel
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                    🔐
                  </div>
                </div>
              )}

              {/* Live Worker GPS Tracking Signal */}
              {workerLocation && (
                <div className="bg-purple-50 border border-purple-200 rounded-[20px] p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Navigation size={16} className="text-purple-600 animate-pulse" />
                    <div>
                      <div className="font-black text-purple-950 text-xs">Shopper Live GPS Signal</div>
                      <div className="text-[10px] text-purple-700 font-bold">
                        Lat: {workerLocation.lat.toFixed(5)} • Lng: {workerLocation.lng.toFixed(5)}
                      </div>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>
              )}

              <div className="bg-white rounded-[20px] p-4 shadow-md border border-purple-100 space-y-3">
                <h3 className="text-xs font-black uppercase text-purple-900 tracking-wider">Escrow Delivery Timeline</h3>

                <div className="space-y-3.5 relative pl-6 text-xs">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />

                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                    <div>
                      <div className="font-extrabold text-emerald-700">1. Payment Done Escrow (Rs. {activeOrder ? activeOrder.total_amount : (totalAmount || 640)})</div>
                      <div className="text-[10px] text-slate-500">Money safely locked in PickPal Escrow Vault (Neon PostgreSQL)</div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      activeOrder?.worker_id ? "bg-emerald-500 text-white" : "bg-amber-400 text-white animate-pulse"
                    }`}>
                      {activeOrder?.worker_id ? "✓" : "2"}
                    </div>
                    <div>
                      <div className={`font-extrabold ${activeOrder?.worker_id ? "text-emerald-700" : "text-amber-700"}`}>
                        {activeOrder?.worker_id ? `2. Worker Accepted — Shopper ${activeOrder.worker_id}` : "2. Finding Matching Shopper Nearby..."}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {activeOrder?.worker_id ? `Assigned shopper en route to ${activeOrder.store_name}` : "Broadcasting request to active verified shoppers in your city"}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      activeOrder?.status === "in_transit" || activeOrder?.status === "delivered" ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                    }`}>
                      {activeOrder?.status === "in_transit" || activeOrder?.status === "delivered" ? "✓" : "3"}
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                      <div className="font-black text-emerald-900">
                        3. Bought Bill Uploaded (Rs. {activeOrder?.actual_item_cost || productPrice || 500})
                      </div>
                      <div className="text-[10.5px] text-emerald-800 font-bold">
                        {activeOrder?.store_receipt_url ? "Store receipt verified and stored." : "Shopper will upload verified store receipt photo."}
                      </div>
                      {activeOrder?.store_receipt_url && (
                        <div className="pt-1">
                          <img
                            src={`${API_BASE_URL}${activeOrder.store_receipt_url}`}
                            alt="Store Receipt"
                            className="w-24 h-24 object-cover rounded-lg border border-emerald-300 shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative opacity-80">
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      activeOrder?.status === "delivered" ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                    }`}>
                      {activeOrder?.status === "delivered" ? "✓" : "4"}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-700">
                        {activeOrder?.status === "delivered" ? "4. Delivered & Escrow Released" : "4. Delivery — En Route to Home Address"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {activeOrder?.status === "delivered" ? "Order completed! Escrow funds released to shopper." : "Shopper delivering parcel to your home address"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-3.5 shadow-md border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-purple-900 tracking-wider">Cancellation Policy Table</h3>
                  <Info size={14} className="text-purple-600" />
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[10.5px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-purple-100/80 text-purple-950 font-black border-b border-purple-200">
                        <th className="p-1.5">Stage</th>
                        <th className="p-1.5">Refund Policy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      <tr><td className="p-1.5">Before Accept</td><td className="p-1.5 text-emerald-600 font-black">100% Refund</td></tr>
                      <tr><td className="p-1.5">After Accept (Before Buy)</td><td className="p-1.5 text-amber-700">95% Refund (5% worker fee)</td></tr>
                      <tr className="bg-red-50 text-red-900"><td className="p-1.5 font-black text-red-700">After Buy (Non-Returnable)</td><td className="p-1.5 font-black text-red-600">NO REFUND — Force Delivery</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <button disabled className="w-full py-3 rounded-xl bg-slate-200 text-slate-500 font-extrabold text-xs cursor-not-allowed border border-slate-300 opacity-80">
                Cancel Button Disabled — Item Bought at Non-Returnable Shop
              </button>
            </motion.div>
          )}

        </div>

        {/* Fixed Bottom Action Bar */}
        {currentScreen === "home" && (
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-white/95 backdrop-blur-md border-t border-purple-200/80 shadow-2xl z-50">
            <button
              onClick={handlePayAndCreateOrder}
              disabled={isSubmittingOrder}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-orange-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>
                {isSubmittingOrder
                  ? "Securing Funds in Neon Escrow..."
                  : selectedServiceId
                  ? `Pay Now Rs. ${totalAmount} & Track Order`
                  : "Select a Local Service to Continue \u2192"}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Slide-Over Live Chat */}
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
                    R
                  </div>
                  <div>
                    <div className="font-extrabold text-xs">Shopper Rajesh</div>
                    <div className="text-[9px] text-purple-200 font-medium">At Local Shop</div>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-1 rounded-full hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50 text-xs">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.sender === "customer" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-2xl font-medium ${
                      msg.sender === "customer" ? "bg-purple-600 text-white rounded-br-none" : "bg-white text-slate-800 border rounded-bl-none shadow-xs"
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
                  placeholder="Type message to shopper..."
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
