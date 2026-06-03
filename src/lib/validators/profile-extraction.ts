import { z } from "zod";

// Lenient by design (Gemini output can drift): every field falls back to a
// safe empty/null default rather than failing the whole parse, so a single
// malformed field never discards an otherwise-good extraction.

const urlField = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .catch(null);

export const profileExtractionSchema = z.object({
  fullName: z.string().trim().min(1).nullable().catch(null),
  email: z.string().trim().min(1).nullable().catch(null),
  phone: z.string().trim().min(1).nullable().catch(null),
  location: z.string().trim().min(1).nullable().catch(null),
  headline: z.string().trim().min(1).nullable().catch(null),
  summary: z.string().trim().min(1).nullable().catch(null),
  skills: z.array(z.string().trim().min(1)).catch([]),
  experience: z
    .array(
      z.object({
        title: z.string().trim().catch(""),
        company: z.string().trim().catch(""),
        period: z.string().trim().catch(""),
        description: z.string().trim().catch(""),
      }),
    )
    .catch([]),
  education: z
    .array(
      z.object({
        school: z.string().trim().catch(""),
        degree: z.string().trim().catch(""),
        period: z.string().trim().catch(""),
      }),
    )
    .catch([]),
  certifications: z.array(z.string().trim().min(1)).catch([]),
  linkedinUrl: urlField,
  githubUrl: urlField,
  portfolioUrl: urlField,
  websiteUrl: urlField,
});

export type ProfileExtractionData = z.infer<typeof profileExtractionSchema>;
