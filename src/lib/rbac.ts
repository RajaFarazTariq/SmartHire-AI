export const ROLE_ADMIN = "org:admin";
export const ROLE_MANAGER = "org:manager";

// Roles treated as "admin" by SmartHire's UI/server actions. Each must also
// have the matching Clerk permissions (Manage members, Manage organization)
// for Clerk-side operations to succeed — see Clerk Dashboard → Roles.
const ADMIN_ROLES = new Set<string>([ROLE_ADMIN, ROLE_MANAGER]);

const ROLE_LABELS: Record<string, string> = {
  "org:admin": "Admin",
  "org:manager": "Manager",
  "org:recruiter": "Recruiter",
  "org:member": "Member",
};

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.has(role);
}

/** Strictly the top-level admin (delete-org powers). Used where Manager isn't enough. */
export function isOrgOwner(role: string): boolean {
  return role === ROLE_ADMIN;
}

/** Destructive actions (delete job/candidate). Admins + Managers may. */
export function canDelete(role: string): boolean {
  return isAdmin(role);
}

export function roleLabel(role: string): string {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const bare = role.replace(/^org:/, "");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}
