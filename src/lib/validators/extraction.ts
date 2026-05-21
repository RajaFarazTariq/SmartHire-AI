import { z } from "zod";

// Lenient by design: Gemini output can drift, so each field falls back to a
// safe default rather than failing the whole extraction.
export const extractionSchema = z.object({
  fullName: z.string().trim().min(1).nullable().catch(null),
  email: z.string().trim().min(1).nullable().catch(null),
  phone: z.string().trim().min(1).nullable().catch(null),
  currentTitle: z.string().trim().min(1).nullable().catch(null),
  skills: z.array(z.string().trim()).catch([]),
  yearsExperience: z.coerce.number().min(0).max(60).catch(0),
  educationLevel: z.string().trim().min(1).nullable().catch(null),
  workHistory: z
    .array(
      z.object({
        company: z.string().catch(""),
        title: z.string().catch(""),
        yearsAtRole: z.coerce.number().catch(0),
      }),
    )
    .catch([]),
});

export type ExtractionData = z.infer<typeof extractionSchema>;

export const matchSummarySchema = z.object({
  overview: z.string().catch(""),
  strengths: z.array(z.string().trim()).catch([]),
  gaps: z.array(z.string().trim()).catch([]),
});

export type MatchSummaryData = z.infer<typeof matchSummarySchema>;
