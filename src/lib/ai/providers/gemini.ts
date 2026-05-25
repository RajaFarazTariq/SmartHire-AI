import { GoogleGenerativeAI } from "@google/generative-ai";

import type { AIProvider } from "../types";
import { MODELS } from "../config";

const KEY = process.env.GOOGLE_API_KEY;
const MODEL = MODELS.gemini;

// Shared client, also reused for embeddings (see src/lib/gemini.ts).
export const geminiClient = new GoogleGenerativeAI(KEY ?? "");

export const GeminiProvider: AIProvider = {
  id: "gemini",
  label: "Google Gemini",
  isConfigured: () => Boolean(KEY),
  async generate(req) {
    const model = geminiClient.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: req.json ? "application/json" : undefined,
        temperature: req.temperature ?? 0.3,
        maxOutputTokens: req.maxTokens,
      },
    });
    const prompt = req.system ? `${req.system}\n\n${req.prompt}` : req.prompt;
    const result = await model.generateContent(prompt);
    const um = result.response.usageMetadata;
    return {
      text: result.response.text(),
      model: MODEL,
      usage: um
        ? {
            promptTokens: um.promptTokenCount,
            completionTokens: um.candidatesTokenCount,
          }
        : undefined,
    };
  },
};
