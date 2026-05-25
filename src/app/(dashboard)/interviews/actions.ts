"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { canDelete } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { notifyInterviewScheduled } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateInterviewQuestions,
  summarizeInterviewPanel,
} from "@/lib/ai/tasks";
import {
  isInterviewStatus,
  isInterviewType,
  isRecommendation,
  OPTIONAL_ROUNDS,
} from "@/lib/interview";
import type { PanelSummaryData } from "@/lib/validators/interview";

/** Optional interview rounds the org has enabled (defaults to all on). */
export async function getEnabledRounds(): Promise<string[]> {
  const { orgId } = await requireWorkspace();
  const settings = await prisma.orgSettings.findUnique({ where: { orgId } });
  return settings?.enabledRounds ?? [...OPTIONAL_ROUNDS];
}

export async function updateEnabledRoundsAction(
  rounds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const { orgId } = await requireWorkspace();
  const valid = rounds.filter((r) =>
    (OPTIONAL_ROUNDS as string[]).includes(r),
  );
  await prisma.orgSettings.upsert({
    where: { orgId },
    update: { enabledRounds: valid },
    create: { orgId, enabledRounds: valid },
  });
  revalidatePath("/settings");
  revalidatePath("/candidates");
  return { ok: true };
}

/** The job a candidate applied to (for pre-filling the schedule form). */
export async function getSuggestedJobId(
  candidateId: string,
): Promise<string | null> {
  const { orgId } = await requireWorkspace();
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, orgId },
    select: { application: { select: { jobId: true } } },
  });
  return candidate?.application?.jobId ?? null;
}

export type OrgMember = { id: string; name: string; email: string };

export async function getOrgMembers(): Promise<OrgMember[]> {
  const { orgId } = await requireWorkspace();
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });
    return res.data
      .map((m) => {
        const u = m.publicUserData;
        const name =
          [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
          u?.identifier ||
          "Member";
        return { id: u?.userId ?? "", name, email: u?.identifier ?? "" };
      })
      .filter((m) => m.id);
  } catch (err) {
    console.error("getOrgMembers failed:", err);
    return [];
  }
}

export async function getJobOptions(): Promise<{ id: string; title: string }[]> {
  const { orgId } = await requireWorkspace();
  return prisma.job.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
}

export async function getCandidateInterviews(candidateId: string) {
  const { orgId } = await requireWorkspace();
  return prisma.interview.findMany({
    where: { candidateId, orgId },
    orderBy: { scheduledAt: "desc" },
    include: {
      feedback: true,
      job: { select: { id: true, title: true } },
    },
  });
}

/**
 * Candidates parked in the "Interview Scheduled" stage that don't yet have an
 * actual Interview record — so they surface on the Interviews page as work to do.
 */
export async function getCandidatesAwaitingScheduling() {
  const { orgId } = await requireWorkspace();
  return prisma.candidate.findMany({
    where: { orgId, stage: "Interview Scheduled", interviews: { none: {} } },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fullName: true,
      filename: true,
      currentTitle: true,
    },
  });
}

export async function getOrgInterviews() {
  const { orgId } = await requireWorkspace();
  return prisma.interview.findMany({
    where: { orgId },
    orderBy: { scheduledAt: "desc" },
    include: {
      job: { select: { id: true, title: true } },
      candidate: { select: { id: true, fullName: true, filename: true } },
      feedback: { select: { id: true } },
    },
  });
}

export type ScheduleInterviewInput = {
  candidateId: string;
  jobId: string;
  scheduledAt: string; // datetime-local value
  durationMins: number;
  type: string;
  meetingLink: string;
  location: string;
  interviewerIds: string[];
  notes: string;
};

export async function scheduleInterviewAction(
  input: ScheduleInterviewInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  if (!isInterviewType(input.type)) {
    return { ok: false, error: "Invalid interview type" };
  }
  const when = new Date(input.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: "Pick a valid date and time" };
  }

  const [candidate, job] = await Promise.all([
    prisma.candidate.findFirst({ where: { id: input.candidateId, orgId } }),
    prisma.job.findFirst({ where: { id: input.jobId, orgId } }),
  ]);
  if (!candidate) return { ok: false, error: "Candidate not found" };
  if (!job) return { ok: false, error: "Job not found" };

  const interview = await prisma.interview.create({
    data: {
      orgId,
      jobId: job.id,
      candidateId: candidate.id,
      scheduledAt: when,
      durationMins: Math.max(5, Math.min(480, input.durationMins || 45)),
      type: input.type,
      meetingLink: input.meetingLink.trim() || null,
      location: input.location.trim() || null,
      notes: input.notes.trim() || null,
      interviewerIds: input.interviewerIds,
      createdById: user.id,
    },
  });

  // Move the candidate to "Interview Scheduled" unless already concluded.
  if (!["Hired", "Rejected"].includes(candidate.stage)) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { stage: "Interview Scheduled" },
    });
  }

  await notifyInterviewScheduled(candidate.id, { type: input.type, scheduledAt: when });
  await logActivity(
    orgId,
    user.id,
    "interview.scheduled",
    `Scheduled ${input.type} interview for "${candidate.fullName ?? candidate.filename}"`,
  );

  revalidatePath(`/candidates/${candidate.id}`);
  revalidatePath("/interviews");
  revalidatePath("/dashboard");
  return { ok: true, id: interview.id };
}

