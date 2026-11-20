import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryGrid } from "../../components/shared/CategoryGrid";
import { PageContainer, SectionCard } from "../../components/ui/PageContainer";
import { CATEGORIES_LIST } from "../../data/seedServices";
import { useServices } from "../../contexts/ServicesContext";
import { getServiceType } from "../../types";

export default function CustomerCategories() {
  const navigate = useNavigate();
  const { docs } = useServices();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(docs.map((s) => (s.category || "Miscellaneous").trim()))).sort();
    return cats.length > 0 ? cats : CATEGORIES_LIST;
  }, [docs]);

  const categoriesToDisplay = selectedCategory === "All" ? dynamicCategories : [selectedCategory];

  return (
    <PageContainer
      title="Browse All 170+ Services"
      subtitle="Select a category to explore professional doorstep services and quick commerce options near you"
    >
      <div className="space-y-6">
        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === "All"
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "bg-gray-100 dark:bg-zinc-800 text-ink-soft dark:text-zinc-300 hover:bg-gray-200"
            }`}
          >
            All Categories ({docs.length})
          </button>
          {dynamicCategories.map((cat) => {
            const count = docs.filter((s) => (s.category || "").trim() === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "bg-gray-100 dark:bg-zinc-800 text-ink-soft dark:text-zinc-300 hover:bg-gray-200"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Display selected category or list all */}
        {categoriesToDisplay.map((cat) => (
          <SectionCard key={cat} title={cat}>
            <div className="pt-2">
              <CategoryGrid
                category={cat}
                onSelect={(s) => {
                  const type = getServiceType(s.key, s.category || "");
                  if (type === "VISIT_SHOP") {
                    navigate("/customer/shops", { state: { service: s } });
                  } else {
                    navigate(`/customer/service/${s.key}`, { state: { service: s } });
                  }
                }}
              />
            </div>
          </SectionCard>
        ))}
      </div>
    </PageContainer>
  );
}
