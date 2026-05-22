"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { processCandidate } from "@/lib/extraction";
import { logActivity } from "@/lib/activity";
import { notifyStageChange } from "@/lib/notify";
import { isPipelineStage } from "@/lib/pipeline";
import { rateLimit } from "@/lib/rate-limit";

// Fields needed by the candidates list view — deliberately excludes the large
// rawText / fileUrl columns to keep the query and payload lean.
const CANDIDATE_LIST_SELECT = {
  id: true,
  fullName: true,
  filename: true,
  currentTitle: true,
  status: true,
  stage: true,
  fileType: true,
  extractedSkills: true,
  uploadedAt: true,
} as const;

export type CandidateListItem = {
  id: string;
  fullName: string | null;
  filename: string;
  currentTitle: string | null;
  status: string;
  stage: string;
  fileType: string;
  extractedSkills: string[];
  uploadedAt: Date;
};

export async function getUserCandidates(): Promise<CandidateListItem[]> {
  const { orgId } = await requireWorkspace();
  return prisma.candidate.findMany({
    where: { orgId },
    orderBy: { uploadedAt: "desc" },
    select: CANDIDATE_LIST_SELECT,
  });
}

export async function getCandidate(id: string) {
  const { orgId } = await requireWorkspace();
  return prisma.candidate.findFirst({ where: { id, orgId } });
}

export async function getCandidateScores(id: string) {
  const { orgId } = await requireWorkspace();
  const candidate = await prisma.candidate.findFirst({ where: { id, orgId } });
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
  const { user, orgId } = await requireWorkspace();

  if (!isPipelineStage(stage)) {
    return { ok: false, error: "Invalid stage" };
  }

  const candidate = await prisma.candidate.findFirst({ where: { id, orgId } });
  if (!candidate) {
    return { ok: false, error: "Candidate not found" };
  }

  await prisma.candidate.update({ where: { id }, data: { stage } });

  await logActivity(
    orgId,
    user.id,
    "candidate.stage_changed",
    `Moved "${candidate.fullName ?? candidate.filename}" to ${stage}`,
  );

  // Notify the applicant (if this candidate came through the portal).
  await notifyStageChange(id, stage);

  revalidatePath(`/candidates/${id}`);
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function extractCandidateAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  const limit = rateLimit(`extract:${user.id}`, 15, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many extractions. Try again in ${limit.retryAfter}s.`,
    };
  }

  const candidate = await prisma.candidate.findFirst({ where: { id, orgId } });
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
  const { user, orgId } = await requireWorkspace();

  if (!isPipelineStage(stage)) {
    return { ok: false, error: "Invalid stage" };
  }
  if (ids.length === 0) {
    return { ok: false, error: "No candidates selected" };
  }

  const result = await prisma.candidate.updateMany({
    where: { id: { in: ids }, orgId },
    data: { stage },
  });

  await logActivity(
    orgId,
    user.id,
    "candidate.stage_changed",
    `Moved ${result.count} candidate${result.count === 1 ? "" : "s"} to ${stage}`,
  );

  // Notify each affected applicant (no-op for recruiter-uploaded candidates).
  await Promise.all(ids.map((cid) => notifyStageChange(cid, stage)));

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { ok: true, count: result.count };
}

export async function getCandidateNotes(candidateId: string) {
  const { orgId } = await requireWorkspace();
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, orgId },
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
  const { user, orgId } = await requireWorkspace();

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Note can't be empty" };
  if (trimmed.length > 2000) {
    return { ok: false, error: "Note is too long (max 2000 characters)" };
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, orgId },
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
  const { user, orgId, role } = await requireWorkspace();

  // A note can be removed by its author or an org admin.
  const note = await prisma.note.findFirst({
    where: { id: noteId, candidate: { orgId } },
  });
  if (!note) return { ok: false, error: "Note not found" };
  if (note.userId !== user.id && role !== "org:admin") {
    return { ok: false, error: "You can only delete your own notes." };
  }

  await prisma.note.delete({ where: { id: noteId } });

  revalidatePath(`/candidates/${note.candidateId}`);
  return { ok: true };
}
