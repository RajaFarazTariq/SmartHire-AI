"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { CANDIDATE_ACCOUNT_TYPE } from "@/lib/candidate";

export type MemberRow = {
  id: string;
  fullName: string | null;
  email: string;
  username: string | null;
  createdAt: Date;
  headline: string | null;
  location: string | null;
  skills: string[];
  hasResume: boolean;
};

/**
 * Members = candidate-portal sign-ups who have NOT yet applied to any job.
 * A member becomes a Candidate (and moves to the Candidates page) the moment
 * they submit their first application, so we filter on `applications: none`.
 *
 * Note: portal members are not tied to any organization (only recruiters/jobs
 * are org-scoped), so this is a platform-wide list. Gated to org members only
 * via requireWorkspace(). Revisit scoping if/when the portal becomes per-org.
 */
export async function getMembers(): Promise<MemberRow[]> {
  await requireWorkspace();

  const users = await prisma.user.findMany({
    where: {
      accountType: CANDIDATE_ACCOUNT_TYPE,
      applications: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      createdAt: true,
      profile: {
        select: {
          headline: true,
          location: true,
          skills: true,
          resumeUrl: true,
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    username: u.username,
    createdAt: u.createdAt,
    headline: u.profile?.headline ?? null,
    location: u.profile?.location ?? null,
    skills: u.profile?.skills ?? [],
    hasResume: Boolean(u.profile?.resumeUrl),
  }));
}
