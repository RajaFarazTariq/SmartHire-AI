import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { ROLE_ADMIN } from "@/lib/rbac";

export type GuardResult = { ok: true } | { ok: false; error: string };

type MinimalInterview = {
  interviewerIds: string[];
  createdById: string;
};

/**
 * The single source of truth for "can this user CONDUCT this interview?"
 *
 * Conduct = edit, change status, regenerate AI questions, submit a scorecard,
 * generate the panel summary. Reads (viewing the interview) are NOT gated by
 * this function — those stay open to every org member.
 *
 * Elevated roles (Admin / Manager) always have full conduct access — they
 * oversee hiring and may manage any interview they didn't personally join,
 * including generating AI questions. For everyone else, conduct = being on the
 * panel. Backward-compat: for legacy interviews where interviewerIds is empty,
 * we fall back to interview.createdById so the original scheduler isn't locked out.
 */
export function canConductInterview(
  interview: MinimalInterview,
  callerId: string,
  callerIsElevated = false,
): boolean {
  if (callerIsElevated) return true;
  if (interview.interviewerIds.length > 0) {
    return interview.interviewerIds.includes(callerId);
  }
  return interview.createdById === callerId;
}

export function assertCanConduct(
  interview: MinimalInterview,
  callerId: string,
  callerIsElevated = false,
): GuardResult {
  if (canConductInterview(interview, callerId, callerIsElevated)) {
    return { ok: true };
  }
  return {
    ok: false,
    error: "View-only — you're not on this interview's panel.",
  };
}

/**
 * Server-side panel validation for schedule + edit actions.
 *
 * Rules enforced:
 *  1. Every interviewerId must be a current member of orgId.
 *  2. No org:admin OTHER than the caller may be a panelist. The caller-admin
 *     may include themselves (alone or alongside recruiters/managers), and an
 *     admin/manager may assign any non-admin members (recruiters, managers,
 *     members) to conduct the interview.
 *  3. Duplicates are de-duplicated.
 *  4. Empty panels are allowed (no interviewers chosen yet).
 *
 * Returns the sanitized id list or an error.
 */
export async function validatePanelComposition(args: {
  orgId: string;
  callerId: string;
  callerRole: string;
  interviewerIds: string[];
}): Promise<
  { ok: true; ids: string[] } | { ok: false; error: string }
> {
  const ids = Array.from(new Set(args.interviewerIds.filter(Boolean)));
  if (ids.length === 0) return { ok: true, ids };

  let memberships: { userId: string; role: string }[] = [];
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: args.orgId,
      limit: 200,
    });
    memberships = res.data
      .map((m) => ({
        userId: m.publicUserData?.userId ?? "",
        role: m.role,
      }))
      .filter((m) => m.userId);
  } catch (err) {
    console.error("validatePanelComposition: clerk fetch failed:", err);
    return { ok: false, error: "Could not validate panel members. Try again." };
  }

  const byId = new Map(memberships.map((m) => [m.userId, m.role]));

  // (1) every id must belong to the org
  for (const id of ids) {
    if (!byId.has(id)) {
      return {
        ok: false,
        error: "One of the chosen interviewers isn't a member of this organization.",
      };
    }
  }

  // (2) admin-on-panel rule: no admin OTHER than the caller may be a panelist.
  // The caller-admin may include themselves; recruiters/managers/members are
  // always allowed, so an admin can assign an interview to other org members.
  const otherAdminOnPanel = ids.some(
    (id) => byId.get(id) === ROLE_ADMIN && id !== args.callerId,
  );
  if (otherAdminOnPanel) {
    return {
      ok: false,
      error: "Another admin can't be added to an interview panel.",
    };
  }

  return { ok: true, ids };
}
