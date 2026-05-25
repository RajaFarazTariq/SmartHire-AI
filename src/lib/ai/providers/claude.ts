import type { AIProvider } from "../types";
import { MODELS } from "../config";

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = MODELS.claude;

export const ClaudeProvider: AIProvider = {
  id: "claude",
  label: "Anthropic Claude",
  isConfigured: () => Boolean(KEY),
  async generate(req) {
    // Anthropic has no JSON response mode; the prompt instructs JSON output.
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: req.maxTokens ?? 1500,
        temperature: req.temperature ?? 0.3,
        ...(req.system ? { system: req.system } : {}),
        messages: [{ role: "user", content: req.prompt }],
      }),
      signal: req.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`Claude ${res.status}: ${body.slice(0, 200)}`);
      (err as { status?: number }).status = res.status;
      throw err;
    }

    const data = await res.json();
    const text = Array.isArray(data.content)
      ? data.content
          .map((c: { text?: string }) => c.text ?? "")
          .join("")
      : "";
    return {
      text,
      model: MODEL,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
          }
        : undefined,
    };
  },
};