export async function updateInterviewStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const { orgId } = await requireWorkspace();
  if (!isInterviewStatus(status)) return { ok: false, error: "Invalid status" };

  const interview = await prisma.interview.findFirst({ where: { id, orgId } });
  if (!interview) return { ok: false, error: "Interview not found" };

  await prisma.interview.update({ where: { id }, data: { status } });
  revalidatePath(`/candidates/${interview.candidateId}`);
  revalidatePath("/interviews");
  return { ok: true };
}

export async function deleteInterviewAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { orgId, role } = await requireWorkspace();
  if (!canDelete(role)) {
    return { ok: false, error: "Only admins can delete interviews." };
  }
  const interview = await prisma.interview.findFirst({ where: { id, orgId } });
  if (!interview) return { ok: false, error: "Interview not found" };

  await prisma.interview.delete({ where: { id } });
  revalidatePath(`/candidates/${interview.candidateId}`);
  revalidatePath("/interviews");
  return { ok: true };
}

export async function generateQuestionsAction(
  interviewId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  const limit = rateLimit(`iq:${user.id}`, 15, 60_000);
  if (!limit.ok) {
    return { ok: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` };
  }

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, orgId },
    include: {
      job: true,
      candidate: { select: { fullName: true, filename: true, currentTitle: true, extractedSkills: true } },
    },
  });
  if (!interview) return { ok: false, error: "Interview not found" };

  // Skills the candidate is missing for this job (to probe in the interview).
  const candSkills = interview.candidate.extractedSkills.map((s) => s.toLowerCase());
  const missing = interview.job.requiredSkills.filter(
    (r) => !candSkills.some((c) => c === r.toLowerCase() || c.includes(r.toLowerCase())),
  );

  try {
    const groups = await generateInterviewQuestions({
      interviewType: interview.type,
      jobTitle: interview.job.title,
      requiredSkills: interview.job.requiredSkills,
      candidateName: interview.candidate.fullName ?? interview.candidate.filename,
      currentTitle: interview.candidate.currentTitle,
      candidateSkills: interview.candidate.extractedSkills,
      missingSkills: missing,
    });
    await prisma.interview.update({
      where: { id: interviewId },
      data: { aiQuestions: groups as unknown as Prisma.InputJsonValue },
    });
    revalidatePath(`/candidates/${interview.candidateId}`);
    revalidatePath("/interviews");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    const transient = /503|overloaded|high demand|unavailable|429|rate limit|quota/i.test(msg);
    return {
      ok: false,
      error: transient ? "The AI service is busy right now. Please try again." : msg,
    };
  }
}

export async function submitFeedbackAction(
  interviewId: string,
  data: {
    rating: number;
    recommendation: string;
    strengths: string;
    concerns: string;
    comments: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  if (!isRecommendation(data.recommendation)) {
    return { ok: false, error: "Pick a recommendation" };
  }
  const rating = Math.max(1, Math.min(5, Math.round(data.rating)));

  const interview = await prisma.interview.findFirst({ where: { id: interviewId, orgId } });
  if (!interview) return { ok: false, error: "Interview not found" };

  await prisma.interviewFeedback.upsert({
    where: {
      interviewId_interviewerId: { interviewId, interviewerId: user.id },
    },
    update: {
      rating,
      recommendation: data.recommendation,
      strengths: data.strengths.trim() || null,
      concerns: data.concerns.trim() || null,
      comments: data.comments.trim() || null,
    },
    create: {
      interviewId,
      interviewerId: user.id,
      rating,
      recommendation: data.recommendation,
      strengths: data.strengths.trim() || null,
      concerns: data.concerns.trim() || null,
      comments: data.comments.trim() || null,
    },
  });

  revalidatePath(`/candidates/${interview.candidateId}`);
  revalidatePath("/interviews");
  return { ok: true };
}

export async function summarizePanelAction(
  interviewId: string,
): Promise<{ ok: boolean; summary?: PanelSummaryData; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  const limit = rateLimit(`ps:${user.id}`, 15, 60_000);
  if (!limit.ok) {
    return { ok: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` };
  }

  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, orgId },
    include: {
      job: { select: { title: true } },
      candidate: { select: { fullName: true, filename: true } },
      feedback: true,
    },
  });
  if (!interview) return { ok: false, error: "Interview not found" };
  if (interview.feedback.length === 0) {
    return { ok: false, error: "No feedback to summarize yet." };
  }

  const feedbackText = interview.feedback
    .map(
      (f, i) =>
        `Interviewer ${i + 1}: rating ${f.rating}/5, recommendation "${f.recommendation}".` +
        (f.strengths ? ` Strengths: ${f.strengths}.` : "") +
        (f.concerns ? ` Concerns: ${f.concerns}.` : "") +
        (f.comments ? ` Comments: ${f.comments}.` : ""),
    )
    .join("\n");

  try {
    const summary = await summarizeInterviewPanel({
      candidateName: interview.candidate.fullName ?? interview.candidate.filename,
      jobTitle: interview.job.title,
      feedback: feedbackText,
    });
    return { ok: true, summary };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Summary failed";
    const transient = /503|overloaded|high demand|unavailable|429|rate limit|quota/i.test(msg);
    return {
      ok: false,
      error: transient ? "The AI service is busy right now. Please try again." : msg,
    };
  }
}
