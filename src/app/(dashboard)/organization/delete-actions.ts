"use server";

import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace, isOriginalAdmin } from "@/lib/org";
import { assertCanDeleteOrg } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { notifyOrgDeleted } from "@/lib/notify";

export type DeletionPreview = {
  orgName: string;
  jobsCount: number;
  candidatesCount: number;
  interviewsCount: number;
  notesCount: number;
  membersCount: number;
  isOriginalAdmin: boolean;
};

/** What gets wiped if the caller confirms. */
export async function getOrgDeletionPreview(): Promise<DeletionPreview | null> {
  const { user, orgId } = await requireWorkspace();
  const callerIsFounder = await isOriginalAdmin(orgId, user.id);
  let orgName = "your organization";
  let membersCount = 0;
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    orgName = org.name;
    membersCount = org.membersCount ?? 0;
  } catch {
    /* fall through with defaults */
  }
  const [jobsCount, candidatesCount, interviewsCount, notesCount] =
    await Promise.all([
      prisma.job.count({ where: { orgId } }),
      prisma.candidate.count({ where: { orgId } }),
      prisma.interview.count({ where: { orgId } }),
      prisma.note.count({ where: { candidate: { orgId } } }),
    ]);
  return {
    orgName,
    jobsCount,
    candidatesCount,
    interviewsCount,
    notesCount,
    membersCount,
    isOriginalAdmin: callerIsFounder,
  };
}

/**
 * Permanently deletes the org. Order: cascade DB rows → notify members →
 * delete Clerk org. Clerk delete must be LAST: once Clerk fires the delete,
 * orgId is gone from the session and we lose the ability to revalidate or
 * record audit context.
 *
 * Refuses unless:
 *  - The caller is the original founder (per local Organization.foundedById)
 *  - AND currently holds org:admin in Clerk
 *  - AND the typed confirmation matches the org name exactly
 */
export async function deleteOrganizationAction(input: {
  confirmName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  const callerIsFounder = await isOriginalAdmin(orgId, user.id);

  // Rule 12 + 16: founder-only and Admin role.
  const guard = assertCanDeleteOrg(role, callerIsFounder);
  if (!guard.ok) {
    await logActivity(
      orgId,
      user.id,
      "security.escalation_attempt",
      `Blocked org-deletion attempt: ${guard.error}`,
    );
    return guard;
  }

  // Resolve org name + members up front (we need both for confirmation and notify).
  let orgName = "your organization";
  let memberIds: string[] = [];
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    orgName = org.name;
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 200,
      });
    memberIds = memberships.data
      .map((m) => m.publicUserData?.userId)
      .filter((id): id is string => Boolean(id));
  } catch (err) {
    console.error("delete: clerk lookup failed:", err);
    return { ok: false, error: "Could not load organization." };
  }

  // Rule 13: typed confirmation. Compared case-insensitively + trim.
  if (input.confirmName.trim().toLowerCase() !== orgName.trim().toLowerCase()) {
    return {
      ok: false,
      error: `Type "${orgName}" exactly to confirm deletion.`,
    };
  }

  // Best-effort fan-out notification BEFORE we destroy state.
  await Promise.all(
    memberIds.map((uid) =>
      notifyOrgDeleted(uid, { orgName }).catch((e) =>
        console.error("notifyOrgDeleted failed for", uid, e),
      ),
    ),
  );

  // Cascade local data in a transaction. Onmost relations already have
  // onDelete: Cascade in the schema, so deleting a Job removes its
  // applications/scores/interviews; deleting a Candidate removes its
  // notes/feedback. We delete the parent rows + the side tables that aren't
  // FK'd to a parent (OrgSettings, Organization, OrganizationRequest,
  // ActivityLog).
  try {
    await prisma.$transaction([
      prisma.job.deleteMany({ where: { orgId } }),
      prisma.candidate.deleteMany({ where: { orgId } }),
      prisma.interview.deleteMany({ where: { orgId } }),
      prisma.organizationRequest.deleteMany({ where: { orgId } }),
      prisma.orgSettings.deleteMany({ where: { orgId } }),
      // Activity log is kept for the founder's own deletion record? No —
      // the org context goes away so the rows are unreachable. Delete.
      prisma.activityLog.deleteMany({ where: { orgId } }),
      prisma.organization.deleteMany({ where: { orgId } }),
    ]);
  } catch (err) {
    console.error("cascade delete failed:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Local cleanup failed: ${err.message}`
          : "Local cleanup failed",
    };
  }

  // Finally, delete the Clerk org. Members lose access immediately.
  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganization(orgId);
  } catch (err) {
    console.error("Clerk deleteOrganization failed:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Clerk deletion failed: ${err.message}`
          : "Clerk deletion failed",
    };
  }

  // Best-effort audit: orgId is now dead; we log against the founder's own
  // user as an orphan ActivityLog row (orgId column allows null).
  await prisma.activityLog
    .create({
      data: {
        userId: user.id,
        orgId: null,
        type: "org.deleted",
        message: `Deleted organization "${orgName}"`,
      },
    })
    .catch((e) => console.error("post-delete audit failed:", e));

  // Caller no longer has an active org — bounce them.
  redirect("/onboarding");
}
