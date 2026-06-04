import type { Candidate, Job } from "@prisma/client";

import { prisma } from "./prisma";
import { embedText } from "./gemini";
import { generateMatchSummary } from "./ai/tasks";
import { queryByVector } from "./pinecone";

const WEIGHT_SEMANTIC = 0.4;
const WEIGHT_SKILL = 0.4;
const WEIGHT_EXPERIENCE = 0.2;

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const normalize = (s: string) => s.trim().toLowerCase();

export function computeSkillMatch(
  required: string[],
  candidateSkills: string[],
): { score: number; matched: string[]; missing: string[] } {
  if (required.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }
  const cand = candidateSkills.map(normalize);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of required) {
    const r = normalize(skill);
    const hit = cand.some((c) => c === r || c.includes(r) || r.includes(c));
    if (hit) matched.push(skill);
    else missing.push(skill);
  }
  return { score: (matched.length / required.length) * 100, matched, missing };
}

export function computeExperienceScore(
  years: number | null,
  minExperience: number | null,
): number {
  if (minExperience == null || minExperience === 0) return 100;
  return clamp(((years ?? 0) / minExperience) * 100);
}

/** The text we embed to represent a job for semantic similarity. */
function buildJobText(job: Job): string {
  return [
    job.title,
    job.company ?? "",
    job.description,
    `Required skills: ${job.requiredSkills.join(", ")}`,
    `Preferred skills: ${job.preferredSkills.join(", ")}`,
  ].join("\n");
}

/**
 * Given a candidate, a job, and the candidate's precomputed semantic similarity
 * (0-100), compute the weighted overall score + AI summary and upsert the Score
 * row. Shared by the batch scorer and the single-applicant auto-scorer.
 */
async function persistCandidateScore(
  job: Job,
  candidate: Candidate,
  semanticScore: number,
): Promise<void> {
  const { score: skillMatchScore, matched, missing } = computeSkillMatch(
    job.requiredSkills,
    candidate.extractedSkills,
  );
  const experienceScore = computeExperienceScore(
    candidate.yearsExperience,
    job.minExperience,
  );
  const overallScore =
    WEIGHT_SEMANTIC * semanticScore +
    WEIGHT_SKILL * skillMatchScore +
    WEIGHT_EXPERIENCE * experienceScore;

  let aiSummary: string | null = null;
  try {
    aiSummary = await generateMatchSummary({
      jobTitle: job.title,
      requiredSkills: job.requiredSkills,
      minExperience: job.minExperience,
      candidateName: candidate.fullName ?? candidate.filename,
      currentTitle: candidate.currentTitle,
      yearsExperience: candidate.yearsExperience,
      candidateSkills: candidate.extractedSkills,
      matchedSkills: matched,
      missingSkills: missing,
    });
  } catch (err) {
    console.error(`Summary failed for ${candidate.id}:`, err);
  }

  await prisma.score.upsert({
    where: {
      jobId_candidateId: { jobId: job.id, candidateId: candidate.id },
    },
    update: {
      semanticScore,
      skillMatchScore,
      experienceScore,
      overallScore,
      matchedSkills: matched,
      missingSkills: missing,
      aiSummary,
      computedAt: new Date(),
    },
    create: {
      jobId: job.id,
      candidateId: candidate.id,
      semanticScore,
      skillMatchScore,
      experienceScore,
      overallScore,
      matchedSkills: matched,
      missingSkills: missing,
      aiSummary,
    },
  });
}

/**
 * Scores a single candidate against a single job and upserts the Score row.
 * Used to auto-score an applicant against the job they applied to, so they
 * appear in rankings / Top AI matches without a manual scoring run.
 */
export async function scoreCandidateForJob(
  candidateId: string,
  jobId: string,
): Promise<void> {
  const [candidate, job] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId } }),
    prisma.job.findUnique({ where: { id: jobId } }),
  ]);
  if (!candidate || !job) return;

  let semanticScore = 0;
  if (job.orgId) {
    try {
      const jobVector = await embedText(buildJobText(job));
      const matches = await queryByVector(job.orgId, jobVector, 50);
      const hit = matches.find((m) => m.id === candidate.id);
      semanticScore = clamp((hit?.score ?? 0) * 100);
    } catch (err) {
      console.error(`Semantic scoring unavailable for ${candidate.id}:`, err);
    }
  }

  await persistCandidateScore(job, candidate, semanticScore);
}

/**
 * Scores every "ready" candidate in the job's organization and persists Score
 * rows. Auth is enforced by the caller; this operates on org-scoped data.
 */
export async function scoreJobCandidates(
  jobId: string,
): Promise<{ scored: number }> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  const candidates = await prisma.candidate.findMany({
    where: { orgId: job.orgId, status: "ready" },
  });
  if (candidates.length === 0) return { scored: 0 };

  // Semantic similarity: embed the job, query the candidate vectors.
  const simMap = new Map<string, number>();
  if (job.orgId) {
    try {
      const jobVector = await embedText(buildJobText(job));
      const matches = await queryByVector(
        job.orgId,
        jobVector,
        Math.max(candidates.length, 10),
      );
      for (const m of matches) simMap.set(m.id, m.score);
    } catch (err) {
      console.error("Semantic scoring unavailable:", err);
    }
  }

  for (const candidate of candidates) {
    const semanticScore = clamp((simMap.get(candidate.id) ?? 0) * 100);
    await persistCandidateScore(job, candidate, semanticScore);
  }

  return { scored: candidates.length };
}
