import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Star, ToggleLeft, ToggleRight, Trash2, ArrowLeft } from "lucide-react";
import { StaffMember, Shop } from "../../types/shop";
import { ShopService } from "../../services/shop.service";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";

export default function ShopStaff() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [shop, setShop] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80");
  const [experience, setExperience] = useState("3 Years");
  const [rating, setRating] = useState("4.8");
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
    const unsubStaff = ShopService.subscribeStaff(shop.id, (data) => {
      setStaff(data);
      setLoading(false);
    });
    return () => unsubStaff();
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || adding) return;

    if (!name.trim()) return;

    setAdding(true);
    try {
      await ShopService.addStaff({
        shopId: shop.id,
        name,
        photoUrl,
        experience,
        rating: Number(rating) || 4.8,
        isAvailable: true,
      });

      setName("");
      setIsAddOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add employee.");
    } finally {
      setAdding(false);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await ShopService.updateStaffAvailability(id, !current);
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
          <Users size={22} className="text-brand-500" />
          <h1 className="text-xl font-display font-extrabold text-ink">Manage Employee Staff ({staff.length})</h1>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1 shadow-md shadow-brand-500/10"
        >
          <Plus size={15} /> Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map((st) => (
          <div key={st.id} className="glass-card rounded-3xl p-5 border border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={st.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover bg-zinc-200" />
              <div>
                <h3 className="font-extrabold text-xs text-ink">{st.name}</h3>
                <p className="text-[10px] text-ink-soft">Exp: {st.experience}</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                  <Star size={10} className="fill-amber-500" />
                  {st.rating.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[9px] text-ink-soft">Availability</span>
                <button
                  onClick={() => toggleAvailability(st.id, st.isAvailable)}
                  className="text-brand-500 hover:scale-105 transition-transform"
                >
                  {st.isAvailable ? (
                    <ToggleRight size={26} className="text-emerald-500 fill-emerald-100 dark:fill-none" />
                  ) : (
                    <ToggleLeft size={26} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-black/10 shadow-2xl">
            <h3 className="font-display font-black text-base text-ink">Add Staff Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Photo URL</label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-gray-55 dark:bg-zinc-800 text-ink outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase block mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 bg-gray-50 dark:bg-zinc-800 text-ink outline-none"
                  />
                </div>
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
                  {adding ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
