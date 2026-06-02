export const ROLE_ADMIN = "org:admin";
export const ROLE_MANAGER = "org:manager";
export const ROLE_RECRUITER = "org:recruiter";
export const ROLE_MEMBER = "org:member";

// Roles treated as "elevated" — they can reach the org-management surface.
// Granular role-vs-role enforcement is done by the assertCan* helpers below.
const ELEVATED_ROLES = new Set<string>([ROLE_ADMIN, ROLE_MANAGER]);

const ROLE_LABELS: Record<string, string> = {
  "org:admin": "Admin",
  "org:manager": "Manager",
  "org:recruiter": "Recruiter",
  "org:member": "Member",
};

// Lower number = higher privilege. Used by assigner-vs-target hierarchy checks.
const ROLE_RANK: Record<string, number> = {
  "org:admin": 0,
  "org:manager": 1,
  "org:recruiter": 2,
  "org:member": 3,
};

export const ALL_ROLES = [ROLE_ADMIN, ROLE_MANAGER, ROLE_RECRUITER, ROLE_MEMBER] as const;

/**
 * "Elevated" — can reach the org-management surface (members, settings, etc.).
 * NOT a permission to assign any role; that's gated by assertCanAssignRole.
 */
export function isAdmin(role: string): boolean {
  return ELEVATED_ROLES.has(role);
}

/** Strictly the top-level admin (the original creator). */
export function isOrgOwner(role: string): boolean {
  return role === ROLE_ADMIN;
}

/** Destructive actions (delete job/candidate/interview). Admins + Managers may. */
export function canDelete(role: string): boolean {
  return isAdmin(role);
}

export function roleLabel(role: string): string {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const bare = role.replace(/^org:/, "");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

export function roleRank(role: string): number {
  return ROLE_RANK[role] ?? 99;
}

export function isValidRole(role: string): role is (typeof ALL_ROLES)[number] {
  return (ALL_ROLES as readonly string[]).includes(role);
}

// ---------------------------------------------------------------------------
// Role-hierarchy guards. These never throw — they return a typed result so
// server actions can surface a friendly error to the UI.
// ---------------------------------------------------------------------------

export type GuardResult = { ok: true } | { ok: false; error: string };

/**
 * Can `assigner` assign `newRole` to `target` (currently `targetRole`)?
 *
 * Rules:
 * - Nobody can grant org:admin to anyone (Rules 4, 5). org:admin is permanent
 *   and exclusive to the founder, set at org creation by Clerk's defaults.
 * - The original/founder admin can demote nothing — they cannot lose admin
 *   either (Rule 3). Caller should pass targetIsOriginalAdmin=true.
 * - Managers can only act on Recruiters and Members (Rule 8).
 * - Admins can act on Managers, Recruiters and Members (but never grant Admin).
 * - Self-modification is rejected at the action layer, not here.
 */
export function assertCanAssignRole(
  assignerRole: string,
  targetRole: string,
  newRole: string,
  targetIsOriginalAdmin: boolean,
): GuardResult {
  if (!isValidRole(newRole)) {
    return { ok: false, error: "Invalid role." };
  }
  if (newRole === ROLE_ADMIN) {
    return {
      ok: false,
      error: "Admin is reserved for the organization founder and cannot be granted.",
    };
  }
  if (targetIsOriginalAdmin) {
    return {
      ok: false,
      error: "The organization founder cannot be demoted.",
    };
  }
  if (!isAdmin(assignerRole)) {
    return { ok: false, error: "Only admins and managers can change member roles." };
  }
  // Hierarchy: assigner must outrank (strictly lower rank than) both the
  // target's current role and the role they're being moved into.
  const aRank = roleRank(assignerRole);
  if (aRank > roleRank(targetRole)) {
    return {
      ok: false,
      error: "You can't change the role of someone above your rank.",
    };
  }
  if (aRank > roleRank(newRole)) {
    return {
      ok: false,
      error: "You can't grant a role above your own rank.",
    };
  }
  return { ok: true };
}

/**
 * Can `remover` remove `target` from the org? Used by removeMemberAction.
 *
 * Rules:
 * - The original founder cannot be removed (Rules 3, 11).
 * - Managers can remove Recruiters and Members (Rule 8).
 * - Admins can remove Managers, Recruiters and Members.
 * - Self-removal is rejected at the action layer.
 */
export function assertCanRemoveMember(
  removerRole: string,
  targetRole: string,
  targetIsOriginalAdmin: boolean,
): GuardResult {
  if (targetIsOriginalAdmin) {
    return {
      ok: false,
      error: "The organization founder cannot be removed.",
    };
  }
  if (!isAdmin(removerRole)) {
    return { ok: false, error: "Only admins and managers can remove members." };
  }
  if (roleRank(removerRole) > roleRank(targetRole)) {
    return {
      ok: false,
      error: "You can't remove someone above your rank.",
    };
  }
  return { ok: true };
}

/** Only the original founder can delete the org (Rule 12). */
export function assertCanDeleteOrg(
  callerRole: string,
  callerIsOriginalAdmin: boolean,
): GuardResult {
  if (!callerIsOriginalAdmin) {
    return {
      ok: false,
      error: "Only the organization founder can delete the organization.",
    };
  }
  if (!isOrgOwner(callerRole)) {
    return {
      ok: false,
      error: "Only the organization admin can delete the organization.",
    };
  }
  return { ok: true };
}

/**
 * Whether a Clerk role is allowed as an INVITATION role. Same rules as
 * assertCanAssignRole(newRole=...) without a current target.
 */
export function assertCanInviteAtRole(
  inviterRole: string,
  inviteRole: string,
): GuardResult {
  if (!isValidRole(inviteRole)) {
    return { ok: false, error: "Invalid invite role." };
  }
  if (inviteRole === ROLE_ADMIN) {
    return {
      ok: false,
      error: "Admin is reserved for the founder and cannot be invited.",
    };
  }
  if (!isAdmin(inviterRole)) {
    return { ok: false, error: "Only admins and managers can invite members." };
  }
  if (roleRank(inviterRole) > roleRank(inviteRole)) {
    return {
      ok: false,
      error: "You can't invite someone at a higher rank than yours.",
    };
  }
  return { ok: true };
}
