"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

// User-side actions for the "join an existing organization" flow.

export type OrgSearchResult = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
  membersCount: number;
};

/** Search Clerk organizations by name. Returns up to `limit` matches. */
export async function searchOrganizations(
  query: string,
  limit = 12,
): Promise<OrgSearchResult[]> {
  await requireDbUser();
  const term = query.trim();
  if (term.length < 2) return [];

  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationList({
      query: term,
      limit,
    });
    return res.data.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug ?? null,
      imageUrl: o.imageUrl ?? null,
      membersCount: o.membersCount ?? 0,
    }));
  } catch (err) {
    console.error("searchOrganizations failed:", err);
    return [];
  }
}

export async function requestToJoinAction(input: {
  orgId: string;
  orgName: string;
  message?: string;
}): Promise<{ ok: boolean; error?: string; requestId?: string }> {
  const user = await requireDbUser();

  if (!input.orgId || !input.orgName) {
    return { ok: false, error: "Pick an organization to join." };
  }

  // Already a member? Block to avoid pointless requests.
  try {
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({
      userId: user.id,
      limit: 100,
    });
    if (memberships.data.some((m) => m.organization.id === input.orgId)) {
      return { ok: false, error: "You're already a member of this organization." };
    }
  } catch (err) {
    console.error("membership precheck failed:", err);
  }

  const message = input.message?.trim().slice(0, 1000) || null;

  // Upsert so a previously rejected request can be re-submitted.
  const req = await prisma.organizationRequest.upsert({
    where: {
      orgId_requesterId: { orgId: input.orgId, requesterId: user.id },
    },
    update: {
      orgName: input.orgName,
      message,
      status: "pending",
      decidedAt: null,
      decidedById: null,
      requesterEmail: user.email,
      requesterName: user.fullName ?? user.username,
    },
    create: {
      orgId: input.orgId,
      orgName: input.orgName,
      requesterId: user.id,
      requesterEmail: user.email,
      requesterName: user.fullName ?? user.username,
      message,
    },
  });

  // Notify the org's admins (in-app). Email notifications would require a
  // transactional email provider — wire that here when one is configured.
  try {
    const client = await clerkClient();
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: input.orgId,
        limit: 100,
      });
    const adminIds = memberships.data
      .filter((m) => m.role === "org:admin")
      .map((m) => m.publicUserData?.userId)
      .filter((id): id is string => Boolean(id));

    const who = user.fullName ?? user.username ?? user.email;
    await Promise.all(
      adminIds.map((adminId) =>
        createNotification({
          userId: adminId,
          type: "org.request",
          title: `${who} wants to join your organization`,
          body: message ?? "No message provided.",
          link: "/organization/requests",
        }),
      ),
    );
  } catch (err) {
    console.error("admin notify failed:", err);
  }

  revalidatePath("/onboarding/pending");
  revalidatePath("/organization/requests");
  return { ok: true, requestId: req.id };
}

export type MyJoinRequest = {
  id: string;
  orgId: string;
  orgName: string;
  status: string;
  message: string | null;
  createdAt: Date;
  decidedAt: Date | null;
};

export async function getMyJoinRequests(): Promise<MyJoinRequest[]> {
  const user = await requireDbUser();
  return prisma.organizationRequest.findMany({
    where: { requesterId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orgId: true,
      orgName: true,
      status: true,
      message: true,
      createdAt: true,
      decidedAt: true,
    },
  });
}

export async function hasPendingJoinRequest(userId: string): Promise<boolean> {
  const found = await prisma.organizationRequest.findFirst({
    where: { requesterId: userId, status: "pending" },
    select: { id: true },
  });
  return Boolean(found);
}

export async function cancelMyRequestAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireDbUser();
  const req = await prisma.organizationRequest.findFirst({
    where: { id, requesterId: user.id },
  });
  if (!req) return { ok: false, error: "Request not found" };
  if (req.status !== "pending") {
    return { ok: false, error: "This request has already been decided." };
  }
  await prisma.organizationRequest.delete({ where: { id } });
  revalidatePath("/onboarding/pending");
  return { ok: true };
}
