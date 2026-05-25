import type { ProviderId, AIUsage } from "./types";
import type { AIErrorKind } from "./errors";

// In-memory usage + health tracking (per process, like the rate limiter). Good
// enough for routing/observability; swap for a shared store later if needed.

type ProviderHealth = {
  requests: number;
  successes: number;
  failures: number;
  promptTokens: number;
  completionTokens: number;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastErrorKind?: AIErrorKind;
  lastError?: string;
  lastUsedAt?: number;
};

const COOLDOWN_MS: Partial<Record<AIErrorKind, number>> = {
  rate_limit: 60_000,
  quota: 5 * 60_000,
  auth: 10 * 60_000,
};

const health = new Map<string, ProviderHealth>();

function ensure(id: ProviderId): ProviderHealth {
  let h = health.get(id);
  if (!h) {
    h = {
      requests: 0,
      successes: 0,
      failures: 0,
      promptTokens: 0,
      completionTokens: 0,
      consecutiveFailures: 0,
      cooldownUntil: 0,
    };
    health.set(id, h);
  }
  return h;
}

export function recordSuccess(id: ProviderId, usage?: AIUsage) {
  const h = ensure(id);
  h.requests += 1;
  h.successes += 1;
  h.consecutiveFailures = 0;
  h.cooldownUntil = 0;
  h.lastUsedAt = Date.now();
  if (usage?.promptTokens) h.promptTokens += usage.promptTokens;
  if (usage?.completionTokens) h.completionTokens += usage.completionTokens;
}

export function recordFailure(
  id: ProviderId,
  kind: AIErrorKind,
  message: string,
) {
  const h = ensure(id);
  h.requests += 1;
  h.failures += 1;
  h.consecutiveFailures += 1;
  h.lastErrorKind = kind;
  h.lastError = message.slice(0, 200);
  h.lastUsedAt = Date.now();
  const cooldown = COOLDOWN_MS[kind];
  if (cooldown) h.cooldownUntil = Date.now() + cooldown;
  console.warn(`[ai] ${id} failed (${kind}): ${h.lastError}`);
}

export function isInCooldown(id: ProviderId): boolean {
  const h = health.get(id);
  return Boolean(h && h.cooldownUntil > Date.now());
}

/** Snapshot for observability / a future admin panel. */
export function getAIUsage() {
  return Object.fromEntries(
    [...health.entries()].map(([id, h]) => [
      id,
      {
        ...h,
        inCooldown: h.cooldownUntil > Date.now(),
        successRate:
          h.requests > 0 ? Math.round((h.successes / h.requests) * 100) : null,
      },
    ]),
  );
}
