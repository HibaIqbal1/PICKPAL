import React, { useMemo } from "react";
import {
  Shirt, Sparkles, Gem, ShoppingBag, Utensils, Heart, Coffee, Package,
  Store, Gift, Truck, Globe, AlertCircle, RefreshCw
} from "lucide-react";
import { ServiceDef } from "../../types";
import { useServices } from "../../contexts/ServicesContext";
import { Skeleton } from "../ui/Skeleton";
import { ServiceCard } from "./ServiceCard";

const ICONS: Record<string, any> = {
  mysore_silk: Shirt, banarasi_saree: Sparkles, kanchipuram_silk: Gem,
  kolhapuri_chappal: ShoppingBag, chikankari: Shirt, nandini_ghee: Utensils,
  mysore_pak: Heart, karachi_bakery: Coffee, spices_tea: Package, regional_snacks: Gift,
  commercial_street: Store, chandni_chowk: Store, charminar_bazaar: Store, devaraja_market: Store,
  channapatna_toys: Gift, tanjore_paintings: Gem, brassware: Sparkles, nri_gift_hampers: Package,
  local_proxy: Truck, interstate_proxy: Truck, international_proxy: Globe
};

const GROUP_TINTS: Record<string, { bg: string; fg: string; shadow: string }> = {
  silk_textiles:     { bg: "#FFE1EC", fg: "#D01260", shadow: "rgba(208,18,96,.25)" },
  regional_sweets:   { bg: "#DFF6EA", fg: "#14A866", shadow: "rgba(20,168,102,.25)" },
  local_markets:     { bg: "#E1EEFF", fg: "#1D6FE0", shadow: "rgba(29,111,224,.25)" },
  handicrafts_gifts: { bg: "#FFF3D6", fg: "#D9871A", shadow: "rgba(217,135,26,.25)" },
};

interface CategoryGridProps {
  group?: ServiceDef["group"];
  category?: string;
  searchQuery?: string;
  limit?: number;
  onSelect: (s: ServiceDef) => void;
}

export const CategoryGrid = React.memo<CategoryGridProps>(function CategoryGrid({
  group,
  category,
  searchQuery,
  limit,
  onSelect,
}) {
  const { services, docs, loading, error, refetch } = useServices();

  const categoryName = category ? category.trim() : "All";

  // Memoize filtered services list to prevent unnecessary computations on re-render
  const filteredServices = useMemo(() => {
    let result = services;

    if (group) {
      result = result.filter((s) => s.group === group);
    }

    if (category) {
      const targetCat = categoryName.toLowerCase();
      result = result.filter((s) => {
        const origDoc = docs.find((d) => d.id === s.key);
        const docCat = origDoc?.category ? origDoc.category.trim().toLowerCase() : "";
        return docCat === targetCat;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const matchLabel = s.label.toLowerCase().includes(q);
        const matchCategory = s.category.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        return matchLabel || matchCategory || matchDesc;
      });
    }

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [services, docs, group, categoryName, searchQuery, limit]);

  // 1. Loading State (Only if initial load has no services)
  if (loading && services.length === 0) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-x-3 gap-y-5">
        {Array.from({ length: limit || 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error && services.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-red-200 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/10 text-center space-y-3">
        <AlertCircle size={24} className="mx-auto text-red-500" />
        <div>
          <p className="text-xs font-bold text-red-600 dark:text-red-400">Unable to load services</p>
          <p className="text-[11px] text-red-500/80 mt-0.5">{error}</p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-sm"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (filteredServices.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-800/30 text-center space-y-3">
        <Sparkles size={24} className="mx-auto text-gray-400 dark:text-zinc-500" />
        <div>
          <p className="text-xs font-bold text-ink dark:text-zinc-300">No services available</p>
          <p className="text-[11px] text-ink-soft dark:text-zinc-500 mt-0.5">
            {searchQuery ? `No matches found for "${searchQuery}"` : `No active services found for ${categoryName}.`}
          </p>
        </div>
      </div>
    );
  }

  // 4. Data State
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-x-3 gap-y-5 select-none">
      {filteredServices.map((s) => {
        const Icon = ICONS[s.key] ?? Sparkles;
        const tint = GROUP_TINTS[s.group] || GROUP_TINTS.home;

        return (
          <ServiceCard
            key={s.key}
            service={s}
            icon={Icon}
            tint={tint}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
});
