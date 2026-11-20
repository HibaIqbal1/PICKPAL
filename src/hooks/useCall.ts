import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended" | "error";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

interface UseCallArgs {
  orderId: string | undefined;
  peerId: string | undefined;
  currentUserId: string | undefined;
}

/**
 * Real WebRTC audio call between worker and customer, with signaling relayed
 * through a single Firestore doc at calls/{orderId}. Uses public STUN only —
 * for locked/symmetric NATs in production you'd add a TURN server here.
 */
export function useCall({ orderId, peerId, currentUserId }: UseCallArgs) {
  const [state, setState] = useState<CallState>("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSetRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const processedIceRef = useRef<Set<string>>(new Set());
  const callDocRef = useRef(orderId ? doc(db, "calls", orderId) : null);

  // Stable ref to "am I the caller" for use inside the pc callback.
  const isCallerRef = useRef(false);
  useEffect(() => { isCallerRef.current = false; }, []);

  const makePc = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.ontrack = (e) => setRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
    pc.onicecandidate = (e) => {
      if (!e.candidate || !orderId) return;
      const payload = JSON.stringify(e.candidate.toJSON());
      // Append to the shared signaling doc's ice array (don't overwrite).
      updateDoc(doc(db, "calls", orderId), {
        ice: arrayUnion({ from: isCallerRef.current ? "caller" : "callee", candidate: payload }),
      }).catch(() => {});
    };
    pcRef.current = pc;
    return pc;
  }, [orderId]);

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of pendingIceRef.current) {
      try { await pc.addIceCandidate(c); } catch {}
    }
    pendingIceRef.current = [];
  }, []);

  const applyIce = useCallback((candidates: { from: string; candidate: string }[]) => {
    const pc = pcRef.current;
    if (!pc) return;
    candidates
      .filter((c) => c.from !== (isCallerRef.current ? "caller" : "callee"))
      .forEach((c) => {
        if (processedIceRef.current.has(c.candidate)) return;
        processedIceRef.current.add(c.candidate);
        const init = JSON.parse(c.candidate) as RTCIceCandidateInit;
        if (remoteSetRef.current) pc.addIceCandidate(init).catch(() => {});
        else pendingIceRef.current.push(init);
      });
  }, []);

  // Live signaling listener — reacts to answer (caller) and ICE (both sides).
  useEffect(() => {
    if (!orderId) return;
    callDocRef.current = doc(db, "calls", orderId);
    const unsub = onSnapshot(doc(db, "calls", orderId), async (snap) => {
      if (!snap.exists()) { setState((s) => (s === "connected" || s === "calling" ? s : "idle")); return; }
      const data = snap.data() as any;
      if (data.status === "ended") { setState("ended"); return; }

      if (data.callerId === currentUserId) {
        // We initiated: listen for the callee's answer.
        if (data.answer && !remoteSetRef.current && pcRef.current) {
          try {
            await pcRef.current.setRemoteDescription(data.answer);
            remoteSetRef.current = true;
            await flushPendingIce();
            setState("connected");
          } catch (e) { setError("Failed to connect call."); }
        }
      } else {
        // We are the callee: an incoming call is ringing — only show the
        // "ringing" state until we've answered (accept() sets "connected").
        if (data.status === "ringing") setState((s) => (s === "connected" || s === "ended" ? s : "ringing"));
      }
      if (data.ice) applyIce(data.ice);
    });
    return () => unsub();
  }, [orderId, flushPendingIce, applyIce]);

  const start = useCallback(async () => {
    if (!orderId || !peerId || !currentUserId) return;
    setError(null);
    isCallerRef.current = true;
    setState("calling");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = makePc();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setDoc(doc(db, "calls", orderId), {
        id: orderId,
        orderId,
        callerId: currentUserId,
        calleeId: peerId,
        status: "ringing",
        offer,
        answer: null,
        ice: [],
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message ?? "Could not start call (mic permission required).");
      setState("error");
    }
  }, [orderId, peerId, currentUserId, makePc]);

  const accept = useCallback(async () => {
    if (!orderId || !currentUserId || !callDocRef.current) return;
    setError(null);
    isCallerRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = makePc();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const snap = await new Promise<any>((resolve) => {
        const u = onSnapshot(callDocRef.current!, (s) => { u(); resolve(s.data()); });
      });
      if (!snap?.offer) return;
      await pc.setRemoteDescription(snap.offer);
      remoteSetRef.current = true;
      await flushPendingIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(doc(db, "calls", orderId), { answer, status: "connected" });
      setState("connected");
    } catch (e: any) {
      setError(e?.message ?? "Could not answer call (mic permission required).");
      setState("error");
    }
  }, [orderId, currentUserId, makePc, flushPendingIce]);

  const end = useCallback(async () => {
    try { if (orderId) await updateDoc(doc(db, "calls", orderId), { status: "ended" }); } catch {}
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    localStreamRef.current = null;
    setRemoteStream(null);
    remoteSetRef.current = false;
    pendingIceRef.current = [];
    processedIceRef.current = new Set();
    setState("ended");
  }, [orderId]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }, [muted]);

  // Cleanup on unmount.
  useEffect(() => () => {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { state, remoteStream, error, muted, start, accept, end, toggleMute };
}
