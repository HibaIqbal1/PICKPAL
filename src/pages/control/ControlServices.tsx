import React, { useState, useEffect } from "react";
import { Wrench, Plus, Search, Home, Store, Edit2, DollarSign, Clock, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { ControlLayout } from "../../components/control/ControlLayout";
import { useAuth } from "../../contexts/AuthContext";
import { FirebaseService } from "../../services/firebase.service";
import { MarketplaceServiceDoc, SERVICES } from "../../types";

export default function ControlServices() {
  const { profile } = useAuth();
  const [services, setServices] = useState<MarketplaceServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Partial<MarketplaceServiceDoc> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = FirebaseService.subscribeQuery<MarketplaceServiceDoc>("services", [], (items) => {
      if (items.length > 0) {
        setServices(items);
      } else {
        // Fallback mapper from system default catalog SERVICES
        const mapped: MarketplaceServiceDoc[] = SERVICES.map((s) => ({
          id: s.key,
          name: s.label,
          slug: s.key,
          category: s.category,
          subCategory: s.group,
          description: s.description || `${s.label} on-demand service`,
          imageUrl: s.image,
          bannerUrl: s.image,
          estimatedTime: s.estimatedTime || "45 Mins",
          startingPrice: s.startingPrice || 299,
          rating: s.rating || 4.8,
          totalBookings: 120,
          active: true,
          featured: false,
          cityAvailability: ["Bengaluru", "Mumbai", "Delhi"],
          workerRequired: true,
          type: s.type || (s.group === "personal" ? "VISIT_SHOP" : "HOME_SERVICE"),
        }));
        setServices(mapped);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredServices = services.filter((s) => {
    const query = searchTerm.toLowerCase();
    const matchesQuery =
      (s.name || "").toLowerCase().includes(query) ||
      (s.category || "").toLowerCase().includes(query) ||
      (s.description || "").toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (modeFilter === "home") {
      return s.type === "HOME_SERVICE";
    }
    if (modeFilter === "shop") {
      return s.type === "VISIT_SHOP";
    }

    return true;
  });

  const handleOpenAddModal = () => {
    setEditingService({
      name: "",
      slug: "",
      category: "Hardware",
      subCategory: "Home Services",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      estimatedTime: "45 Mins",
      startingPrice: 399,
      rating: 4.9,
      totalBookings: 0,
      active: true,
      featured: false,
      cityAvailability: ["Bengaluru"],
      workerRequired: true,
      type: "HOME_SERVICE",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (service: MarketplaceServiceDoc) => {
    setEditingService({ ...service });
    setShowModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !profile) return;
    setSaving(true);

    const id = editingService.id || editingService.slug || "service_" + Date.now();
    const payload: MarketplaceServiceDoc = {
      id,
      name: editingService.name || "New Service",
      slug: editingService.slug || id,
      category: editingService.category || "General",
      subCategory: editingService.subCategory || "General",
      description: editingService.description || "",
      imageUrl: editingService.imageUrl || "",
      bannerUrl: editingService.bannerUrl || editingService.imageUrl || "",
      estimatedTime: editingService.estimatedTime || "30 Mins",
      startingPrice: Number(editingService.startingPrice) || 199,
      rating: editingService.rating || 4.8,
      totalBookings: editingService.totalBookings || 0,
      active: editingService.active ?? true,
      featured: editingService.featured ?? false,
      cityAvailability: editingService.cityAvailability || ["Bengaluru"],
      workerRequired: editingService.workerRequired ?? true,
      type: editingService.type || "HOME_SERVICE",
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setDocument("services", id, payload);
      setShowModal(false);
      setEditingService(null);
      alert("Service catalog updated successfully.");
    } catch (err: any) {
      console.error("Save service error:", err);
      alert("Failed to save service: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: MarketplaceServiceDoc) => {
    try {
      await FirebaseService.updateDocument("services", service.id, {
        active: !service.active,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  return (
    <ControlLayout
      title="Service Catalog Management"
      subtitle="Manage Home Visit Services and Visit Shop Services starting prices, duration, and availability"
      action={
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white shadow-lg flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} /> Create Service
        </button>
      }
    >
      {/* Search & Mode Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search services by name, category or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>

        {/* Service Model Tabs */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[
            { id: "all", label: "All Services" },
            { id: "home", label: "Model A — Home Service", icon: Home },
            { id: "shop", label: "Model B — Shop Service", icon: Store },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setModeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                modeFilter === tab.id
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.icon && <tab.icon size={13} />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading catalog services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Wrench size={36} className="text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No services found</h3>
          <p className="text-xs text-slate-400">No services match the active filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const isHomeService = service.type === "HOME_SERVICE";

            return (
              <div
                key={service.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                {/* Service Card Image */}
                <div className="relative h-36 bg-slate-800 overflow-hidden">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <ImageIcon size={32} />
                    </div>
                  )}

                  {/* Service Mode Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                        isHomeService
                          ? "bg-indigo-500/80 text-white border-indigo-400/40"
                          : "bg-emerald-500/80 text-white border-emerald-400/40"
                      }`}
                    >
                      {isHomeService ? <Home size={12} /> : <Store size={12} />}
                      {isHomeService ? "Home Service" : "Visit Shop"}
                    </span>
                  </div>

                  {/* Active Toggle Badge */}
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-md ${
                      service.active
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : "bg-slate-900/90 text-slate-400 border-slate-700"
                    }`}
                  >
                    {service.active ? "Active" : "Disabled"}
                  </button>
                </div>

                {/* Service Info */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-white">{service.name}</h4>
                      <span className="text-xs font-mono font-extrabold text-emerald-400">
                        ₹{service.startingPrice}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{service.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Category: <strong className="text-slate-200">{service.category}</strong></span>
                      <span>Duration: <strong className="text-slate-200">{service.estimatedTime}</strong></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 size={13} /> Edit Service
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {showModal && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingService.id ? "Edit Service" : "Create New Service"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">
                  Service Model / Mode (Mandatory)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setEditingService({ ...editingService, type: "HOME_SERVICE" })}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition-all ${
                      editingService.type === "HOME_SERVICE"
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-800/40 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Home size={16} />
                    <span className="font-bold text-xs">Model A — Home Service</span>
                  </div>
                  <div
                    onClick={() => setEditingService({ ...editingService, type: "VISIT_SHOP" })}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2 transition-all ${
                      editingService.type === "VISIT_SHOP"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-800/40 border-slate-800 text-slate-400"
                    }`}
                  >
                    <Store size={16} />
                    <span className="font-bold text-xs">Model B — Visit Shop</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Service Name</label>
                <input
                  required
                  placeholder="e.g. AC Deep Cleaning"
                  value={editingService.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Category</label>
                  <input
                    required
                    placeholder="e.g. Hardware"
                    value={editingService.category || ""}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold uppercase text-slate-400 text-[10px]">Starting Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="299"
                    value={editingService.startingPrice || 0}
                    onChange={(e) =>
                      setEditingService({ ...editingService, startingPrice: Number(e.target.value) })
                    }
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe service features and coverage..."
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase text-slate-400 text-[10px]">Image URL</label>
                <input
                  placeholder="https://images.unsplash.com/..."
                  value={editingService.imageUrl || ""}
                  onChange={(e) => setEditingService({ ...editingService, imageUrl: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                />
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
                  {saving ? "Saving..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ControlLayout>
  );
}
