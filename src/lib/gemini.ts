import { GoogleGenerativeAI } from "@google/generative-ai";

import { EXTRACTION_PROMPT, SUMMARY_PROMPT } from "./prompts";
import { matchSummarySchema } from "./validators/extraction";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  // Surfaced lazily when an AI feature is actually used.
  console.warn("GOOGLE_API_KEY is not set — AI extraction will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

export const EMBEDDING_DIMENSION = 768; // gemini-embedding-001 (truncated)

const EXTRACTION_MODEL = "gemini-2.5-flash";
const EMBEDDING_MODEL = "gemini-embedding-001";

// Cap input so we stay within token limits and keep latency reasonable.
const MAX_EXTRACTION_CHARS = 30_000;
const MAX_EMBEDDING_CHARS = 8_000;

export async function extractResumeData(resumeText: string): Promise<unknown> {
  const model = genAI.getGenerativeModel({
    model: EXTRACTION_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const prompt = EXTRACTION_PROMPT.replace(
    "{resumeText}",
    resumeText.slice(0, MAX_EXTRACTION_CHARS),
  );

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini returned non-JSON output");
  }
}

export async function generateMatchSummary(input: {
  jobTitle: string;
  requiredSkills: string[];
  minExperience: number | null;
  candidateName: string;
  currentTitle: string | null;
  yearsExperience: number | null;
  candidateSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: EXTRACTION_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const prompt = SUMMARY_PROMPT.replace("{jobTitle}", input.jobTitle)
    .replace("{requiredSkills}", input.requiredSkills.join(", ") || "none")
    .replace("{minExperience}", String(input.minExperience ?? 0))
    .replace("{candidateName}", input.candidateName)
    .replace("{currentTitle}", input.currentTitle ?? "Unknown")
    .replace("{yearsExperience}", String(input.yearsExperience ?? 0))
    .replace("{candidateSkills}", input.candidateSkills.join(", ") || "none")
    .replace("{matchedSkills}", input.matchedSkills.join(", ") || "none")
    .replace("{missingSkills}", input.missingSkills.join(", ") || "none");

  const result = await model.generateContent(prompt);
  const parsed = matchSummarySchema.parse(JSON.parse(result.response.text()));
  return JSON.stringify(parsed);
}

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  // outputDimensionality is supported by the API but missing from the SDK's
  // request type, so we build the request as a variable to pass it through.
  const request = {
    content: {
      role: "user",
      parts: [{ text: text.slice(0, MAX_EMBEDDING_CHARS) }],
    },
    outputDimensionality: EMBEDDING_DIMENSION,
  };
  const result = await model.embedContent(request);
  return result.embedding.values;
}
