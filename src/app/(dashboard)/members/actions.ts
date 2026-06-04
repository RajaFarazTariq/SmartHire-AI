"use server";

import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace, ensureOrgRecord } from "@/lib/org";
import {
  roleLabel,
  roleRank,
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_RECRUITER,
} from "@/lib/rbac";

// Maps an org member's role to a human "position" for the roster's Position
// column (Admin → CEO, etc.). Plain members have no implied position.
function positionForRole(roleKey: string): string | null {
  switch (roleKey) {
    case ROLE_ADMIN:
      return "CEO";
    case ROLE_MANAGER:
      return "Manager";
    case ROLE_RECRUITER:
      return "Recruiter";
    default:
      return null;
  }
}

export type MemberRow = {
  /** Clerk userId for staff; candidate row id for hired people. */
  id: string;
  name: string;
  email: string | null;
  imageUrl: string | null;
  /** "staff" = a Clerk org member; "hired" = a candidate at stage "Hired". */
  kind: "staff" | "hired";
  /** Display label: Admin / Manager / Recruiter / Member / Hired. */
  role: string;
  /** Sort/filter key: org:admin | org:manager | org:recruiter | org:member | hired. */
  roleKey: string;
  /** The job a hired person was hired into (null for staff). */
  jobTitle: string | null;
  /** Staff: when they joined the org. Hired: when they applied. */
  since: Date | null;
  /** True for the org founder (permanent admin). */
  isOriginalAdmin: boolean;
};

const HIRED_STAGE = "Hired";
const HIRED_RANK = 50; // sorts after all staff roles (admin=0 … member=3)

/**
 * The organization roster: every Clerk org member (Admin / Manager / Recruiter /
 * Member) plus everyone hired into the org (candidates at stage "Hired"). Hired
 * people are deduplicated by their applicant account. Visible to any org member.
 */
export async function getMembers(): Promise<MemberRow[]> {
  const { orgId } = await requireWorkspace();

  const [staff, hired] = await Promise.all([
    getOrgStaff(orgId),
    getHiredPeople(orgId),
  ]);

  return [...staff, ...hired].sort((a, b) => {
    const ra = a.kind === "hired" ? HIRED_RANK : roleRank(a.roleKey);
    const rb = b.kind === "hired" ? HIRED_RANK : roleRank(b.roleKey);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

async function getOrgStaff(orgId: string): Promise<MemberRow[]> {
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 200,
    });
    const founderRow = await ensureOrgRecord(orgId);
    const founderId = founderRow?.foundedById ?? null;

    return res.data
      .map((m): MemberRow | null => {
        const u = m.publicUserData;
        const userId = u?.userId;
        if (!userId) return null;
        const name =
          [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
          u?.identifier ||
          "Member";
        return {
          id: userId,
          name,
          email: u?.identifier ?? null,
          imageUrl: u?.imageUrl ?? null,
          kind: "staff",
          role: roleLabel(m.role),
          roleKey: m.role,
          jobTitle: positionForRole(m.role),
          since: new Date(m.createdAt),
          isOriginalAdmin: userId === founderId,
        };
      })
      .filter((m): m is MemberRow => m !== null);
  } catch (err) {
    console.error("getOrgStaff failed:", err);
    return [];
  }
}

async function getHiredPeople(orgId: string): Promise<MemberRow[]> {
  const rows = await prisma.candidate.findMany({
    where: { orgId, stage: HIRED_STAGE },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      uploadedAt: true,
      application: {
        select: {
          applicantId: true,
          job: { select: { title: true } },
          applicant: { select: { fullName: true, email: true } },
        },
      },
    },
  });

  // One row per hired person. Prefer the applicant account identity; key by
  // applicantId, then email, then the row id (consistent with the Candidates
  // directory's identity rules).
  const seen = new Set<string>();
  const out: MemberRow[] = [];
  for (const r of rows) {
    const account = r.application?.applicant;
    const key =
      r.application?.applicantId ??
      (account?.email ?? r.email)?.toLowerCase() ??
      `row:${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: r.id,
      name: account?.fullName ?? r.fullName ?? account?.email ?? r.email ?? "Hired candidate",
      email: account?.email ?? r.email,
      imageUrl: null,
      kind: "hired",
      role: "Hired",
      roleKey: "hired",
      jobTitle: r.application?.job?.title ?? null,
      since: r.uploadedAt,
      isOriginalAdmin: false,
    });
  }
  return out;
}
