import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Search, Check, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { MarketplaceServiceDoc } from "../../types";
import { CatalogService } from "../../services/catalog.service";
import { CITIES, CATEGORIES_LIST } from "../../data/seedServices";
import { Button } from "../ui/Button";

export function ServiceManagementPanel() {
  const [services, setServices] = useState<MarketplaceServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [editingService, setEditingService] = useState<Partial<MarketplaceServiceDoc> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = CatalogService.subscribeAllServices((items) => {
      setServices(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingService({
      id: "",
      name: "",
      slug: "",
      category: CATEGORIES_LIST[0],
      subCategory: "General",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
      icon: "sparkles",
      estimatedTime: "45 mins",
      startingPrice: 199,
      rating: 4.8,
      totalBookings: 0,
      active: true,
      featured: false,
      cityAvailability: CITIES,
      workerRequired: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service: MarketplaceServiceDoc) => {
    setEditingService({ ...service });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name) return;
    setSaving(true);
    try {
      const slug = editingService.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const docData: MarketplaceServiceDoc = {
        id: editingService.id || slug,
        name: editingService.name,
        slug,
        category: editingService.category || "Miscellaneous",
        subCategory: editingService.subCategory || "General",
        description: editingService.description || "",
        imageUrl: editingService.imageUrl || "",
        bannerUrl: editingService.bannerUrl || editingService.imageUrl || "",
        icon: editingService.icon || "tool",
        estimatedTime: editingService.estimatedTime || "45 mins",
        startingPrice: Number(editingService.startingPrice) || 199,
        rating: Number(editingService.rating) || 4.8,
        totalBookings: Number(editingService.totalBookings) || 0,
        active: editingService.active ?? true,
        featured: editingService.featured ?? false,
        cityAvailability: editingService.cityAvailability || CITIES,
        workerRequired: editingService.workerRequired ?? true,
      };

      if (editingService.id) {
        await CatalogService.updateService(editingService.id, docData);
      } else {
        await CatalogService.addService(docData);
      }
      setIsModalOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await CatalogService.deleteService(id);
    }
  };

  const toggleCity = (city: string) => {
    if (!editingService) return;
    const current = editingService.cityAvailability || [];
    const next = current.includes(city)
      ? current.filter((c) => c !== city)
      : [...current, city];
    setEditingService({ ...editingService, cityAvailability: next });
  };

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCat === "All" || s.category === selectedCat;
    const matchQ =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-black/10 dark:border-white/10 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-extrabold text-ink dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="text-brand-500" size={20} />
            Service Catalog Management ({services.length} Total)
          </h2>
          <p className="text-xs text-ink-soft dark:text-zinc-400 mt-0.5">
            Add, update, disable, and manage 170+ services in real-time without code changes
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all shrink-0"
        >
          <Plus size={16} /> Add New Service
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, category, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-4 py-2.5 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 text-ink dark:text-zinc-200 outline-none font-semibold"
        >
          <option value="All">All Categories ({services.length})</option>
          {CATEGORIES_LIST.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto border border-black/5 dark:border-white/5 rounded-2xl max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 sticky top-0 font-bold text-ink-soft dark:text-zinc-400 border-b border-black/5">
            <tr>
              <th className="p-3">Service</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Est. Time</th>
              <th className="p-3">Cities</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {filteredServices.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="p-3 font-semibold text-ink dark:text-zinc-100 flex items-center gap-3 min-w-[200px]">
                  <img src={s.imageUrl} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0 bg-gray-100" />
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-[10px] text-ink-soft dark:text-zinc-400 font-mono">id: {s.id}</p>
                  </div>
                </td>
                <td className="p-3 font-medium text-ink-soft dark:text-zinc-300">
                  <span className="bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">{s.category}</span>
                </td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">₹{s.startingPrice}</td>
                <td className="p-3 text-ink-soft dark:text-zinc-400 font-medium">{s.estimatedTime}</td>
                <td className="p-3 text-[10px] text-ink-soft dark:text-zinc-400">
                  {s.cityAvailability?.length || 0} cities
                </td>
                <td className="p-3">
                  <button
                    onClick={() => CatalogService.toggleFeatured(s.id, !s.featured)}
                    className={`p-1.5 rounded-xl border transition-colors ${
                      s.featured
                        ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 text-amber-500"
                        : "bg-gray-50 dark:bg-zinc-800 border-black/5 text-gray-400"
                    }`}
                  >
                    <Star size={14} className={s.featured ? "fill-amber-500" : ""} />
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => CatalogService.toggleActive(s.id, !s.active)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                      s.active
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 text-emerald-600"
                        : "bg-red-50 dark:bg-red-500/10 border-red-200 text-red-500"
                    }`}
                  >
                    {s.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="p-3 text-right space-x-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-ink dark:text-zinc-200 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Add Service Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto border border-black/10 dark:border-white/10 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
              <h3 className="font-display font-bold text-base text-ink dark:text-zinc-100">
                {editingService.id ? `Edit Service: ${editingService.name}` : "Add New Service"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g. Solar Panel Cleaning"
                  className="w-full px-3.5 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Category</label>
                  <select
                    value={editingService.category || CATEGORIES_LIST[0]}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none font-semibold"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Sub-Category</label>
                  <input
                    type="text"
                    value={editingService.subCategory || ""}
                    onChange={(e) => setEditingService({ ...editingService, subCategory: e.target.value })}
                    placeholder="General"
                    className="w-full px-3.5 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Starting Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingService.startingPrice ?? 199}
                    onChange={(e) => setEditingService({ ...editingService, startingPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Estimated Time</label>
                  <input
                    type="text"
                    value={editingService.estimatedTime || "45 mins"}
                    onChange={(e) => setEditingService({ ...editingService, estimatedTime: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Image URL (1024x1024 WebP)</label>
                <input
                  type="url"
                  required
                  value={editingService.imageUrl || ""}
                  onChange={(e) => setEditingService({ ...editingService, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-soft dark:text-zinc-400 block mb-1">City Availability</label>
                <div className="flex flex-wrap gap-1.5">
                  {CITIES.map((city) => {
                    const active = editingService.cityAvailability?.includes(city);
                    return (
                      <button
                        type="button"
                        key={city}
                        onClick={() => toggleCity(city)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          active
                            ? "bg-brand-500 text-white border-brand-500"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-500 border-black/5"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-ink dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={editingService.featured ?? false}
                    onChange={(e) => setEditingService({ ...editingService, featured: e.target.checked })}
                    className="rounded text-brand-500"
                  />
                  Mark Featured
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-ink dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={editingService.active ?? true}
                    onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                    className="rounded text-brand-500"
                  />
                  Active Service
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-ink-soft"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Service"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
