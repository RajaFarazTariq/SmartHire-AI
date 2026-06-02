import { auth, clerkClient } from "@clerk/nextjs/server";

import { requireDbUser } from "./auth";
import { prisma } from "./prisma";
import { ROLE_ADMIN } from "./rbac";

export type DbUser = Awaited<ReturnType<typeof requireDbUser>>;

export type Workspace = {
  user: DbUser;
  orgId: string;
  role: string;
};

/**
 * Resolves the active workspace (Clerk organization) for the current request.
 * Returns null when the user has no active organization, so callers can prompt
 * them to create/select one.
 */
export async function getWorkspace(): Promise<Workspace | null> {
  const { orgId, orgRole } = await auth();
  const user = await requireDbUser();
  if (!orgId) return null;

  await claimOrphanData(user.id, orgId);
  // Backfill the local Organization row lazily — pinned to whoever currently
  // holds org:admin in Clerk at first contact. Best-effort: never throws.
  await ensureOrgRecord(orgId).catch((err) =>
    console.error("ensureOrgRecord failed:", err),
  );

  return { user, orgId, role: orgRole ?? "org:member" };
}

export async function requireWorkspace(): Promise<Workspace> {
  const ws = await getWorkspace();
  if (!ws) throw new Error("No active organization selected");
  return ws;
}

/**
 * Moves a user's pre-organization records (created before orgs existed) into
 * their active org the first time they act within it. Guarded updateMany — a
 * no-op once there are no orphaned rows for this user.
 */
async function claimOrphanData(userId: string, orgId: string) {
  await Promise.all([
    prisma.job.updateMany({ where: { userId, orgId: null }, data: { orgId } }),
    prisma.candidate.updateMany({
      where: { userId, orgId: null },
      data: { orgId },
    }),
    prisma.activityLog.updateMany({
      where: { userId, orgId: null },
      data: { orgId },
    }),
  ]);
}

/**
 * Creates the local Organization row if missing. The founder is pinned to
 * whichever user currently holds the `org:admin` Clerk role. We do this
 * lazily on first authenticated touch — there's no Clerk webhook in this
 * project yet. Subsequent calls are a no-op when the row already exists.
 *
 * Returns the row (or null on failure).
 */
export async function ensureOrgRecord(orgId: string) {
  const existing = await prisma.organization.findUnique({
    where: { orgId },
    select: { orgId: true, name: true, foundedById: true },
  });
  if (existing) return existing;

  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 200,
    });
    // Founder = current Admin. If there are multiple Admins at first contact
    // (unlikely for a fresh org), pick the earliest joined.
    const admins = memberships.data
      .filter((m) => m.role === ROLE_ADMIN)
      .sort((a, b) => a.createdAt - b.createdAt);
    const founderId =
      admins[0]?.publicUserData?.userId ?? memberships.data[0]?.publicUserData?.userId;
    if (!founderId) return null;

    return await prisma.organization.upsert({
      where: { orgId },
      update: {},
      create: {
        orgId,
        name: org.name,
        foundedById: founderId,
      },
      select: { orgId: true, name: true, foundedById: true },
    });
  } catch (err) {
    console.error("ensureOrgRecord create failed:", err);
    return null;
  }
}

/** Cheap lookup used by RBAC guards. Returns null when the row is missing. */
export async function getFounderId(orgId: string): Promise<string | null> {
  const row = await prisma.organization.findUnique({
    where: { orgId },
    select: { foundedById: true },
  });
  return row?.foundedById ?? null;
}

/** True iff `userId` is the founder of `orgId`. Backfills the row on miss. */
export async function isOriginalAdmin(
  orgId: string,
  userId: string,
): Promise<boolean> {
  let founder = await getFounderId(orgId);
  if (!founder) {
    const created = await ensureOrgRecord(orgId);
    founder = created?.foundedById ?? null;
  }
  return founder === userId;
}
