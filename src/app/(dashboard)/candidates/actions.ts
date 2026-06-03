"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { isAdmin } from "@/lib/rbac";
import { processCandidate } from "@/lib/extraction";
import { logActivity } from "@/lib/activity";
import { notifyStageChange, createNotification } from "@/lib/notify";
import { isPipelineStage } from "@/lib/pipeline";
import { rateLimit } from "@/lib/rate-limit";

export type NoteListItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: string;
  authorId: string;
};

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

// ---------------------------------------------------------------------------
// Directory view — one row per real person, with their applications nested.
// ---------------------------------------------------------------------------

export type CandidateApplication = {
  candidateId: string;
  jobId: string | null;
  jobTitle: string | null;
  stage: string;
  status: string;
  uploadedAt: Date;
};

export type CandidateDirectoryRow = {
  /** Latest candidate row id — used as the route target for "View profile". */
  primaryId: string;
  /** Stable dedup key: email lowercased; falls back to fullName-lowercased; else the row id. */
  dedupKey: string;
  fullName: string | null;
  email: string | null;
  currentTitle: string | null;
  yearsExperience: number | null;
  extractedSkills: string[];
  applications: CandidateApplication[];
  /** Distinct stages across all applications, ordered by pipeline progression. */
  stages: string[];
  /** Most-advanced (= highest pipeline-index) stage across applications. */
  primaryStage: string;
  /** When the most recent application was uploaded — used for "last activity". */
  lastActivity: Date;
  uploaderId: string;
  uploaderName: string | null;
};

const DIRECTORY_SELECT = {
  id: true,
  fullName: true,
  email: true,
  currentTitle: true,
  yearsExperience: true,
  stage: true,
  status: true,
  extractedSkills: true,
  uploadedAt: true,
  userId: true,
  application: {
    select: {
      jobId: true,
      job: { select: { title: true } },
    },
  },
  user: { select: { fullName: true, email: true } },
} as const;

export async function getCandidateDirectory(): Promise<CandidateDirectoryRow[]> {
  const { orgId } = await requireWorkspace();
  const rows = await prisma.candidate.findMany({
    where: { orgId },
    orderBy: { uploadedAt: "desc" },
    select: DIRECTORY_SELECT,
  });

  // Resolve a stable dedup key for each row. Email wins (most reliable);
  // fall back to lowercased fullName so people without email still group;
  // last resort = the row id (no grouping).
  function keyFor(r: (typeof rows)[number]): string {
    const e = r.email?.trim().toLowerCase();
    if (e) return `e:${e}`;
    const n = r.fullName?.trim().toLowerCase();
    if (n) return `n:${n}`;
    return `id:${r.id}`;
  }

  const groups = new Map<string, (typeof rows)[number][]>();
  for (const r of rows) {
    const k = keyFor(r);
    const bucket = groups.get(k);
    if (bucket) bucket.push(r);
    else groups.set(k, [r]);
  }

  return Array.from(groups.values()).map((bucket) => {
    // The bucket is already sorted by uploadedAt desc thanks to the query.
    const latest = bucket[0];
    const applications: CandidateApplication[] = bucket.map((r) => ({
      candidateId: r.id,
      jobId: r.application?.jobId ?? null,
      jobTitle: r.application?.job?.title ?? null,
      stage: r.stage,
      status: r.status,
      uploadedAt: r.uploadedAt,
    }));

    const stagesSet = new Set(applications.map((a) => a.stage));
    const stages = Array.from(stagesSet);
    // Pick the most-advanced stage (highest index) — Hired beats Final Review,
    // which beats Shortlisted, etc. Rejected is treated as terminal-low so it
    // doesn't outrank an in-progress stage.
    const rank = (s: string) => {
      const idx = (PIPELINE_STAGES_ORDER as readonly string[]).indexOf(s);
      return idx === -1 ? -1 : idx;
    };
    const primaryStage =
      stages
        .filter((s) => s !== "Rejected")
        .sort((a, b) => rank(b) - rank(a))[0] ?? stages[0] ?? latest.stage;

    // Pick the freshest non-null skill list. Skills get re-extracted on each
    // upload, so latest is typically the best representation.
    const extractedSkills =
      bucket.find((r) => r.extractedSkills.length > 0)?.extractedSkills ?? [];

    return {
      primaryId: latest.id,
      dedupKey: keyFor(latest),
      fullName: latest.fullName,
      email: latest.email,
      currentTitle: latest.currentTitle,
      yearsExperience: latest.yearsExperience,
      extractedSkills,
      applications,
      stages,
      primaryStage,
      lastActivity: latest.uploadedAt,
      uploaderId: latest.userId,
      uploaderName: latest.user?.fullName ?? latest.user?.email ?? null,
    };
  });
}

// Inline copy of PIPELINE_STAGES order so we don't churn imports through the
// big actions.ts header. Kept in sync with src/lib/pipeline.ts manually.
const PIPELINE_STAGES_ORDER = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Technical Assessment",
  "Final Review",
  "Hired",
  "Rejected",
] as const;

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
    const msg = err instanceof Error ? err.message : "Extraction failed";
    const transient =
      /503|overloaded|high demand|unavailable|429|rate limit|quota/i.test(msg);
    return {
      ok: false,
      error: transient
        ? "The AI service is busy right now. Please try again in a moment."
        : msg,
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

/** Lean, serializable notes list for near-real-time polling on the client. */
export async function listCandidateNotes(
  candidateId: string,
): Promise<NoteListItem[]> {
  const { orgId } = await requireWorkspace();
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, orgId },
    select: { id: true },
  });
  if (!candidate) return [];
  const notes = await prisma.note.findMany({
    where: { candidateId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return notes.map((n) => ({
    id: n.id,
    body: n.body,
    createdAt: n.createdAt,
    author: n.user.fullName ?? n.user.username ?? n.user.email.split("@")[0],
    authorId: n.userId,
  }));
}

export async function addNoteAction(
  candidateId: string,
  body: string,
  mentionIds: string[] = [],
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

  // Notify mentioned teammates (never notify yourself).
  const actor = user.fullName ?? user.username ?? user.email.split("@")[0];
  const candidateName = candidate.fullName ?? candidate.filename;
  await Promise.all(
    [...new Set(mentionIds)]
      .filter((id) => id && id !== user.id)
      .map((id) =>
        createNotification({
          userId: id,
          type: "note.mention",
          title: `${actor} mentioned you`,
          body: `${actor} mentioned you in a note on ${candidateName}.`,
          link: `/candidates/${candidateId}`,
        }),
      ),
  );

  revalidatePath(`/candidates/${candidateId}`);
  return { ok: true };
}

export async function deleteNoteAction(
  noteId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();

  // A note can be removed by its author or by any elevated role (Admin/Manager).
  const note = await prisma.note.findFirst({
    where: { id: noteId, candidate: { orgId } },
  });
  if (!note) return { ok: false, error: "Note not found" };
  if (note.userId !== user.id && !isAdmin(role)) {
    return { ok: false, error: "You can only delete your own notes." };
  }

  await prisma.note.delete({ where: { id: noteId } });

  revalidatePath(`/candidates/${note.candidateId}`);
  return { ok: true };
}
