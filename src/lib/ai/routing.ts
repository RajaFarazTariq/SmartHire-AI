import type { AITask, AIProvider, ProviderId } from "./types";
import { getProvider } from "./registry";
import { PROVIDER_ORDER } from "./config";

// Per-task overrides are optional. By default every task uses the centralized
// global priority (PROVIDER_ORDER, env-configurable via AI_PROVIDER_ORDER), so
// the configured order — OpenAI → Gemini → Groq — applies everywhere. Providers
// without a configured key are filtered out by the service.
const TASK_OVERRIDES: Partial<Record<AITask, ProviderId[]>> = {};

export function routeProviders(task: AITask): AIProvider[] {
  const order = TASK_OVERRIDES[task] ?? PROVIDER_ORDER;
  return order.map(getProvider).filter((p): p is AIProvider => Boolean(p));
}
