import { auth, clerkClient } from "@clerk/nextjs/server";

// Centralized access/role utilities — the single source of truth for which
// portal a user belongs to. Org membership wins over everything (the legacy
// `accountType` flag, stale session state, etc.): anyone who belongs to a Clerk
// organization is a recruiter/admin; everyone else is a candidate.
//
// Future roles (Interviewer, Hiring Manager, Org Owner, Super Admin) are modeled
// as Clerk organization roles and read via `getActiveOrgRole()` below.

export type Portal = "recruiter" | "candidate";

/** Active organization id from the current session, if one is active. */
export async function getActiveOrgId(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId ?? null;
}

/** Active organization role (e.g. "org:admin", "org:member"), if in an org. */
export async function getActiveOrgRole(): Promise<string | null> {
  const { orgRole } = await auth();
  return orgRole ?? null;
}

/**
 * Whether the user belongs to at least one Clerk organization — i.e. is a
 * recruiter/admin. Uses the backend API so it's correct even when no org is
 * "active" in the current session (the cause of recruiter→candidate misroutes).
 */
export async function hasOrgMembership(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({
      userId,
      limit: 1,
    });
    const count = res.totalCount ?? res.data.length;
    return count > 0;
  } catch (err) {
    console.error("hasOrgMembership failed:", err);
    return false;
  }
}

/**
 * Resolves the portal a user belongs to. Recruiter if they have an active org OR
 * any org membership; candidate otherwise. Deterministic and cache-free.
 */
export async function resolvePortalForUser(userId: string): Promise<Portal> {
  if (await getActiveOrgId()) return "recruiter";
  return (await hasOrgMembership(userId)) ? "recruiter" : "candidate";
}
