import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Plus, Trash2, Camera, Video, Mic, Square, MapPin, Compass, Ticket, Check, Loader2,
  Globe, Truck, ShoppingBag, ShieldCheck, DollarSign, Calculator, Info
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { TopBar } from "../../components/shared/TopBar";
import { Button } from "../../components/ui/Button";
import { BookingService } from "../../services/booking.service";
import { LocationService } from "../../services/location.service";
import { ServiceDef, ServiceCategory, ShoppingMode } from "../../types";

const STATES_AND_CITIES: Record<string, string[]> = {
  "Karnataka": ["Bengaluru", "Mysore", "Mangalore", "Hubli"],
  "Uttar Pradesh": ["Varanasi", "Lucknow", "Agra", "Kanpur"],
  "Maharashtra": ["Mumbai", "Pune", "Kolhapur", "Nagpur"],
  "Delhi NCR": ["Delhi", "Noida", "Gurugram"],
  "Tamil Nadu": ["Chennai", "Kanchipuram", "Coimbatore", "Madurai"],
  "Telangana": ["Hyderabad", "Warangal"],
};

const COUNTRIES = [
  { code: "US", name: "United States (USA)", currency: "USD", symbol: "$", rate: 0.012 },
  { code: "GB", name: "United Kingdom (UK)", currency: "GBP", symbol: "£", rate: 0.0095 },
  { code: "AE", name: "United Arab Emirates (UAE)", currency: "AED", symbol: "AED", rate: 0.044 },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "$", rate: 0.016 },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "$", rate: 0.018 },
  { code: "IN", name: "India (Domestic)", currency: "INR", symbol: "₹", rate: 1.0 },
];

