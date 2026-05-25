import { geminiClient } from "./ai/providers/gemini";

// Embeddings stay Gemini-specific (used for Pinecone vector search). Text
// generation now goes through the multi-provider layer in src/lib/ai.

export const EMBEDDING_DIMENSION = 768; // gemini-embedding-001 (truncated)

const EMBEDDING_MODEL = "gemini-embedding-001";
const MAX_EMBEDDING_CHARS = 8_000;

function isTransient(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("timeout") ||
    msg.includes("fetch failed")
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransient(err)) break;
      await new Promise((r) => setTimeout(r, 600 * 2 ** attempt));
    }
  }
  throw lastErr;
}

export async function embedText(text: string): Promise<number[]> {
  const model = geminiClient.getGenerativeModel({ model: EMBEDDING_MODEL });
  // outputDimensionality is supported by the API but missing from the SDK's
  // request type, so we build the request as a variable to pass it through.
  const request = {
    content: {
      role: "user",
      parts: [{ text: text.slice(0, MAX_EMBEDDING_CHARS) }],
    },
    outputDimensionality: EMBEDDING_DIMENSION,
  };
  const result = await withRetry(() => model.embedContent(request));
  return result.embedding.values;
}
