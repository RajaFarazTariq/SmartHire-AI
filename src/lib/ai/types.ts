// Centralized AI provider abstraction. Components/pages and domain code never
// call a provider SDK directly — everything goes through `aiService.generate()`.

export type ProviderId = "gemini" | "openai" | "claude" | "groq";

// Task categories drive intelligent routing (which provider is tried first).
export type AITask =
  | "resume_parsing"
  | "summary"
  | "reasoning"
  | "fast"
  | "general";

export type AIUsage = {
  promptTokens?: number;
  completionTokens?: number;
};

export type AIGenerateOptions = {
  task?: AITask;
  system?: string;
  prompt: string;
  /** Ask the provider for strict JSON output where supported. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Force a provider order, overriding task-based routing. */
  providers?: ProviderId[];
};

export type AIGenerateResult = {
  text: string;
  provider: ProviderId;
  model: string;
  usage?: AIUsage;
};

export type ProviderRequest = {
  system?: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type ProviderResponse = {
  text: string;
  model: string;
  usage?: AIUsage;
};

export interface AIProvider {
  id: ProviderId;
  label: string;
  /** True only when the provider's API key is present in the environment. */
  isConfigured(): boolean;
  generate(req: ProviderRequest): Promise<ProviderResponse>;
}
