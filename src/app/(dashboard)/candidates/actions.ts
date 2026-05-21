"use server";

import { revalidatePath } from "next/cache";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processCandidate } from "@/lib/extraction";
import { logActivity } from "@/lib/activity";
import { isPipelineStage } from "@/lib/pipeline";

export async function getUserCandidates() {
  const user = await requireDbUser();
  return prisma.candidate.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function getCandidate(id: string) {
  const user = await requireDbUser();
  return prisma.candidate.findFirst({
    where: { id, userId: user.id },
  });
}

export async function getCandidateScores(id: string) {
  const user = await requireDbUser();
  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
  });
  if (!candidate) return [];
  return prisma.score.findMany({
    where: { candidateId: id },
    include: { job: true },
    orderBy: { overallScore: "desc" },
  });
}

export async function updateCandidateStageAction(
  id: string,
  stage: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();

  if (!isPipelineStage(stage)) {
    return { ok: false, error: "Invalid stage" };
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
  });
  if (!candidate) {
    return { ok: false, error: "Candidate not found" };
  }

  await prisma.candidate.update({ where: { id }, data: { stage } });

  await logActivity(
    user.id,
    "candidate.stage_changed",
    `Moved "${candidate.fullName ?? candidate.filename}" to ${stage}`,
  );

  revalidatePath(`/candidates/${id}`);
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function extractCandidateAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();

  const candidate = await prisma.candidate.findFirst({
    where: { id, userId: user.id },
  });
  if (!candidate) {
    return { ok: false, error: "Candidate not found" };
  }

  try {
    await processCandidate(candidate.id);
    revalidatePath(`/candidates/${id}`);
    revalidatePath("/candidates");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}

export async function bulkUpdateStageAction(
  ids: string[],
  stage: string,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const user = await requireDbUser();

  if (!isPipelineStage(stage)) {
    return { ok: false, error: "Invalid stage" };
  }
  if (ids.length === 0) {
    return { ok: false, error: "No candidates selected" };
  }

  const result = await prisma.candidate.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { stage },
  });

  await logActivity(
    user.id,
    "candidate.stage_changed",
    `Moved ${result.count} candidate${result.count === 1 ? "" : "s"} to ${stage}`,
  );

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { ok: true, count: result.count };
}

export async function getCandidateNotes(candidateId: string) {
  const user = await requireDbUser();
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: user.id },
  });
  if (!candidate) return [];
  return prisma.note.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
}

export async function addNoteAction(
  candidateId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Note can't be empty" };
  if (trimmed.length > 2000) {
    return { ok: false, error: "Note is too long (max 2000 characters)" };
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: user.id },
  });
  if (!candidate) return { ok: false, error: "Candidate not found" };

  await prisma.note.create({
    data: { candidateId, userId: user.id, body: trimmed },
  });

  revalidatePath(`/candidates/${candidateId}`);
  return { ok: true };
}

export async function deleteNoteAction(
  noteId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: user.id },
  });
  if (!note) return { ok: false, error: "Note not found" };

  await prisma.note.delete({ where: { id: noteId } });

  revalidatePath(`/candidates/${note.candidateId}`);
  return { ok: true };
}
