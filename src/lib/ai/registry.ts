import type { AIProvider, ProviderId } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { ClaudeProvider } from "./providers/claude";
import { GroqProvider } from "./providers/groq";

export const ALL_PROVIDERS: AIProvider[] = [
  GeminiProvider,
  OpenAIProvider,
  ClaudeProvider,
  GroqProvider,
];

const BY_ID = new Map<ProviderId, AIProvider>(
  ALL_PROVIDERS.map((p) => [p.id, p]),
);

export function getProvider(id: ProviderId): AIProvider | undefined {
  return BY_ID.get(id);
}

/** Providers that have an API key configured (others are simply skipped). */
export function configuredProviders(): AIProvider[] {
  return ALL_PROVIDERS.filter((p) => p.isConfigured());
}
