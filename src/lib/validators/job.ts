import { z } from "zod";

const skillsFromCsv = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );

export const jobInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  company: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  description: z.string().trim().min(1, "Description is required").max(10000),
  requiredSkills: skillsFromCsv.refine(
    (arr) => arr.length > 0,
    "At least one required skill is needed",
  ),
  preferredSkills: skillsFromCsv,
  minExperience: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : null))
    .refine(
      (n) => n === null || (Number.isInteger(n) && n >= 0 && n <= 50),
      "Min experience must be a whole number between 0 and 50",
    ),
});

export type JobInput = z.infer<typeof jobInputSchema>;
