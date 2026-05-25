export type AIErrorKind =
  | "rate_limit"
  | "quota"
  | "timeout"
  | "auth"
  | "overloaded"
  | "failure";

/** Maps a raw provider error (+ optional HTTP status) to a normalized kind. */
export function classifyError(err: unknown, status?: number): AIErrorKind {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const code = status ?? (err as { status?: number })?.status ?? 0;

  if (code === 401 || code === 403 || msg.includes("api key") || msg.includes("unauthorized") || msg.includes("permission denied")) {
    return "auth";
  }
  if (msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("insufficient_quota") || msg.includes("billing")) {
    return "quota";
  }
  if (code === 429 || msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
    return "rate_limit";
  }
  if (code === 408 || msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted") || msg.includes("etimedout")) {
    return "timeout";
  }
  if (code === 503 || code === 500 || code === 502 || msg.includes("overloaded") || msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("fetch failed")) {
    return "overloaded";
  }
  return "failure";
}

/** Should the SAME provider be retried, or should we fail over to the next one? */
export function isRetryableSameProvider(kind: AIErrorKind): boolean {
  return kind === "overloaded" || kind === "timeout";
}

export class AIServiceError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.name = "AIServiceError";
    this.kind = kind;
  }
}

// User-facing copy. Includes keywords ("rate limit", "quota", "overloaded",
// "timed out") so callers that pattern-match the message keep working.
export function friendlyMessage(kind: AIErrorKind): string {
  switch (kind) {
    case "rate_limit":
    case "quota":
      return "The AI rate limit/quota was reached across all available providers. Please try again shortly.";
    case "timeout":
      return "The AI request timed out across all providers. Please try again.";
    case "overloaded":
      return "The AI service is busy (overloaded) across all providers. Please try again.";
    case "auth":
      return "AI provider authentication failed — check the configured API keys.";
    default:
      return "The AI request failed across all providers. Please try again.";
  }
}
