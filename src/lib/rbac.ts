export const ROLE_ADMIN = "org:admin";

const ROLE_LABELS: Record<string, string> = {
  "org:admin": "Admin",
  "org:member": "Recruiter",
  "org:manager": "Manager",
  "org:recruiter": "Recruiter",
};

export function isAdmin(role: string): boolean {
  return role === ROLE_ADMIN;
}

/** Destructive actions (delete job/candidate) are admin-only. */
export function canDelete(role: string): boolean {
  return isAdmin(role);
}

export function roleLabel(role: string): string {
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  const bare = role.replace(/^org:/, "");
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}
