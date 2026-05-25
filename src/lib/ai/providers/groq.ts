import type { AIProvider } from "../types";
import { MODELS } from "../config";

// Groq exposes an OpenAI-compatible API — same request/response shape.
const KEY = process.env.GROQ_API_KEY;
const MODEL = MODELS.groq;

export const GroqProvider: AIProvider = {
  id: "groq",
  label: "Groq",
  isConfigured: () => Boolean(KEY),
  async generate(req) {
    const messages = [
      ...(req.system ? [{ role: "system", content: req.system }] : []),
      { role: "user", content: req.prompt },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: req.temperature ?? 0.3,
        ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
        ...(req.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: req.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
      (err as { status?: number }).status = res.status;
      throw err;
    }

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      model: MODEL,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
          }
        : undefined,
    };
  },
};
