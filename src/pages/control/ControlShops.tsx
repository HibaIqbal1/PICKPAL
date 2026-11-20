import React, { useState, useEffect } from "react";
import { Store, Plus, Search, MapPin, Clock, Phone, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { ControlService } from "../../services/control.service";
import { ShopDoc } from "../../types";

const SHOP_CATEGORIES = [
  "Salon",
  "Barber",
  "Spa",
  "Clinic",
  "Dental Clinic",
  "Mechanic",
  "Garage",
  "Laundry",
  "Gym",
  "Pet Grooming",
  "Tattoo Studio",
  "Service Center",
];

export default function ControlShops() {
  const { profile } = useAuth();
  const [shops, setShops] = useState<ShopDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState<Partial<ShopDoc> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<ShopDoc>("shops", [], (items) => {
      setShops(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredShops = shops.filter((s) => {
    const query = searchTerm.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(query) ||
      (s.category || "").toLowerCase().includes(query) ||
      (s.address || "").toLowerCase().includes(query)
    );
  });

  const handleOpenAddModal = () => {
    setEditingShop({
      name: "",
      category: "Salon",
      address: "",
      phone: "",
      openingTime: "09:00",
      closingTime: "20:00",
      status: "active",
      services: ["Standard Haircut", "Beard Trim"],
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (shop: ShopDoc) => {
    setEditingShop({ ...shop });
    setShowModal(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !profile) return;
    setSaving(true);
    try {
      await ControlService.saveShop(editingShop, profile.id);
      setShowModal(false);
      setEditingShop(null);
      alert("Shop saved successfully.");
    } catch (err: any) {
      console.error("Save shop error:", err);
      alert("Failed to save shop: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (shop: ShopDoc) => {
    if (!profile) return;
    const newStatus = shop.status === "active" ? "inactive" : "active";
    try {
      await ControlService.saveShop({ ...shop, status: newStatus }, profile.id);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <ControlLayout
      title="Shop & Location Management"
      subtitle="Register partner shops, salons, clinics, business service hours, and queue parameters"
      action={
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-lg flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} /> Add New Shop
        </button>
      }
    >
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by shop name, category or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Registered Shops: <strong className="text-white font-extrabold">{shops.length}</strong>
        </div>
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading shop directory...</div>
      ) : filteredShops.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Store size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No shops registered yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click <strong>Add New Shop</strong> to add partner salons, barbers, clinics, or mechanic garages to the PickPal Smart Queue system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-600/10 border border-brand-500/30 text-brand-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                      <Store size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">{shop.name}</h4>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {shop.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(shop)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${
                      shop.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-700 text-slate-400 border-slate-600"
                    }`}
                  >
                    {shop.status === "active" ? "Active" : "Inactive"}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{shop.address || "Location set"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">
                      Hours: {shop.openingTime || "09:00"} - {shop.closingTime || "20:00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={13} className="text-slate-500 shrink-0" />
                    <span className="truncate">{shop.phone || "No phone listed"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(shop)}
                  className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 size={13} /> Edit Shop
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Shop Modal */}
      {showModal && editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingShop.id ? "Edit Shop Details" : "Add New Shop"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Shop Name</label>
                <input
                  required
                  placeholder="e.g. Premium Cuts Salon"
                  value={editingShop.name || ""}
                  onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Category</label>
                  <select
                    value={editingShop.category || "Salon"}
                    onChange={(e) => setEditingShop({ ...editingShop, category: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  >
                    {SHOP_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Phone</label>
                  <input
                    placeholder="+91 9876543210"
                    value={editingShop.phone || ""}
                    onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Address</label>
                <input
                  required
                  placeholder="Full physical street address & locality"
                  value={editingShop.address || ""}
                  onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Opening Time</label>
                  <input
                    type="time"
                    value={editingShop.openingTime || "09:00"}
                    onChange={(e) => setEditingShop({ ...editingShop, openingTime: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Closing Time</label>
                  <input
                    type="time"
                    value={editingShop.closingTime || "20:00"}
                    onChange={(e) => setEditingShop({ ...editingShop, closingTime: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white shadow-md"
                >
                  {saving ? "Saving..." : "Save Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
