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
  });
  if (!candidate) throw new Error("Candidate not found");

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
      yearsExperience: data.yearsExperience,
    });
    pineconeId = candidate.id;
  } catch (err) {
    console.error(`Pinecone upsert failed for ${candidate.id}:`, err);
  }

  // 3. Persist
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      currentTitle: data.currentTitle,
      extractedSkills: data.skills,
      yearsExperience: Math.round(data.yearsExperience),
      educationLevel: data.educationLevel,
      pineconeId,
      status: "ready",
    },
  });
}
