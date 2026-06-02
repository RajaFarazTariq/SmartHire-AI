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
 * Backward-compat: for legacy interviews where interviewerIds is empty
 * (created before this gate), we fall back to interview.createdById so the
 * original scheduler is never locked out.
 */
export function canConductInterview(
  interview: MinimalInterview,
  callerId: string,
): boolean {
  if (interview.interviewerIds.length > 0) {
    return interview.interviewerIds.includes(callerId);
  }
  return interview.createdById === callerId;
}

export function assertCanConduct(
  interview: MinimalInterview,
  callerId: string,
): GuardResult {
  if (canConductInterview(interview, callerId)) return { ok: true };
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
 *  2. No org:admin can be on the panel UNLESS the caller is themselves an
 *     org:admin AND the panel contains only themselves (admin self-assigned
 *     interview — Rule 3 of the access-control spec).
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

  // (2) admin-on-panel rule
  const adminIds = ids.filter((id) => byId.get(id) === ROLE_ADMIN);
  if (adminIds.length > 0) {
    const callerIsAdmin = args.callerRole === ROLE_ADMIN;
    const onlySelfAdmin =
      adminIds.length === 1 &&
      adminIds[0] === args.callerId &&
      ids.length === 1;
    if (!callerIsAdmin || !onlySelfAdmin) {
      return {
        ok: false,
        error:
          "Admins can't be on a panel. An Admin may only schedule an interview for themselves alone.",
      };
    }
  }

  return { ok: true, ids };
}
