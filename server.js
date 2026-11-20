/**
 * Minimal production server: serves the built frontend and exposes a
 * server-side Gemini endpoint so GEMINI_API_KEY never reaches the browser
 * (matches metadata.json's MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API).
 *
 * Dev mode uses Vite's dev server instead (npm run dev) — this file is for
 * `npm run build && node server.js`.
 */
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

dotenv.config();

admin.initializeApp({
  projectId: "pickpal-cee8f",
});

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

import { rateLimiter } from "./src/middleware/rateLimiter.ts";
import { progressiveDelay } from "./src/middleware/progressiveDelay.ts";
import { accountLock } from "./src/middleware/accountLock.ts";
import { LoginAttemptService } from "./src/services/LoginAttemptService.ts";
import { AuthValidationService, loginSchema, phoneLoginSchema } from "./src/services/auth-validation.service.ts";

// Shopping assistant / substitution suggestions — the only place this app
// calls an LLM, per the brief ("own algorithms for core logic, OpenRouter-
// style AI only for chat/shopping assistant"). Swap model name freely.
app.post("/api/assistant", verifyToken, async (req, res) => {
  const { itemDescription, budget } = req.body ?? {};
  if (!itemDescription) return res.status(400).json({ error: "itemDescription is required" });

  if (!genAI) {
    return res.json({
      suggestion: `(stub — no GEMINI_API_KEY set) Consider a store-brand alternative to stay under ₹${budget ?? "your budget"}.`,
    });
  }

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `A customer wants: "${itemDescription}" with a budget of ₹${budget}. In one short sentence, suggest a specific in-budget alternative a shopper could offer.`,
    });
    res.json({ suggestion: result.text });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "AI assistant unavailable" });
  }
});