export default function NewRequest() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as {
    service?: ServiceDef;
    requestType?: string;
    targetState?: string;
    targetCity?: string;
    mode?: ShoppingMode;
    workerId?: string;
    workerName?: string;
  } | null;

  // 1. Core Shopping Mode
  const [shoppingMode, setShoppingMode] = useState<ShoppingMode>(stateData?.mode || "local");

  // 2. Worker Location Target
  const [targetState, setTargetState] = useState(stateData?.targetState || "Karnataka");
  const [targetCity, setTargetCity] = useState(stateData?.targetCity || "Bengaluru");

  // 3. International / NRI State
  const [destCountry, setDestCountry] = useState(COUNTRIES[0]);

  // 4. Store & Product Details
  const [storeName, setStoreName] = useState(stateData?.service ? stateData.service.label : "Commercial Street Market / Specialty Store");
  const [category, setCategory] = useState<ServiceCategory>("silk_textiles");
  const [items, setItems] = useState([{ name: "", qty: 1 }]);
  const [details, setDetails] = useState("");
  const [budgetCap, setBudgetCap] = useState("3500");
  const [submitting, setSubmitting] = useState(false);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [voice, setVoice] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Delivery Address
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number]>([12.9716, 77.5946]);
  const [addressText, setAddressText] = useState(profile?.area || "Bangalore, India");
  const [internationalAddress, setInternationalAddress] = useState("");

  useEffect(() => {
    if (profile?.area) setAddressText(profile.area);
    if (profile?.lat && profile?.lng) setDeliveryCoords([profile.lat, profile.lng]);
  }, [profile]);

  // Dynamic Shipping & Service Fee Calculation
  const feeCalculation = useMemo(() => {
    const itemBudget = parseFloat(budgetCap) || 0;
    let proxyShopperFee = 149;
    let shippingFee = 50;
    let days = "Same Day (2-4 hrs)";

    if (shoppingMode === "interstate") {
      proxyShopperFee = 299;
      shippingFee = 249; // Interstate Courier Rate
      days = "2-4 Business Days Courier";
    } else if (shoppingMode === "international") {
      proxyShopperFee = 499;
      shippingFee = 1499; // International Express Air Shipping Rate
      days = "4-7 Days Air Express Worldwide";
    }

    const totalInr = itemBudget + proxyShopperFee + shippingFee;
    const rate = shoppingMode === "international" ? destCountry.rate : 1;
    const totalInCurrency = totalInr * rate;

    return {
      itemBudget,
      proxyShopperFee,
      shippingFee,
      days,
      totalInr,
      totalInCurrency,
      symbol: shoppingMode === "international" ? destCountry.symbol : "₹",
      currencyCode: shoppingMode === "international" ? destCountry.currency : "INR",
    };
  }, [budgetCap, shoppingMode, destCountry]);

  const handleAddItem = () => setItems([...items, { name: "", qty: 1 }]);
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const handleItemChange = (index: number, field: "name" | "qty", val: any) => {
    const next = [...items];
    next[index][field] = val;
    setItems(next);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.readAsDataURL(files[i]);
      await new Promise((res) => {
        reader.onload = () => {
          newImages.push(reader.result as string);
          res(true);
        };
      });
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);

    try {
      const finalItems = items.filter((i) => i.name.trim() !== "");
      if (finalItems.length === 0) {
        alert("Please add at least one item or product description!");
        setSubmitting(false);
        return;
      }

      const finalAddress = shoppingMode === "international"
        ? `${internationalAddress}, ${destCountry.name}`
        : addressText;

      const orderData = {
        customerId: profile.id,
        customerName: profile.name,
        workerId: stateData?.workerId || null,
        workerName: stateData?.workerName || null,
        storeName: storeName.trim() || "Local Market / Store",
        category,
        shoppingMode,
        targetState,
        targetCity,
        targetMarket: storeName,
        currency: feeCalculation.currencyCode as any,
        status: "searching_worker" as const,
        items: finalItems,
        totalAmount: feeCalculation.totalInr,
        budgetCap: feeCalculation.itemBudget,
        serviceFee: feeCalculation.proxyShopperFee,
        shippingFee: feeCalculation.shippingFee,
        customerAddress: finalAddress,
        customerCountry: shoppingMode === "international" ? destCountry.name : "India",
        shippingDetails: {
          shippingFee: feeCalculation.shippingFee,
          estimatedDays: feeCalculation.days,
          customsDeclared: shoppingMode === "international",
        },
        photoVerification: {
          status: "pending" as const,
        },
        attachments: {
          details: details.trim() || "Personal Proxy Shopping Request",
          images,
          voice,
        },
      };

      const newOrder = await BookingService.createOrder(orderData);
      navigate(`/customer/track/${newOrder.id}`);
    } catch (err: any) {
      console.error("Order submit failed:", err);
      alert(err.message || "Failed to submit proxy request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      <TopBar title="Request Proxy Shopper" showBack />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Banner */}
        <div className="rounded-3xl p-6 bg-gradient-to-r from-brand-600 via-pink-600 to-purple-700 text-white shadow-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Personal Proxy Shopping & Shipping
            </span>
          </div>
          <h1 className="text-xl font-black">Hire a Trusted Personal Shopper</h1>
          <p className="text-xs text-white/90 leading-relaxed">
            Specify what item you need, which store/city to buy it from, and our worker will inspect, photo-verify, buy & deliver to your doorstep!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Mode */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 1: Choose Shopping Mode</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setShoppingMode("local")}
                className={`p-3.5 rounded-2xl text-left border-2 transition-all space-y-1 ${
                  shoppingMode === "local"
                    ? "border-brand-500 bg-brand-50/60 dark:bg-brand-500/15 font-bold"
                    : "border-slate-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🏙️</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500 text-white">Same City</span>
                </div>
                <div className="text-sm font-extrabold text-ink dark:text-white">Local Proxy</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Same day store purchase & drop</div>
              </button>

              <button
                type="button"
                onClick={() => setShoppingMode("interstate")}
                className={`p-3.5 rounded-2xl text-left border-2 transition-all space-y-1 ${
                  shoppingMode === "interstate"
                    ? "border-purple-500 bg-purple-50/60 dark:bg-purple-500/15 font-bold"
                    : "border-slate-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🚚</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white">Interstate</span>
                </div>
                <div className="text-sm font-extrabold text-ink dark:text-white">State-Wide Proxy</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Worker buys in target state & couriers</div>
              </button>

              <button
                type="button"
                onClick={() => setShoppingMode("international")}
                className={`p-3.5 rounded-2xl text-left border-2 transition-all space-y-1 ${
                  shoppingMode === "international"
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-500/15 font-bold"
                    : "border-slate-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">✈️</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white">NRI Global</span>
                </div>
                <div className="text-sm font-extrabold text-ink dark:text-white">International NRI</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Worker in India ships to USA/UK/etc.</div>
              </button>
            </div>
          </div>

          {/* Step 2: Worker Location Filter */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-900">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Step 2: Where is the physical shop located?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Target State in India</label>
                <select
                  value={targetState}
                  onChange={(e) => {
                    const st = e.target.value;
                    setTargetState(st);
                    if (STATES_AND_CITIES[st]) setTargetCity(STATES_AND_CITIES[st][0]);
                  }}
                  className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                >
                  {Object.keys(STATES_AND_CITIES).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Target City</label>
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                >
                  {(STATES_AND_CITIES[targetState] || ["Bengaluru"]).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Shop / Market Name (e.g. Kuberan Silks, Commercial St, Weaver Colony)</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter shop or bazaar name..."
                className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                required
              />
            </div>
          </div>

          {/* Step 3: Product List & Details */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 3: What items to buy?</h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Product name, color, size or spec..."
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                    className="flex-1 text-sm font-semibold p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, "qty", parseInt(e.target.value) || 1)}
                    className="w-16 text-sm font-bold text-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-2xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Product Instructions / Special Notes</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mention specific brand, silk mark preference, design photo reference..."
                className="w-full text-sm p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white h-24"
              />
            </div>

            {/* Photo reference upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Camera size={14} className="text-brand-500" /> Reference Image / Design Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt="ref" className="w-14 h-14 object-cover rounded-xl border border-slate-200" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Delivery Location & NRI Mode Settings */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-900">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">Step 4: Customer Delivery Address</h2>

            {shoppingMode === "international" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Destination Country (NRI)</label>
                  <select
                    value={destCountry.code}
                    onChange={(e) => {
                      const c = COUNTRIES.find((x) => x.code === e.target.value);
                      if (c) setDestCountry(c);
                    }}
                    className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                  >
                    {COUNTRIES.filter((x) => x.code !== "IN").map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Full International Address (Street, City, State/Province, Zip Code)</label>
                  <textarea
                    value={internationalAddress}
                    onChange={(e) => setInternationalAddress(e.target.value)}
                    placeholder="Enter complete overseas address..."
                    className="w-full text-sm p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white h-20"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Delivery Address in India</label>
                <input
                  type="text"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="Street, area, landmark..."
                  className="w-full text-sm font-bold p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-ink dark:text-white"
                  required
                />
              </div>
            )}
          </div>

          {/* Step 5: Shipping & Cost Estimation Calculator */}
          <div className="glass-card rounded-3xl p-6 border-2 border-brand-500/30 bg-gradient-to-br from-brand-500/5 via-purple-500/5 to-pink-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <Calculator size={16} /> Transparent Fee Breakdown & Shipping Calculator
              </h2>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500 text-white">
                {feeCalculation.days}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-800">
                <span className="text-slate-600 dark:text-zinc-400 font-semibold">Estimated Item Cost Budget (Cap):</span>
                <div className="flex items-center gap-1 font-bold text-sm">
                  <span>₹</span>
                  <input
                    type="number"
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(e.target.value)}
                    className="w-24 px-2 py-1 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-extrabold"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-zinc-400">Personal Proxy Shopper Service Fee:</span>
                <span className="font-extrabold text-ink dark:text-white">₹{feeCalculation.proxyShopperFee}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-zinc-400">
                  {shoppingMode === "local" ? "Local Runner Delivery Fee" : shoppingMode === "interstate" ? "Interstate Courier Rate" : "International Air Express Shipping"}
                </span>
                <span className="font-extrabold text-ink dark:text-white">₹{feeCalculation.shippingFee}</span>
              </div>

              <div className="pt-3 border-t border-brand-500/30 flex justify-between items-center text-sm">
                <span className="font-black text-ink dark:text-white">Total Estimated Payable:</span>
                <div className="text-right">
                  <div className="text-lg font-black text-brand-600 dark:text-brand-400">
                    {feeCalculation.symbol} {feeCalculation.totalInCurrency.toFixed(2)} {feeCalculation.currencyCode}
                  </div>
                  {shoppingMode === "international" && (
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      (Approx ₹{feeCalculation.totalInr} INR)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl btn-gradient-brand text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Dispatching Proxy Request...
              </>
            ) : (
              <>
                <ShoppingBag size={18} /> Confirm & Find Proxy Shopper
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
