import { prisma } from "./prisma";
import { embedText, generateMatchSummary } from "./gemini";
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
  const jobText = [
    job.title,
    job.company ?? "",
    job.description,
    `Required skills: ${job.requiredSkills.join(", ")}`,
    `Preferred skills: ${job.preferredSkills.join(", ")}`,
  ].join("\n");

  const simMap = new Map<string, number>();
  if (job.orgId) {
    try {
      const jobVector = await embedText(jobText);
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

  return { scored: candidates.length };
}
