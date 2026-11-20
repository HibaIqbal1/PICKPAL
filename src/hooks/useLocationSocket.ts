import { useEffect, useRef, useState, useCallback } from "react";

// ─── Configuration ───────────────────────────────────────────────────────────

const WS_BASE_URL = (import.meta as any).env?.VITE_WS_URL || "ws://localhost:8000";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000]; // Exponential back-off ceiling at 15s
const HEARTBEAT_INTERVAL = 25_000; // Keep-alive ping every 25s

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocationUpdate {
  type: "location_update";
  worker_id: string;
  order_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

// ─── Internal reconnecting socket engine ─────────────────────────────────────

interface UseReconnectingWsOptions {
  url: string;
  enabled: boolean;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

function useReconnectingWs({ url, enabled, onMessage, onOpen, onClose }: UseReconnectingWsOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    unmountedRef.current = true;
    clearHeartbeat();
    clearReconnectTimer();
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, [clearHeartbeat, clearReconnectTimer]);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;
    clearReconnectTimer();
    clearHeartbeat();

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
    }

    setStatus(retriesRef.current === 0 ? "connecting" : "reconnecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) return;
      retriesRef.current = 0;
      setStatus("connected");
      onOpen?.();

      // Start heartbeat to keep connection alive through proxies/firewalls
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (event) => {
      if (unmountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch {
        // Ignore non-JSON messages (e.g. pong)
      }
    };

    ws.onerror = () => {
      // Error triggers close, reconnection handled there
    };

    ws.onclose = () => {
      if (unmountedRef.current) return;
      clearHeartbeat();
      onClose?.();

      // Schedule reconnection with exponential back-off
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)];
      retriesRef.current += 1;
      setStatus("reconnecting");

      reconnectTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current) {
          connect();
        }
      }, delay);
    };
  }, [url, onMessage, onOpen, onClose, clearHeartbeat, clearReconnectTimer]);

  useEffect(() => {
    unmountedRef.current = false;
    if (enabled) {
      retriesRef.current = 0;
      connect();
    }
    return () => {
      close();
    };
  }, [url, enabled]); // Reconnect when url or enabled changes

  const sendJson = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { status, sendJson, close };
}

import { auth } from "../lib/firebase";

// ─── Customer Hook: Subscribe to worker location updates ─────────────────────

/**
 * Connects the customer to `WS /ws/track/{orderId}` and streams incoming
 * worker location updates. Automatically reconnects with exponential back-off.
 *
 * @example
 * const { location, status } = useLocationStream(orderId);
 * // location?.latitude, location?.longitude
 */
export function useLocationStream(orderId: string | undefined) {
  const [location, setLocation] = useState<LocationUpdate | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(setToken);
    }
  }, [orderId]);

  const enabled = !!orderId && !!token;
  const url = `${WS_BASE_URL}/ws/track/${orderId ?? ""}?token=${token ?? ""}`;

  const onMessage = useCallback((data: any) => {
    if (data?.type === "location_update") {
      setLocation(data as LocationUpdate);
    }
  }, []);

  const { status } = useReconnectingWs({ url, enabled, onMessage });

  return { location, status };
}

// ─── Worker Hook: Broadcast GPS coordinates ──────────────────────────────────

/**
 * Connects the worker to `WS /ws/worker/{workerId}/order/{orderId}` and
 * provides a `broadcast(lat, lng)` function. Also listens for any server
 * echo/coordination messages. Reconnects automatically.
 *
 * @example
 * const { broadcast, status } = useLocationBroadcast(workerId, orderId);
 * broadcast(12.9716, 77.5946);
 */
export function useLocationBroadcast(workerId: string | undefined, orderId: string | undefined) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(setToken);
    }
  }, [workerId, orderId]);

  const enabled = !!workerId && !!orderId && !!token;
  const url = `${WS_BASE_URL}/ws/worker/${workerId ?? ""}/order/${orderId ?? ""}?token=${token ?? ""}`;

  const { status, sendJson } = useReconnectingWs({ url, enabled });

  const broadcast = useCallback(
    (latitude: number, longitude: number) => {
      sendJson({ latitude, longitude });
    },
    [sendJson],
  );

  return { broadcast, status };
}

