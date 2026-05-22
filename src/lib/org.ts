import { auth } from "@clerk/nextjs/server";

import { requireDbUser } from "./auth";
import { prisma } from "./prisma";

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
