"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/org";
import { isAdmin, ROLE_RECRUITER, ROLE_MEMBER } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notify";

// Admin-side actions for the "join my organization" request flow.

export type OrgJoinRequest = {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
  decidedAt: Date | null;
};

export async function getOrgJoinRequests(): Promise<{
  pending: OrgJoinRequest[];
  decided: OrgJoinRequest[];
}> {
  const { orgId } = await requireWorkspace();
  const all = await prisma.organizationRequest.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requesterId: true,
      requesterEmail: true,
      requesterName: true,
      message: true,
      status: true,
      createdAt: true,
      decidedAt: true,
    },
  });
  return {
    pending: all.filter((r) => r.status === "pending"),
    decided: all.filter((r) => r.status !== "pending"),
  };
}

export async function approveRequestAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins can approve requests." };
  }

  const req = await prisma.organizationRequest.findFirst({
    where: { id, orgId },
  });
  if (!req) return { ok: false, error: "Request not found" };
  if (req.status !== "pending") {
    return { ok: false, error: "This request has already been decided." };
  }

  // Joining via the recruiter portal → default to the Recruiter role.
  try {
    const client = await clerkClient();
    try {
      await client.organizations.createOrganizationMembership({
        organizationId: orgId,
        userId: req.requesterId,
        role: ROLE_RECRUITER,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/already a member/i.test(msg)) {
        // Already in the org — nothing to add.
      } else {
        // The custom Recruiter role may not be configured in Clerk; fall back
        // to the default member role so approval still succeeds.
        console.error(
          "approveRequest: recruiter role failed, falling back to member:",
          err,
        );
        await client.organizations.createOrganizationMembership({
          organizationId: orgId,
          userId: req.requesterId,
          role: ROLE_MEMBER,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add member";
    if (!/already a member/i.test(msg)) {
      console.error("createOrganizationMembership failed:", err);
      return { ok: false, error: msg };
    }
  }

  await prisma.organizationRequest.update({
    where: { id },
    data: {
      status: "approved",
      decidedAt: new Date(),
      decidedById: user.id,
    },
  });

  await createNotification({
    userId: req.requesterId,
    type: "org.request.approved",
    title: `You've joined ${req.orgName}`,
    body: "Your request to join the organization was approved. Sign in to access the recruiter dashboard.",
    link: "/continue",
  });

  await logActivity(
    orgId,
    user.id,
    "org.request_approved",
    `Approved ${req.requesterEmail} to join the organization`,
  );

  revalidatePath("/organization/requests");
  return { ok: true };
}

export async function rejectRequestAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins can reject requests." };
  }

  const req = await prisma.organizationRequest.findFirst({
    where: { id, orgId },
  });
  if (!req) return { ok: false, error: "Request not found" };
  if (req.status !== "pending") {
    return { ok: false, error: "This request has already been decided." };
  }

  await prisma.organizationRequest.update({
    where: { id },
    data: {
      status: "rejected",
      decidedAt: new Date(),
      decidedById: user.id,
    },
  });

  await createNotification({
    userId: req.requesterId,
    type: "org.request.rejected",
    title: `Your request to join ${req.orgName} was declined`,
    body: "You can request to join a different organization or create your own.",
    link: "/onboarding",
  });

  await logActivity(
    orgId,
    user.id,
    "org.request_rejected",
    `Rejected ${req.requesterEmail}'s request to join the organization`,
  );

  revalidatePath("/organization/requests");
  return { ok: true };
}
