import { prisma } from "./prisma";
import { embedText } from "./gemini";
import { extractResumeData } from "./ai/tasks";
import { upsertCandidateVector } from "./pinecone";
import { extractionSchema } from "./validators/extraction";

/**
 * Runs the full AI pipeline for a single candidate:
 *  1. Gemini structured extraction (primary — must succeed)
 *  2. Embedding + Pinecone upsert (best-effort — failures don't block)
 *  3. Persist structured fields and flip status to "ready"
 *
 * Throws only if the Gemini extraction step fails, so callers can leave the
 * candidate in "processing" and offer a retry.
 */
export async function processCandidate(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      // For portal applicants, the application links back to the account that
      // applied — the source of truth for identity when the resume doesn't parse.
      application: {
        select: { applicant: { select: { email: true, fullName: true } } },
      },
    },
  });
  if (!candidate) throw new Error("Candidate not found");

  const accountEmail = candidate.application?.applicant?.email ?? null;
  const accountName = candidate.application?.applicant?.fullName ?? null;

  // 1. Structured extraction (primary)
  const raw = await extractResumeData(candidate.rawText);
  const data = extractionSchema.parse(raw);

  // 2. Embedding + vector upsert (best-effort)
  let pineconeId = candidate.pineconeId;
  try {
    const embedding = await embedText(candidate.rawText);
    await upsertCandidateVector(candidate.id, embedding, {
      userId: candidate.userId,
      orgId: candidate.orgId ?? "",
      fullName: data.fullName ?? candidate.filename,
      currentTitle: data.currentTitle ?? "",
      skills: data.skills,
      yearsExperience: data.yearsExperience ?? 0,
    });
    pineconeId = candidate.id;
  } catch (err) {
    console.error(`Pinecone upsert failed for ${candidate.id}:`, err);
  }

  // 3. Persist. Never let a failed/empty resume parse erase identity we already
  //    have: prefer the parsed value, then the existing row value, then the
  //    applicant account. This stops AI extraction from overwriting a real
  //    email/name with null (the cause of broken dedup downstream).
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      fullName: data.fullName ?? candidate.fullName ?? accountName,
      email: data.email ?? candidate.email ?? accountEmail,
      phone: data.phone ?? candidate.phone,
      currentTitle: data.currentTitle,
      extractedSkills: data.skills,
      yearsExperience:
        data.yearsExperience != null ? Math.round(data.yearsExperience) : null,
      educationLevel: data.educationLevel,
      pineconeId,
      status: "ready",
    },
  });
}
