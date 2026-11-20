import { FirebaseService } from "./firebase.service";

export class LocationService {
  /**
   * Reverse geocodes lat/lng into a human-readable area name.
   * Tries Nominatim OSM -> BigDataCloud -> Coordinate fallback.
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<string> {
    // 1. Try Nominatim OpenStreetMap
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "PickPalApp/1.0 (contact@pickpal.app)",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.address) {
          const addr = data.address;
          const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.road;
          const city = addr.city || addr.town || addr.municipality || addr.state_district || addr.county;
          if (neighborhood && city) {
            return `${neighborhood}, ${city}`;
          }
          if (city) return `${city}`;
        }
        if (data?.display_name) {
          const parts = data.display_name.split(",").map((p: string) => p.trim());
          return parts.slice(0, 2).join(", ");
        }
      }
    } catch {
      // Ignore
    }

    // 2. Fallback to free BigDataCloud reverse geocode API
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.city || data.principalSubdivision;
        const region = data.principalSubdivision || data.countryName;
        if (locality && region) {
          return `${locality}, ${region}`;
        }
      }
    } catch {
      // Ignore
    }

    return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
  }

  /**
   * Gets current user coordinates with fast HTML5 Geolocation, IP fallback, or Default fallback.
   */
  public static getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve) => {
      let resolved = false;

      // Timer safety: If browser location takes > 3.5s (prompt waiting or slow GPS), fallback automatically
      const fallbackTimer = setTimeout(async () => {
        if (!resolved) {
          const ipCoords = await LocationService.getIpCoordinates();
          if (!resolved) {
            resolved = true;
            resolve(ipCoords);
          }
        }
      }, 3500);

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(fallbackTimer);
              resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }
          },
          async () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(fallbackTimer);
              const ipCoords = await LocationService.getIpCoordinates();
              resolve(ipCoords);
            }
          },
          { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
        );
      } else {
        clearTimeout(fallbackTimer);
        LocationService.getIpCoordinates().then((coords) => resolve(coords));
      }
    });
  }

  /**
   * Fast IP-based geolocation fallback using public APIs
   */
  private static async getIpCoordinates(): Promise<{ lat: number; lng: number }> {
    try {
      const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data?.latitude && data?.longitude) {
          return { lat: data.latitude, lng: data.longitude };
        }
      }
    } catch {
      // Ignore
    }

    try {
      const res = await fetch("https://freeipapi.com/api/json", { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data?.latitude && data?.longitude) {
          return { lat: data.latitude, lng: data.longitude };
        }
      }
    } catch {
      // Ignore
    }

    // Default Bengaluru Koramangala coordinates
    return { lat: 12.9352, lng: 77.6245 };
  }

  public static async updateUserLocation(userId: string, lat: number, lng: number, area: string): Promise<void> {
    await FirebaseService.setDocument("users", userId, { lat, lng, area });
  }
}
