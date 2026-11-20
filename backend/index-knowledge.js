import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.join(__dirname, "knowledge");
const OUTPUT_FILE = path.join(KNOWLEDGE_DIR, "vector_index.json");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set in .env. Indexing will generate stub embeddings.");
}

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Clean text for chunking
function chunkMarkdown(filename, content) {
  const categoryMap = {
    "services.md": "services",
    "home-services.md": "home-services",
    "shop-services.md": "shop-services",
    "salon-token.md": "salon-token",
    "booking.md": "booking",
    "workers.md": "workers",
    "payments.md": "payments",
    "cancellation.md": "cancellation",
    "safety.md": "safety",
    "faq.md": "faq",
  };

  const category = categoryMap[filename] || "general";
  const lines = content.split("\n");
  const chunks = [];
  let currentTitle = filename.replace(".md", "").replace("-", " ").toUpperCase();
  let currentHeader = "";
  let currentBuffer = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      currentTitle = line.replace("# ", "").trim();
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      if (currentBuffer.length > 0) {
        const text = currentBuffer.join("\n").trim();
        if (text.length > 30) {
          chunks.push({
            id: `${filename}-${chunks.length + 1}`,
            source: filename,
            title: currentHeader ? `${currentTitle} - ${currentHeader}` : currentTitle,
            category,
            content: text,
          });
        }
        currentBuffer = [];
      }
      currentHeader = line.replace(/^#+\s*/, "").trim();
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    const text = currentBuffer.join("\n").trim();
    if (text.length > 30) {
      chunks.push({
        id: `${filename}-${chunks.length + 1}`,
        source: filename,
        title: currentHeader ? `${currentTitle} - ${currentHeader}` : currentTitle,
        category,
        content: text,
      });
    }
  }

  return chunks;
}

async function getEmbedding(text) {
  if (!genAI) {
    // Deterministic stub vector for development without API key
    return new Array(768).fill(0).map((_, i) => Math.sin(i + text.length));
  }

  try {
    const response = await genAI.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    
    if (response?.embedding?.values) {
      return response.embedding.values;
    }
    if (response?.values) {
      return response.values;
    }
    throw new Error("Invalid embedding response format");
  } catch (err) {
    console.error(`Embedding error with text-embedding-004, trying embedding-001 fallback:`, err?.message || err);
    try {
      const responseFallback = await genAI.models.embedContent({
        model: "embedding-001",
        contents: text,
      });
      return responseFallback?.embedding?.values || responseFallback?.values || new Array(768).fill(0.1);
    } catch (fallbackErr) {
      console.error("Fallback embedding failed as well:", fallbackErr?.message || fallbackErr);
      return new Array(768).fill(0.1);
    }
  }
}

async function runIndexer() {
  console.log("🚀 Starting PickPal Knowledge Base Indexer...");
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error("❌ Knowledge directory does not exist:", KNOWLEDGE_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
  console.log(`📚 Found ${files.length} knowledge markdown files.`);

  let allChunks = [];
  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const fileChunks = chunkMarkdown(file, content);
    console.log(`  📄 ${file}: generated ${fileChunks.length} text chunks.`);
    allChunks.push(...fileChunks);
  }

  console.log(`\n🧠 Generating embeddings for ${allChunks.length} chunks via Gemini...`);
  const vectorStore = [];

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    process.stdout.write(`  [${i + 1}/${allChunks.length}] Embedding ${chunk.source} (${chunk.title})... `);
    const embedding = await getEmbedding(chunk.content);
    vectorStore.push({
      ...chunk,
      embedding,
    });
    console.log("✓ Done");
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(vectorStore, null, 2), "utf-8");
  console.log(`\n✅ Vector index saved successfully to ${OUTPUT_FILE}`);
  console.log(`📊 Total Indexed Chunks: ${vectorStore.length}`);
}

runIndexer().catch((err) => {
  console.error("❌ Indexing failed:", err);
  process.exit(1);
});