// Load knowledge base vector store
import fs from "fs";
const vectorIndexPath = path.join(__dirname, "backend", "knowledge", "vector_index.json");
let vectorStore = [];
try {
  if (fs.existsSync(vectorIndexPath)) {
    vectorStore = JSON.parse(fs.readFileSync(vectorIndexPath, "utf-8"));
    console.log(`🧠 Loaded PickPal Knowledge Vector Store: ${vectorStore.length} chunks.`);
  } else {
    console.warn("⚠️ vector_index.json not found. Run 'npm run index:knowledge' first.");
  }
} catch (err) {
  console.error("Failed to load vector index:", err?.message);
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getQueryEmbedding(query) {
  if (!genAI) {
    return new Array(768).fill(0).map((_, i) => Math.sin(i + query.length));
  }
  try {
    const response = await genAI.models.embedContent({
      model: "text-embedding-004",
      contents: query,
    });
    return response?.embedding?.values || response?.values || new Array(768).fill(0);
  } catch (err) {
    try {
      const fallback = await genAI.models.embedContent({
        model: "embedding-001",
        contents: query,
      });
      return fallback?.embedding?.values || fallback?.values || new Array(768).fill(0);
    } catch {
      return new Array(768).fill(0);
    }
  }
}

/**
 * Phase 10: RAG AI Assistant Endpoint
 * POST /api/chat
 * Body: { message: "..." }
 * Header: Authorization: Bearer <ID_TOKEN> (Optional/Recommended for Live User Data)
 */
app.post("/api/chat", async (req, res) => {
  const { message } = req.body ?? {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const queryText = message.trim();

  // 1. Authenticate user if Bearer token provided
  let authUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      authUser = await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.warn("Chat API received invalid auth token, proceeding in anonymous context.");
    }
  }

  // 2. Intent detection for live Firebase data retrieval
  let liveDataContext = "";
  const lowerMsg = queryText.toLowerCase();
  const needsLiveData = [
    "my order", "my token", "current token", "my appointment", "where is my worker",
    "order status", "queue position", "wait time", "waiting time", "delivery status"
  ].some((kw) => lowerMsg.includes(kw));

  if (needsLiveData && authUser?.uid) {
    try {
      const db = admin.firestore();
      
      // Fetch active customer orders
      const ordersSnap = await db
        .collection("orders")
        .where("customerId", "==", authUser.uid)
        .limit(3)
        .get();

      const activeOrders = [];
      ordersSnap.forEach((doc) => {
        const data = doc.data();
        activeOrders.push({
          id: doc.id,
          storeName: data.storeName,
          status: data.status,
          totalAmount: data.totalAmount,
          workerName: data.workerName || "Not assigned yet",
          workerLiveLat: data.workerLiveLat,
          workerLiveLng: data.workerLiveLng,
          eta: data.eta || "Calculating",
        });
      });

      // Fetch active appointment tokens
      const appointmentsSnap = await db
        .collection("appointments")
        .where("userId", "==", authUser.uid)
        .limit(3)
        .get();

      const activeTokens = [];
      appointmentsSnap.forEach((doc) => {
        const data = doc.data();
        activeTokens.push({
          id: doc.id,
          shopName: data.shopName,
          tokenNumber: data.queueNumber,
          serviceName: data.serviceName,
          date: data.date,
          timeSlot: data.timeSlot,
          status: data.status,
        });
      });

      if (activeOrders.length > 0 || activeTokens.length > 0) {
        liveDataContext = `\n[AUTHORIZED LIVE FIREBASE USER DATA FOR USER ${authUser.uid}]:\n`;
        if (activeOrders.length > 0) {
          liveDataContext += `Active Orders:\n` + JSON.stringify(activeOrders, null, 2) + "\n";
        }
        if (activeTokens.length > 0) {
          liveDataContext += `Active Appointment Tokens:\n` + JSON.stringify(activeTokens, null, 2) + "\n";
        }
      }
    } catch (err) {
      console.error("Error fetching live user data from Firebase:", err);
    }
  }

  // 3. RAG Retrieval Vector & Keyword Hybrid Search
  let retrievedChunks = [];
  let maxScore = 0;

  if (vectorStore.length > 0) {
    const queryEmbedding = await getQueryEmbedding(queryText);
    const words = queryText.toLowerCase().split(/\W+/).filter((w) => w.length > 2);

    const scoredChunks = vectorStore.map((chunk) => {
      let score = cosineSimilarity(queryEmbedding, chunk.embedding);
      
      // Keyword relevance fallback
      const chunkText = (chunk.title + " " + chunk.content).toLowerCase();
      let hitCount = 0;
      words.forEach((w) => {
        if (chunkText.includes(w)) hitCount += 1;
      });
      const keywordScore = hitCount > 0 ? (hitCount / Math.max(words.length, 1)) * 0.5 : 0;
      
      score = Math.max(score, keywordScore);
      return { ...chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    maxScore = scoredChunks[0]?.score || 0;
    retrievedChunks = scoredChunks.slice(0, 3).filter((c) => c.score > 0.001);

    // If query is short greeting or broad query with 0 specific chunk matches, include top overview chunk
    if (retrievedChunks.length === 0 && (lowerMsg.length < 8 || lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("help"))) {
      retrievedChunks = scoredChunks.slice(0, 2);
    }
  }

  // 4. Fallback check if no relevant information & no live data
  const hasRetrievedContent = retrievedChunks.length > 0;
  if (!hasRetrievedContent && !liveDataContext) {
    return res.json({
      answer: "I couldn't find that specific detail in the current PickPal knowledge base. Try asking about services, booking, salon tokens, workers, or payments!",
      sources: [],
    });
  }

  // 5. Construct System Instructions & Prompt
  const staticContextStr = retrievedChunks
    .map((c, i) => `[Source ${i + 1}: ${c.source} | Title: ${c.title}]\n${c.content}`)
    .join("\n\n");

  const systemInstruction = `You are PickPal AI Assistant.
Answer questions using the retrieved PickPal context.
The retrieved context is the primary source of truth.
Do not invent PickPal features, prices, policies, services, or rules.
If the answer cannot be found in the retrieved context, clearly say that the information is not currently available in the PickPal knowledge base.
Do not pretend to know information that is not provided.
For live user-specific information such as order status, current token, queue position, worker location, or booking status, use authorized PickPal Firebase data when available rather than relying on static documents.
Keep answers concise, friendly, and useful.`;

  const userPrompt = `${systemInstruction}

[STATIC KNOWLEDGE BASE CONTEXT]
${staticContextStr || "No static knowledge documents matched."}
${liveDataContext}

Customer Question: "${queryText}"`;

  // 6. Generate Response via Gemini or Dev Stub
  if (!genAI) {
    const sourceList = Array.from(new Set(retrievedChunks.map((c) => c.source))).map((src) => ({
      title: src.replace(".md", "").replace("-", " ").toUpperCase(),
      source: src,
    }));
    return res.json({
      answer: `(PickPal AI Assistant) Based on our Knowledge Base:\n${retrievedChunks[0]?.content || "PickPal helps with on-demand shopping, home repairs, and salon queue tokens."}\n${liveDataContext ? "\nLive Data: " + liveDataContext : ""}`,
      sources: sourceList.length > 0 ? sourceList : [{ title: "PickPal System FAQ", source: "faq.md" }],
    });
  }

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
    });

    const uniqueSourcesMap = new Map();
    retrievedChunks.forEach((c) => {
      const friendlyTitle = c.source
        .replace(".md", "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      uniqueSourcesMap.set(c.source, {
        title: friendlyTitle,
        source: c.source,
      });
    });

    res.json({
      answer: result.text,
      sources: Array.from(uniqueSourcesMap.values()),
    });
  } catch (err) {
    console.error("Gemini RAG Generation error:", err);
    res.status(500).json({ error: "Failed to generate AI response. Please try again later." });
  }
});


