import { z } from "zod";

// AI-generated interview questions, grouped by category. Lenient so model drift
// never breaks the feature.
export const interviewQuestionsSchema = z
  .array(
    z.object({
      category: z.string().trim().catch("General"),
      questions: z.array(z.string().trim()).catch([]),
    }),
  )
  .catch([]);

export type InterviewQuestionsData = z.infer<typeof interviewQuestionsSchema>;

// AI summary of panel feedback.
export const panelSummarySchema = z.object({
  recommendation: z.string().trim().catch(""),
  summary: z.string().trim().catch(""),
  strengths: z.array(z.string().trim()).catch([]),
  concerns: z.array(z.string().trim()).catch([]),
});

export type PanelSummaryData = z.infer<typeof panelSummarySchema>;
