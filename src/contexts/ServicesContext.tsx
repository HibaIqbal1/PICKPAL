import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { MarketplaceServiceDoc, ServiceDef } from "../types";
import { CatalogService } from "../services/catalog.service";
import { ALL_170_SERVICES } from "../data/seedServices";

interface ServicesContextValue {
  docs: MarketplaceServiceDoc[];
  services: ServiceDef[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const ServicesContext = createContext<ServicesContextValue | null>(null);

function areDocsEqual(prev: MarketplaceServiceDoc[], next: MarketplaceServiceDoc[]): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id) return false;
    if (prev[i].updatedAt !== next[i].updatedAt) return false;
    if (prev[i].active !== next[i].active) return false;
  }
  return true;
}

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [docs, setDocs] = useState<MarketplaceServiceDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    let isMounted = true;

    try {
      unsub = CatalogService.subscribeActiveServices(
        (fetchedDocs) => {
          if (!isMounted) return;

          const validatedDocs = fetchedDocs.map((d) => ({
            ...d,
            category: (d.category || "Miscellaneous").trim(),
            active: d.active ?? true,
            title: d.title || d.name || "Untitled Service",
            name: d.name || d.title || "Untitled Service",
            image: d.image || d.imageUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
            imageUrl: d.imageUrl || d.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
            price: d.price ?? d.startingPrice ?? 199,
            startingPrice: d.startingPrice ?? d.price ?? 199,
          }));

          setDocs((prevDocs) => {
            if (areDocsEqual(prevDocs, validatedDocs)) {
              return prevDocs;
            }
            return validatedDocs;
          });

          setError(null);
          setLoading(false);
        },
        (err) => {
          if (!isMounted) return;
          console.error("Firestore Services Context Subscription Error:", err);
          setError(err.message || "Failed to load services");
          setDocs((prev) => (prev.length > 0 ? prev : ALL_170_SERVICES));
          setLoading(false);
        }
      );
    } catch (err: any) {
      if (isMounted) {
        console.error("Setup Error in ServicesContext:", err);
        setError(err.message || "Failed to initialize services");
        setDocs((prev) => (prev.length > 0 ? prev : ALL_170_SERVICES));
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const services = useMemo(() => {
    const activeDocs = docs.length > 0 ? docs : ALL_170_SERVICES;
    return activeDocs.map((doc) => CatalogService.toServiceDef(doc));
  }, [docs]);

  const refetch = useCallback(() => {
    // Keep existing docs while loading
    setLoading(true);
  }, []);

  const value = useMemo(
    () => ({
      docs: docs.length > 0 ? docs : ALL_170_SERVICES,
      services,
      loading,
      error,
      refetch,
    }),
    [docs, services, loading, error, refetch]
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): ServicesContextValue {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
}
