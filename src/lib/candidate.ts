import { prisma } from "./prisma";
import { requireDbUser } from "./auth";

export type ExperienceEntry = {
  title: string;
  company: string;
  period: string;
  description: string;
};

export type EducationEntry = {
  school: string;
  degree: string;
  period: string;
};

export const CANDIDATE_ACCOUNT_TYPE = "applicant";

/** Tags a user as a candidate (job seeker) so routing keeps them in /portal. */
export async function markAsCandidate(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { accountType: CANDIDATE_ACCOUNT_TYPE },
    });
  } catch (err) {
    console.error("markAsCandidate failed:", err);
  }
}

/** Current candidate user + their profile (profile may be null until created). */
export async function getCandidateContext() {
  const user = await requireDbUser();
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
  });
  return { user, profile };
}

/** Rough profile-completion score (0-100) to drive the "complete your profile" nudge. */
export function profileCompleteness(p: {
  headline?: string | null;
  location?: string | null;
  phone?: string | null;
  bio?: string | null;
  skills?: string[];
  resumeUrl?: string | null;
  experience?: unknown;
  education?: unknown;
  linkedinUrl?: string | null;
} | null): number {
  if (!p) return 0;
  const checks = [
    Boolean(p.headline),
    Boolean(p.location),
    Boolean(p.phone),
    Boolean(p.bio),
    (p.skills?.length ?? 0) > 0,
    Boolean(p.resumeUrl),
    Array.isArray(p.experience) && p.experience.length > 0,
    Array.isArray(p.education) && p.education.length > 0,
    Boolean(p.linkedinUrl),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