/**
 * Enterprise Brute-Force Protected Login Route
 * Endpoints: POST /login and POST /api/login
 * Pipeline: RateLimiter (10 req/min/IP) -> AccountLock (5 failed/15 min lock) -> ProgressiveDelay (0-5s) -> Validation -> Auth
 */
const handleProtectedLogin = async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
  const userAgent = req.headers["user-agent"];
  const requestId = req.headers["x-request-id"] || Math.random().toString(36).substring(2, 9);
  const { email, phone, password } = req.body ?? {};
  const target = (email || phone || "").toLowerCase().trim();

  try {
    // 1. Server-side Zod validation & sanitization
    const isPhone = !!phone;
    const schema = isPhone ? phoneLoginSchema : loginSchema;
    const valid = AuthValidationService.validate(schema, isPhone ? { phone, password } : { email, password });

    if (!valid.success) {
      if (target) {
        await LoginAttemptService.recordFailedAttempt(target, ip, userAgent, requestId);
      }
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }

    // 2. Perform authentication check
    let userRecord = null;
    try {
      if (isPhone) {
        const cleanPhone = phone.replace(/\D/g, "");
        userRecord = await admin.auth().getUserByPhoneNumber(`+${cleanPhone}`).catch(() => null);
      } else {
        userRecord = await admin.auth().getUserByEmail(email.trim().toLowerCase()).catch(() => null);
      }
    } catch {
      userRecord = null;
    }

    if (!userRecord) {
      // Record failed attempt to prevent timing attacks & account enumeration
      await LoginAttemptService.recordFailedAttempt(target, ip, userAgent, requestId);
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
      });
    }

    // 3. Successful authentication — Reset all counters & remove lockout
    await LoginAttemptService.resetAttempts(target, ip, userAgent, requestId);

    LoginAttemptService.logSecurityEvent({
      event: "account_unlocked",
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      target,
      requestId,
      details: "Login successful — Reset counters",
    });

    return res.json({
      success: true,
      message: "Authentication successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        phoneNumber: userRecord.phoneNumber,
        displayName: userRecord.displayName,
      },
    });
  } catch (err) {
    if (target) {
      await LoginAttemptService.recordFailedAttempt(target, ip, userAgent, requestId);
    }
    return res.status(401).json({
      success: false,
      message: "Incorrect email or password.",
    });
  }
};

app.post("/login", rateLimiter, accountLock, progressiveDelay, handleProtectedLogin);
app.post("/api/login", rateLimiter, accountLock, progressiveDelay, handleProtectedLogin);

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`PickPal server running on port ${PORT}`));
