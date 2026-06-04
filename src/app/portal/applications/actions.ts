"use server";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";

export type MyApplication = {
  id: string;
  createdAt: Date;
  jobId: string;
  jobTitle: string;
  company: string | null;
  stage: string;
  status: string;
  candidateId: string;
};

export async function getMyApplications(): Promise<MyApplication[]> {
  const user = await requireDbUser();
  const apps = await prisma.application.findMany({
    where: { applicantId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, company: true } },
      candidate: { select: { id: true, stage: true, status: true } },
    },
  });

  return apps.map((a) => ({
    id: a.id,
    createdAt: a.createdAt,
    jobId: a.job.id,
    jobTitle: a.job.title,
    company: a.job.company,
    stage: a.candidate.stage,
    status: a.candidate.status,
    candidateId: a.candidate.id,
  }));
}

export async function getApplicantInterviews(candidateId: string) {
  const user = await requireDbUser();
  // Confirm this candidate record belongs to the requesting applicant.
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: user.id },
    select: { id: true },
  });
  if (!candidate) return [];
  return prisma.interview.findMany({
    where: { candidateId },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      durationMins: true,
      status: true,
      meetingLink: true,
      location: true,
      // Only the candidate-facing message + rating are exposed here; internal
      // scorecard fields (strengths/concerns/recommendation) are never selected.
      feedback: {
        where: { candidateMessage: { not: null } },
        select: { candidateMessage: true, rating: true },
        take: 1,
      },
    },
  });
}

export async function getApplicationDetail(id: string) {
  const user = await requireDbUser();
  return prisma.application.findFirst({
    where: { id, applicantId: user.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          description: true,
          requiredSkills: true,
          preferredSkills: true,
          minExperience: true,
        },
      },
      candidate: {
        select: {
          id: true,
          stage: true,
          status: true,
          filename: true,
          fileType: true,
          extractedSkills: true,
          coverNote: true,
          linkedinUrl: true,
          githubUrl: true,
          portfolioUrl: true,
          uploadedAt: true,
        },
      },
    },
  });
}
