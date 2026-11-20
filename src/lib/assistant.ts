import { auth } from "./firebase";

/** Client-side call to the server's /api/assistant Gemini proxy (see server.js).
 *  In dev, Vite doesn't run server.js — see vite.config.ts proxy note in README
 *  for pointing /api at a locally running `node server.js` during development. */
export async function getSubstitutionSuggestion(itemDescription: string, budget: number): Promise<string> {
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : "";
    
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ itemDescription, budget }),
    });
    const data = await res.json();
    return data.suggestion ?? "No suggestion available.";
  } catch {
    return "AI assistant is unavailable right now.";
  }
}

