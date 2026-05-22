"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { detectFileType, extractResumeText } from "@/lib/parsers";
import { processCandidate } from "@/lib/extraction";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notify";
import { markAsCandidate, CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type BrowseJob = {
  id: string;
  title: string;
  company: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number | null;
  createdAt: Date;
};

const BROWSE_SELECT = {
  id: true,
  title: true,
  company: true,
  requiredSkills: true,
  preferredSkills: true,
  minExperience: true,
  createdAt: true,
} as const;

/** All jobs across every company — a global, login-gated job board. */
export async function listOpenJobs(): Promise<BrowseJob[]> {
  await requireDbUser();
  return prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    select: BROWSE_SELECT,
  });
}

export async function getAppliedJobIds(): Promise<string[]> {
  const user = await requireDbUser();
  const apps = await prisma.application.findMany({
    where: { applicantId: user.id },
    select: { jobId: true },
  });
  return apps.map((a) => a.jobId);
}

export async function getJobForCandidate(id: string) {
  const user = await requireDbUser();
  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      company: true,
      description: true,
      requiredSkills: true,
      preferredSkills: true,
      minExperience: true,
      createdAt: true,
    },
  });
  if (!job) return null;

  const application = await prisma.application.findUnique({
    where: { applicantId_jobId: { applicantId: user.id, jobId: id } },
    select: { id: true },
  });

  return { job, applied: Boolean(application), applicationId: application?.id ?? null };
}

export type ApplyResult = { ok: boolean; error?: string; applicationId?: string };

export async function applyToJobAction(
  jobId: string,
  formData: FormData,
): Promise<ApplyResult> {
  const user = await requireDbUser();

  const limit = rateLimit(`apply:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limit.retryAfter}s.` };
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, error: "This job is no longer available." };

  const already = await prisma.application.findUnique({
    where: { applicantId_jobId: { applicantId: user.id, jobId } },
  });
  if (already) {
    return { ok: false, error: "You've already applied to this job." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please attach your resume." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "File too large (max 4 MB)." };
  }
  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    return { ok: false, error: "Only PDF and DOCX files are supported." };
  }

  const coverNote = (formData.get("coverNote") as string | null)?.trim() || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string | null)?.trim() || null;
  const githubUrl = (formData.get("githubUrl") as string | null)?.trim() || null;
  const portfolioUrl = (formData.get("portfolioUrl") as string | null)?.trim() || null;

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText: string;
  try {
    rawText = await extractResumeText(buffer, fileType);
  } catch {
    return { ok: false, error: "Could not read that file. Try another." };
  }

  const blob = await put(`resumes/${job.orgId ?? "public"}/${file.name}`, buffer, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type || (fileType === "pdf" ? "application/pdf" : undefined),
  });

  const candidate = await prisma.candidate.create({
    data: {
      userId: user.id,
      orgId: job.orgId,
      fullName: user.fullName ?? null,
      email: user.email,
      phone: profile?.phone ?? null,
      filename: file.name,
      fileUrl: blob.url,
      fileType,
      rawText,
      extractedSkills: [],
      status: "processing",
      stage: "Applied",
      coverNote,
      linkedinUrl: linkedinUrl ?? profile?.linkedinUrl ?? null,
      githubUrl: githubUrl ?? profile?.githubUrl ?? null,
      portfolioUrl: portfolioUrl ?? profile?.portfolioUrl ?? null,
    },
  });

  const application = await prisma.application.create({
    data: { applicantId: user.id, jobId, candidateId: candidate.id },
  });

  if (user.accountType !== CANDIDATE_ACCOUNT_TYPE) {
    await markAsCandidate(user.id);
  }

  await createNotification({
    userId: user.id,
    type: "application.submitted",
    title: "Application submitted",
    body: `Your application for "${job.title}"${
      job.company ? ` at ${job.company}` : ""
    } has been received.`,
    link: `/portal/applications/${application.id}`,
  });

  if (job.orgId) {
    await logActivity(
      job.orgId,
      job.userId,
      "candidate.uploaded",
      `New application for "${job.title}"`,
    );
  }

  // AI extraction — best-effort; the application stands even if it fails.
  try {
    await processCandidate(candidate.id);
  } catch (err) {
    console.error(`Extraction failed for application ${candidate.id}:`, err);
  }

  revalidatePath("/portal");
  revalidatePath("/portal/applications");
  revalidatePath(`/portal/jobs/${jobId}`);
  return { ok: true, applicationId: application.id };
}
