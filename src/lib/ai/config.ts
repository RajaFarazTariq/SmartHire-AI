import type { ProviderId } from "./types";

// Centralized AI configuration. Provider priority and model names are all
// environment-driven so you can tune them without touching code.

const VALID: ProviderId[] = ["openai", "gemini", "groq", "claude"];

// Global fallback order. Default matches the available free-tier keys:
//   OpenAI → Gemini → Groq  (Claude last; only used if ANTHROPIC_API_KEY is set).
// Override with e.g. AI_PROVIDER_ORDER="gemini,groq,openai".
const DEFAULT_ORDER: ProviderId[] = ["openai", "gemini", "groq", "claude"];

function parseOrder(raw: string | undefined): ProviderId[] | null {
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ProviderId => (VALID as string[]).includes(s));
  const deduped = [...new Set(ids)];
  // Always keep every valid provider present (configured ones get used, others
  // are filtered out at runtime) so adding a key later "just works".
  for (const id of DEFAULT_ORDER) if (!deduped.includes(id)) deduped.push(id);
  return deduped.length ? deduped : null;
}

export const PROVIDER_ORDER: ProviderId[] =
  parseOrder(process.env.AI_PROVIDER_ORDER) ?? DEFAULT_ORDER;

// Per-provider model names (environment-overridable).
export const MODELS: Record<ProviderId, string> = {
  gemini: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  openai: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  groq: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  claude: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
};
