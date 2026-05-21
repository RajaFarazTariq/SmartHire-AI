"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobInputSchema } from "@/lib/validators/job";
import { scoreJobCandidates } from "@/lib/scoring";
import { logActivity } from "@/lib/activity";

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
  const user = await requireDbUser();

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" · ") };
  }

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      requiredSkills: parsed.data.requiredSkills,
      preferredSkills: parsed.data.preferredSkills,
      minExperience: parsed.data.minExperience,
    },
  });

  await logActivity(user.id, "job.created", `Created job "${job.title}"`);

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobAction(
  id: string,
  _prev: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const user = await requireDbUser();

  const existing = await prisma.job.findFirst({
    where: { id, userId: user.id },
  });
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
  const user = await requireDbUser();

  const existing = await prisma.job.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return { ok: false, error: "Job not found" };
  }

  await prisma.job.delete({ where: { id } });

  await logActivity(user.id, "job.deleted", `Deleted job "${existing.title}"`);

  revalidatePath("/jobs");
  return { ok: true };
}

export async function getUserJobs() {
  const user = await requireDbUser();
  return prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJob(id: string) {
  const user = await requireDbUser();
  return prisma.job.findFirst({
    where: { id, userId: user.id },
  });
}

export async function getJobScores(id: string) {
  const user = await requireDbUser();
  const job = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!job) return [];
  return prisma.score.findMany({
    where: { jobId: id },
    include: { candidate: true },
    orderBy: { overallScore: "desc" },
  });
}

export async function scoreCandidatesAction(
  jobId: string,
): Promise<{ ok: boolean; scored?: number; error?: string }> {
  const user = await requireDbUser();
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job) {
    return { ok: false, error: "Job not found" };
  }

  try {
    const { scored } = await scoreJobCandidates(jobId);
    if (scored > 0) {
      await logActivity(
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
