"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { canDelete } from "@/lib/rbac";
import { jobInputSchema } from "@/lib/validators/job";
import { scoreJobCandidates } from "@/lib/scoring";
import { logActivity } from "@/lib/activity";
import { rateLimit } from "@/lib/rate-limit";
import { embedText } from "@/lib/gemini";
import { queryByVector } from "@/lib/pinecone";

export type CreateJobState = { error: string | null };

function parseJobForm(formData: FormData) {
  return jobInputSchema.safeParse({
    title: formData.get("title"),
    company: formData.get("company"),
    description: formData.get("description"),
    requiredSkills: formData.get("requiredSkills"),
    preferredSkills: formData.get("preferredSkills"),
    minExperience: formData.get("minExperience"),
  });
}

export async function createJobAction(
  _prev: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const { user, orgId } = await requireWorkspace();

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  }

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      orgId,
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      requiredSkills: parsed.data.requiredSkills,
      preferredSkills: parsed.data.preferredSkills,
      minExperience: parsed.data.minExperience,
    },
  });

  await logActivity(orgId, user.id, "job.created", `Created job "${job.title}"`);

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobAction(
  id: string,
  _prev: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const { orgId } = await requireWorkspace();

  const existing = await prisma.job.findFirst({ where: { id, orgId } });
  if (!existing) {
    return { error: "Job not found" };
  }

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  }

  await prisma.job.update({
    where: { id },
    data: {
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      requiredSkills: parsed.data.requiredSkills,
      preferredSkills: parsed.data.preferredSkills,
      minExperience: parsed.data.minExperience,
    },
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  redirect(`/jobs/${id}`);
}

export async function deleteJobAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();

  if (!canDelete(role)) {
    return { ok: false, error: "Only admins can delete jobs." };
  }

  const existing = await prisma.job.findFirst({ where: { id, orgId } });
  if (!existing) {
    return { ok: false, error: "Job not found" };
  }

  await prisma.job.delete({ where: { id } });

  await logActivity(
    orgId,
    user.id,
    "job.deleted",
    `Deleted job "${existing.title}"`,
  );

  revalidatePath("/jobs");
  return { ok: true };
}

// Fields needed by the jobs list view — excludes the large description column.
const JOB_LIST_SELECT = {
  id: true,
  title: true,
  company: true,
  requiredSkills: true,
  minExperience: true,
  createdAt: true,
} as const;

export type JobListItem = {
  id: string;
  title: string;
  company: string | null;
  requiredSkills: string[];
  minExperience: number | null;
  createdAt: Date;
};

export async function getUserJobs(): Promise<JobListItem[]> {
  const { orgId } = await requireWorkspace();
  return prisma.job.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: JOB_LIST_SELECT,
  });
}

export async function getJob(id: string) {
  const { orgId } = await requireWorkspace();
  return prisma.job.findFirst({ where: { id, orgId } });
}

export async function getJobScores(id: string) {
  const { orgId } = await requireWorkspace();
  const job = await prisma.job.findFirst({ where: { id, orgId } });
  if (!job) return [];
  return prisma.score.findMany({
    where: { jobId: id },
    include: { candidate: true },
    orderBy: { overallScore: "desc" },
  });
}

export type RecommendationItem = {
  id: string;
  fullName: string | null;
  filename: string;
  currentTitle: string | null;
  stage: string;
  extractedSkills: string[];
  similarity: number;
};

export async function getJobRecommendations(
  jobId: string,
): Promise<{ ok: boolean; items?: RecommendationItem[]; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  const limit = rateLimit(`recommend:${user.id}`, 15, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many requests. Try again in ${limit.retryAfter}s.`,
    };
  }

  const job = await prisma.job.findFirst({ where: { id: jobId, orgId } });
  if (!job) return { ok: false, error: "Job not found" };

  const jobText = [
    job.title,
    job.company ?? "",
    job.description,
    `Required skills: ${job.requiredSkills.join(", ")}`,
    `Preferred skills: ${job.preferredSkills.join(", ")}`,
  ].join("\n");

  let matches: { id: string; score: number }[];
  try {
    const vector = await embedText(jobText);
    matches = await queryByVector(orgId, vector, 8);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Recommendations unavailable",
    };
  }

  if (matches.length === 0) return { ok: true, items: [] };

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: matches.map((m) => m.id) }, orgId },
    select: {
      id: true,
      fullName: true,
      filename: true,
      currentTitle: true,
      stage: true,
      extractedSkills: true,
    },
  });

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const items = matches.flatMap((m) => {
    const c = byId.get(m.id);
    if (!c) return [];
    return [{ ...c, similarity: Math.round(Math.max(0, Math.min(1, m.score)) * 100) }];
  });

  return { ok: true, items };
}

export async function scoreCandidatesAction(
  jobId: string,
): Promise<{ ok: boolean; scored?: number; error?: string }> {
  const { user, orgId } = await requireWorkspace();

  const limit = rateLimit(`score:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many scoring runs. Try again in ${limit.retryAfter}s.`,
    };
  }

  const job = await prisma.job.findFirst({ where: { id: jobId, orgId } });
  if (!job) {
    return { ok: false, error: "Job not found" };
  }

  try {
    const { scored } = await scoreJobCandidates(jobId);
    if (scored > 0) {
      await logActivity(
        orgId,
        user.id,
        "candidates.scored",
        `Scored ${scored} candidate${scored === 1 ? "" : "s"} for "${job.title}"`,
      );
    }
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/dashboard");
    return { ok: true, scored };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Scoring failed",
    };
  }
}
