import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Distinct, branded map markers using inline SVG icons
const homeIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px;background:#E8236B;border-radius:9999px;border:2px solid #fff;box-shadow:0 1.5px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;align-items:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const storeIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:24px;height:24px;background:#1D6FE0;border-radius:9999px;border:2px solid #fff;box-shadow:0 1.5px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const workerIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:28px;height:28px;">
    <span style="position:absolute;inset:0;border-radius:9999px;background:#14A866;opacity:.3;animation:pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;"></span>
    <div style="position:absolute;inset:4px;border-radius:9999px;background:#14A866;border:2px solid #fff;box-shadow:0 1.5px 5px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="10" r="3"/>
        <path d="M12 21.7c-3.1-4-6-7.5-6-10.7 0-3.9 3.1-7 6-7s6 3.1 6 7c0 3.2-2.9 6.7-6 10.7z"/>
      </svg>
    </div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Add css pulse keyframes dynamically if not present
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes pulse-ring {
      0% { transform: scale(0.65); opacity: 0; }
      50% { opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/** Interpolates marker position over a set duration for smooth translation. */
function SmoothMarker({
  position,
  icon,
  children,
  duration = 1000,
}: {
  position: [number, number];
  icon?: any;
  children?: React.ReactNode;
  duration?: number;
}) {
  const [renderPos, setRenderPos] = useState<[number, number]>(position);
  const prevPosRef = useRef<[number, number]>(position);
  const targetPosRef = useRef<[number, number]>(position);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      position[0] !== targetPosRef.current[0] ||
      position[1] !== targetPosRef.current[1]
    ) {
      prevPosRef.current = renderPos;
      targetPosRef.current = position;
      startTimeRef.current = null;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic ease-out interpolation
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const lat =
          prevPosRef.current[0] +
          (targetPosRef.current[0] - prevPosRef.current[0]) * easeProgress;
        const lng =
          prevPosRef.current[1] +
          (targetPosRef.current[1] - prevPosRef.current[1]) * easeProgress;

        setRenderPos([lat, lng]);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }
  }, [position, duration]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <Marker position={renderPos} icon={icon}>
      {children}
    </Marker>
  );
}

/** Keep the map bounds fitted to contain all active markers dynamically. */
function FitMapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const valid = positions.filter((p) => p && p[0] != null && p[1] != null);
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [positions, map]);
  return null;
}

/**
 * LiveMap showing customer, worker, and store on Leaflet OpenStreetMap canvas.
 */
export function LiveMap({
  customerPos, workerPos, storePos, height = "100%", showRoute = true,
}: {
  customerPos: [number, number];
  workerPos?: [number, number] | null;
  storePos?: [number, number] | null;
  height?: number | string;
  showRoute?: boolean;
}) {
  const allPositions: [number, number][] = [customerPos];
  if (workerPos) allPositions.push(workerPos);
  if (storePos) allPositions.push(storePos);

  const routePoints: [number, number][] = [];
  if (showRoute) {
    if (workerPos) routePoints.push(workerPos);
    if (storePos) routePoints.push(storePos);
    routePoints.push(customerPos);
  }

  return (
    <div className="rounded-3xl overflow-hidden border border-black/10 shadow-inner relative" style={{ height }}>
      <MapContainer center={customerPos} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Customer Pin */}
        <Marker position={customerPos} icon={homeIcon}>
          <Popup>Your Location</Popup>
        </Marker>

        {/* Store Pin */}
        {storePos && (
          <Marker position={storePos} icon={storeIcon}>
            <Popup>Store Location</Popup>
          </Marker>
        )}

        {/* Smoothly Interpolating Worker Pin */}
        {workerPos && (
          <SmoothMarker position={workerPos} icon={workerIcon} duration={1200}>
            <Popup>Worker Location</Popup>
          </SmoothMarker>
        )}

        {/* Route Line */}
        {showRoute && routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color="#E8236B"
            weight={3}
            opacity={0.6}
            dashArray="8, 8"
          />
        )}

        {/* Bound Adjuster */}
        <FitMapBounds positions={allPositions} />
      </MapContainer>
    </div>
  );
}
