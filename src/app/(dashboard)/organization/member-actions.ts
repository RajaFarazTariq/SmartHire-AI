"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

import { requireWorkspace } from "@/lib/org";
import { isAdmin } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

// Full member management — list, role updates, removal, invitations.

export type OrgMemberRow = {
  userId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: string;
  joinedAt: Date;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

export async function getOrgMembersDetailed(): Promise<OrgMemberRow[]> {
  const { orgId } = await requireWorkspace();
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 200,
    });
    return res.data
      .map((m) => {
        const u = m.publicUserData;
        const first = u?.firstName ?? "";
        const last = u?.lastName ?? "";
        const name =
          [first, last].filter(Boolean).join(" ") ||
          u?.identifier ||
          "Member";
        return {
          userId: u?.userId ?? "",
          name,
          email: u?.identifier ?? "",
          imageUrl: u?.imageUrl ?? null,
          role: m.role,
          joinedAt: new Date(m.createdAt),
        };
      })
      .filter((m) => m.userId);
  } catch (err) {
    console.error("getOrgMembersDetailed failed:", err);
    return [];
  }
}

export async function getOrgPendingInvitations(): Promise<PendingInvitation[]> {
  const { orgId } = await requireWorkspace();
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
    });
    return res.data.map((i) => ({
      id: i.id,
      email: i.emailAddress,
      role: i.role,
      createdAt: new Date(i.createdAt),
    }));
  } catch (err) {
    console.error("getOrgPendingInvitations failed:", err);
    return [];
  }
}

const VALID_ROLES = new Set([
  "org:admin",
  "org:manager",
  "org:recruiter",
  "org:member",
]);

export async function updateMemberRoleAction(
  userId: string,
  newRole: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins can change member roles." };
  }
  if (userId === user.id) {
    return { ok: false, error: "You can't change your own role." };
  }
  if (!VALID_ROLES.has(newRole)) {
    return { ok: false, error: "Invalid role." };
  }

  try {
    const client = await clerkClient();
    await client.organizations.updateOrganizationMembership({
      organizationId: orgId,
      userId,
      role: newRole,
    });
  } catch (err) {
    console.error("updateOrganizationMembership failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update role",
    };
  }

  await logActivity(
    orgId,
    user.id,
    "org.member_added",
    `Updated member role to ${newRole === "org:admin" ? "Admin" : "Recruiter"}`,
  );
  revalidatePath("/organization");
  return { ok: true };
}

export async function removeMemberAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins can remove members." };
  }
  if (userId === user.id) {
    return { ok: false, error: "You can't remove yourself — leave the org instead." };
  }

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId,
    });
  } catch (err) {
    console.error("deleteOrganizationMembership failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to remove member",
    };
  }

  await logActivity(
    orgId,
    user.id,
    "org.member_added",
    `Removed a member from the organization`,
  );
  revalidatePath("/organization");
  return { ok: true };
}

export async function inviteMemberAction(input: {
  email: string;
  role: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins can invite members." };
  }
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const memberRole = VALID_ROLES.has(input.role) ? input.role : "org:recruiter";

  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: memberRole,
      inviterUserId: user.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to invite";
    return { ok: false, error: msg };
  }

  await logActivity(orgId, user.id, "org.member_added", `Invited ${email}`);
  revalidatePath("/organization");
  return { ok: true };
}

export async function revokeInvitationAction(
  invitationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins can revoke invitations." };
  }

  try {
    const client = await clerkClient();
    await client.organizations.revokeOrganizationInvitation({
      organizationId: orgId,
      invitationId,
      requestingUserId: user.id,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to revoke",
    };
  }

  revalidatePath("/organization");
  return { ok: true };
}
