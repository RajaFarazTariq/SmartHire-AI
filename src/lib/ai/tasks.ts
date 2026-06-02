import { aiService } from "./service";
import {
  EXTRACTION_PROMPT,
  SUMMARY_PROMPT,
  INTERVIEW_QUESTIONS_PROMPT,
  PANEL_SUMMARY_PROMPT,
} from "@/lib/prompts";
import { matchSummarySchema } from "@/lib/validators/extraction";
import {
  interviewQuestionsSchema,
  panelSummarySchema,
  type InterviewQuestionsData,
  type PanelSummaryData,
} from "@/lib/validators/interview";

const MAX_EXTRACTION_CHARS = 30_000;

function parseJson(text: string): unknown {
  // Models occasionally wrap JSON in prose/code fences despite instructions.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Token cap hit mid-string → trim back to the last complete brace/bracket.
    const lastClose = Math.max(
      cleaned.lastIndexOf("}"),
      cleaned.lastIndexOf("]"),
    );
    if (lastClose > 0) {
      try {
        return JSON.parse(cleaned.slice(0, lastClose + 1));
      } catch {
        /* fall through to original error */
      }
    }
    throw err;
  }
}

export async function extractResumeData(resumeText: string): Promise<unknown> {
  const prompt = EXTRACTION_PROMPT.replace(
    "{resumeText}",
    resumeText.slice(0, MAX_EXTRACTION_CHARS),
  );
  const { text } = await aiService.generate({
    task: "resume_parsing",
    prompt,
    json: true,
    temperature: 0.1,
    maxTokens: 2048,
  });
  try {
    return parseJson(text);
  } catch {
    throw new Error("AI returned non-JSON output");
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
  const prompt = SUMMARY_PROMPT.replace("{jobTitle}", input.jobTitle)
    .replace("{requiredSkills}", input.requiredSkills.join(", ") || "none")
    .replace("{minExperience}", String(input.minExperience ?? 0))
    .replace("{candidateName}", input.candidateName)
    .replace("{currentTitle}", input.currentTitle ?? "Unknown")
    .replace("{yearsExperience}", String(input.yearsExperience ?? 0))
    .replace("{candidateSkills}", input.candidateSkills.join(", ") || "none")
    .replace("{matchedSkills}", input.matchedSkills.join(", ") || "none")
    .replace("{missingSkills}", input.missingSkills.join(", ") || "none");

  const { text } = await aiService.generate({
    task: "summary",
    prompt,
    json: true,
    temperature: 0.3,
    maxTokens: 600,
  });
  return JSON.stringify(matchSummarySchema.parse(parseJson(text)));
}

export async function generateInterviewQuestions(input: {
  interviewType: string;
  jobTitle: string;
  requiredSkills: string[];
  candidateName: string;
  currentTitle: string | null;
  candidateSkills: string[];
  missingSkills: string[];
}): Promise<InterviewQuestionsData> {
  const prompt = INTERVIEW_QUESTIONS_PROMPT.replace(
    /{interviewType}/g,
    input.interviewType,
  )
    .replace("{jobTitle}", input.jobTitle)
    .replace("{requiredSkills}", input.requiredSkills.join(", ") || "none")
    .replace("{candidateName}", input.candidateName)
    .replace("{currentTitle}", input.currentTitle ?? "Unknown")
    .replace("{candidateSkills}", input.candidateSkills.join(", ") || "none")
    .replace("{missingSkills}", input.missingSkills.join(", ") || "none");

  const { text } = await aiService.generate({
    task: "general",
    prompt,
    json: true,
    temperature: 0.4,
    maxTokens: 2500,
  });
  return interviewQuestionsSchema.parse(parseJson(text));
}

export async function summarizeInterviewPanel(input: {
  candidateName: string;
  jobTitle: string;
  feedback: string;
}): Promise<PanelSummaryData> {
  const prompt = PANEL_SUMMARY_PROMPT.replace(
    "{candidateName}",
    input.candidateName,
  )
    .replace("{jobTitle}", input.jobTitle)
    .replace("{feedback}", input.feedback);

  const { text } = await aiService.generate({
    task: "reasoning",
    prompt,
    json: true,
    temperature: 0.3,
    maxTokens: 700,
  });
  return panelSummarySchema.parse(parseJson(text));
}
