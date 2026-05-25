import type {
  AIGenerateOptions,
  AIGenerateResult,
  AIProvider,
} from "./types";
import {
  AIServiceError,
  classifyError,
  friendlyMessage,
  isRetryableSameProvider,
  type AIErrorKind,
} from "./errors";
import { getProvider } from "./registry";
import { routeProviders } from "./routing";
import { recordSuccess, recordFailure, isInCooldown } from "./usage";

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS_PER_PROVIDER = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Races a provider call against a timeout. On timeout we abort the request
 * (cancels fetch-based providers) and reject so the service fails over.
 */
async function callWithTimeout(
  provider: AIProvider,
  opts: AIGenerateOptions,
  timeoutMs: number,
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const e = new Error("AI request timed out");
      (e as { status?: number }).status = 408;
      reject(e);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      provider.generate({
        system: opts.system,
        prompt: opts.prompt,
        json: opts.json,
        temperature: opts.temperature,
        maxTokens: opts.maxTokens,
        signal: controller.signal,
      }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const aiService = {
  /**
   * Generate text/JSON with automatic provider routing + failover.
   * Tries each configured provider in task-preference order; on rate limit,
   * quota, timeout, overload, or any failure it moves to the next provider.
   */
  async generate(opts: AIGenerateOptions): Promise<AIGenerateResult> {
    const task = opts.task ?? "general";
    const ordered = (
      opts.providers
        ? opts.providers
            .map(getProvider)
            .filter((p): p is AIProvider => Boolean(p))
        : routeProviders(task)
    ).filter((p) => p.isConfigured());

    if (ordered.length === 0) {
      throw new AIServiceError(
        "failure",
        "No AI providers are configured. Set GOOGLE_API_KEY (and optionally OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY).",
      );
    }

    // Prefer providers not in cooldown; fall back to all if every one is cooling.
    const live = ordered.filter((p) => !isInCooldown(p.id));
    const candidates = live.length ? live : ordered;

    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let lastKind: AIErrorKind = "failure";
    let lastMessage = "";

    for (const provider of candidates) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PROVIDER; attempt++) {
        try {
          const res = await callWithTimeout(provider, opts, timeoutMs);
          recordSuccess(provider.id, res.usage);
          return {
            text: res.text,
            provider: provider.id,
            model: res.model,
            usage: res.usage,
          };
        } catch (err) {
          const kind = classifyError(err);
          lastKind = kind;
          lastMessage = err instanceof Error ? err.message : String(err);
          recordFailure(provider.id, kind, lastMessage);

          // Briefly retry the SAME provider only for transient overload/timeout.
          if (isRetryableSameProvider(kind) && attempt < MAX_ATTEMPTS_PER_PROVIDER) {
            await sleep(400 * attempt);
            continue;
          }
          break; // fail over to the next provider
        }
      }
    }

    throw new AIServiceError(
      lastKind,
      `${friendlyMessage(lastKind)} (last error: ${lastMessage.slice(0, 160)})`,
    );
  },
};
