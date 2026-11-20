import { where, Unsubscribe, doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { MarketplaceServiceDoc, ServiceDef } from "../types";
import { FirebaseService } from "./firebase.service";
import { ALL_170_SERVICES } from "../data/seedServices";
import { db } from "../lib/firebase";

export class CatalogService {
  private static isSeeding = false;

  /**
   * Real-time subscription to active marketplace services in Firestore.
   */
  public static subscribeActiveServices(
    onUpdate: (services: MarketplaceServiceDoc[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    console.log('[CatalogService] Subscribing to "services" collection where active == true');

    return FirebaseService.subscribeQuery<MarketplaceServiceDoc>(
      "services",
      [where("active", "==", true)],
      (items) => {
        console.log(`[CatalogService] Received ${items.length} active service(s) from Firestore.`);
        if (items.length < 10) {
          console.warn(`[CatalogService] Firestore has ${items.length} services (< 10). Serving complete fallback dataset.`);
          onUpdate(ALL_170_SERVICES.filter((s) => s.active !== false));
        } else {
          onUpdate(items);
        }
      },
      (err) => {
        console.error("[CatalogService] Error in subscribeActiveServices:", err);
        // Fallback to local 170+ services on network/Firestore error so app keeps working
        onUpdate(ALL_170_SERVICES.filter((s) => s.active !== false));
        if (onError) onError(err);
      }
    );
  }

  /**
   * Real-time subscription to ALL services (Active & Inactive) for Admin panel.
   */
  public static subscribeAllServices(
    onUpdate: (services: MarketplaceServiceDoc[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    console.log('[CatalogService] Subscribing to all services in "services" collection for Admin');

    return FirebaseService.subscribeQuery<MarketplaceServiceDoc>(
      "services",
      [],
      (items) => {
        console.log(`[CatalogService] Admin query returned ${items.length} service(s).`);
        if (items.length < 10) {
          onUpdate(ALL_170_SERVICES);
        } else {
          onUpdate(items);
        }
      },
      (err) => {
        console.error("[CatalogService] Error in subscribeAllServices:", err);
        onUpdate(ALL_170_SERVICES);
        if (onError) onError(err);
      }
    );
  }

  /**
   * Add a new service document to Firestore (Admin operation)
   */
  public static async addService(serviceData: Omit<MarketplaceServiceDoc, "createdAt" | "updatedAt">): Promise<void> {
    const id = serviceData.id || serviceData.slug || "srv_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const docData: MarketplaceServiceDoc = {
      ...serviceData,
      id,
      slug: serviceData.slug || id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "services", id), docData);
  }

  /**
   * Update an existing service in Firestore (Admin operation)
   */
  public static async updateService(id: string, updates: Partial<MarketplaceServiceDoc>): Promise<void> {
    await updateDoc(doc(db, "services", id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete a service document from Firestore (Admin operation)
   */
  public static async deleteService(id: string): Promise<void> {
    await deleteDoc(doc(db, "services", id));
  }

  /**
   * Toggle Active / Inactive status of a service (Admin operation)
   */
  public static async toggleActive(id: string, active: boolean): Promise<void> {
    await this.updateService(id, { active });
  }

  /**
   * Toggle Featured status of a service (Admin operation)
   */
  public static async toggleFeatured(id: string, featured: boolean): Promise<void> {
    await this.updateService(id, { featured });
  }

  /**
   * High-performance batch database seeder for 170+ services into Firestore
   */
  public static async seedServicesDatabase(): Promise<void> {
    console.log(`[CatalogService] Seeding ${ALL_170_SERVICES.length} services into Firestore using writeBatch...`);
    const batchSize = 40;
    for (let i = 0; i < ALL_170_SERVICES.length; i += batchSize) {
      const chunk = ALL_170_SERVICES.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const service of chunk) {
        const ref = doc(db, "services", service.id);
        batch.set(ref, service, { merge: true });
      }
      await batch.commit();
      console.log(`[CatalogService] Seeded batch ${i / batchSize + 1} (${chunk.length} services)`);
    }
    console.log("[CatalogService] Successfully seeded all 170+ services into Firestore!");
  }

  /**
   * Convert MarketplaceServiceDoc to legacy ServiceDef for UI components
   */
  public static toServiceDef(doc: MarketplaceServiceDoc): ServiceDef {
    const groupMapping: Record<string, "home" | "shopping" | "pickup" | "personal"> = {
      "Home Cleaning": "home",
      "Repairs": "home",
      "Appliance Repair": "home",
      "Home Improvement": "home",
      "Delivery": "shopping",
      "Courier": "pickup",
      "Moving": "pickup",
      "Beauty": "personal",
      "Lifestyle": "personal",
    };

    return {
      key: doc.id,
      label: doc.name,
      category: (doc.category.toLowerCase().replace(/[^a-z0-9]/g, "_") as any) || "other",
      group: groupMapping[doc.category] || "home",
      image: doc.imageUrl,
      description: doc.description,
      startingPrice: doc.startingPrice,
      estimatedTime: doc.estimatedTime,
      rating: doc.rating,
      cityAvailability: doc.cityAvailability,
    };
  }
}
