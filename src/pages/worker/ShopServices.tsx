import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Plus, Trash2, ArrowLeft, Shield } from "lucide-react";
import { ShopServicePackage, Shop } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";

export default function ShopServices() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<ShopServicePackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("299");
  const [duration, setDuration] = useState("30");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;

    const unsubShops = ShopService.subscribeShops((data) => {
      const myShop = data.find((s) => s.ownerId === profile.id);
      if (myShop) {
        setShop(myShop);
      }
    });

    return () => unsubShops();
  }, [profile]);

  useEffect(() => {
    if (!shop) return;
    const unsubServices = ShopService.subscribeServices(shop.id, (data) => {
      setServices(data);
      setLoading(false);
    });
    return () => unsubServices();
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || adding) return;

    if (!name.trim()) return;

    setAdding(true);
    try {
      await ShopService.addService({
        shopId: shop.id,
        name,
        price: Number(price) || 299,
        duration: Number(duration) || 30,
        category,
        description,
      });

      setName("");
      setDescription("");
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add service package.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service package?")) return;
    try {
      await ShopService.deleteService(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded" />
        <div className="h-44 w-full bg-gray-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => navigate("/worker/shop-dashboard")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={14} /> Back to dashboard
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={22} className="text-brand-500" />
          <h1 className="text-xl font-display font-extrabold text-ink">Service Packages ({services.length})</h1>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1 shadow-md shadow-brand-500/10"
        >
          <Plus size={15} /> Add Service Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((srv) => (
          <div key={srv.id} className="glass-card rounded-3xl p-5 border border-black/5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[9px] uppercase font-bold text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-0.5 rounded">
                  {srv.category}
                </span>
                <span className="font-display font-black text-sm text-indigo-600">₹{srv.price}</span>
              </div>
              <h3 className="font-extrabold text-xs text-ink mt-2">{srv.name}</h3>
              <p className="text-[10px] text-ink-soft line-clamp-2 mt-1">{srv.description}</p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-black/5">
              <span className="text-[10px] font-bold text-ink-muted">Duration: {srv.duration} mins</span>
              <button
                onClick={() => handleDelete(srv.id)}
                className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-black/10 shadow-2xl">
            <h3 className="font-display font-black text-base text-ink">Add Service Package</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Haircut & Wash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Category Group</label>
                <input
                  type="text"
                  placeholder="e.g. Haircut, Grooming, Wash"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-55 dark:bg-zinc-800 text-ink outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Service Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Detailed haircutting by expert styler followed by relaxing wash..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-ink-soft"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={adding}>
                  {adding ? "Adding..." : "Add Package"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
