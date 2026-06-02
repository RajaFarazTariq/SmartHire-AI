"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import {
  requireWorkspace,
  isOriginalAdmin,
  ensureOrgRecord,
} from "@/lib/org";
import {
  isAdmin,
  roleLabel,
  roleRank,
  assertCanAssignRole,
  assertCanRemoveMember,
  assertCanInviteAtRole,
} from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import {
  notifyRoleChanged,
  notifyMemberRemoved,
} from "@/lib/notify";

// Full member management — list, role updates, removal, invitations.
// Every mutating action enforces the role-hierarchy + original-admin rules
// in src/lib/rbac.ts on top of Clerk's own permission model. Reads are also
// gated to admins/managers so plain members can't enumerate the membership.

export type OrgMemberRow = {
  userId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: string;
  joinedAt: Date;
  isOriginalAdmin: boolean;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

export async function getOrgMembersDetailed(): Promise<OrgMemberRow[]> {
  const { orgId, role } = await requireWorkspace();
  // Rule 7: members/recruiters cannot enumerate full membership.
  if (!isAdmin(role)) return [];
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 200,
    });
    const founderRow = await ensureOrgRecord(orgId);
    const founderId = founderRow?.foundedById ?? null;
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
          isOriginalAdmin: u?.userId ? u.userId === founderId : false,
        };
      })
      .filter((m) => m.userId);
  } catch (err) {
    console.error("getOrgMembersDetailed failed:", err);
    return [];
  }
}

export async function getOrgPendingInvitations(): Promise<PendingInvitation[]> {
  const { orgId, role } = await requireWorkspace();
  // Rule 7: pending invitations include invitee emails — admin/manager only.
  if (!isAdmin(role)) return [];
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

async function getOrgName(orgId: string): Promise<string> {
  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    return org.name;
  } catch {
    return "your organization";
  }
}

async function getMemberRoleAndName(
  orgId: string,
  userId: string,
): Promise<{ role: string | null; email: string | null }> {
  try {
    const client = await clerkClient();
    const res = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 200,
    });
    const m = res.data.find((x) => x.publicUserData?.userId === userId);
    return {
      role: m?.role ?? null,
      email: m?.publicUserData?.identifier ?? null,
    };
  } catch {
    return { role: null, email: null };
  }
}

async function recordEscalationAttempt(
  orgId: string,
  callerId: string,
  detail: string,
) {
  await logActivity(
    orgId,
    callerId,
    "security.escalation_attempt",
    detail.slice(0, 280),
  );
}

export async function updateMemberRoleAction(
  userId: string,
  newRole: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();

  // Rule 10: no self-modification.
  if (userId === user.id) {
    return { ok: false, error: "You can't change your own role." };
  }

  // Resolve target's current role and original-admin status.
  const { role: targetRole, email: targetEmail } = await getMemberRoleAndName(
    orgId,
    userId,
  );
  if (!targetRole) return { ok: false, error: "Member not found." };
  const targetIsFounder = await isOriginalAdmin(orgId, userId);

  // Rule 2-5, 8: role-hierarchy + original-admin guard.
  const guard = assertCanAssignRole(role, targetRole, newRole, targetIsFounder);
  if (!guard.ok) {
    await recordEscalationAttempt(
      orgId,
      user.id,
      `Blocked role assignment ${roleLabel(targetRole)} -> ${roleLabel(newRole)} on ${targetEmail ?? userId}: ${guard.error}`,
    );
    return guard;
  }

  if (targetRole === newRole) {
    return { ok: false, error: "Member already has this role." };
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

  const direction =
    roleRank(newRole) < roleRank(targetRole)
      ? "promoted"
      : roleRank(newRole) > roleRank(targetRole)
        ? "demoted"
        : "changed";

  const orgName = await getOrgName(orgId);
  await notifyRoleChanged(userId, {
    orgName,
    fromLabel: roleLabel(targetRole),
    toLabel: roleLabel(newRole),
    direction,
  });

  await logActivity(
    orgId,
    user.id,
    "org.role_changed",
    `Changed ${targetEmail ?? userId} from ${roleLabel(targetRole)} to ${roleLabel(newRole)}`,
  );
  revalidatePath("/organization");
  return { ok: true };
}

export async function removeMemberAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();

  // Rule 10: cannot remove yourself (use "leave organization" via Clerk).
  if (userId === user.id) {
    return {
      ok: false,
      error: "You can't remove yourself — leave the org instead.",
    };
  }

  const { role: targetRole, email: targetEmail } = await getMemberRoleAndName(
    orgId,
    userId,
  );
  if (!targetRole) return { ok: false, error: "Member not found." };
  const targetIsFounder = await isOriginalAdmin(orgId, userId);

  // Rules 3, 8, 11: hierarchy + founder protection.
  const guard = assertCanRemoveMember(role, targetRole, targetIsFounder);
  if (!guard.ok) {
    await recordEscalationAttempt(
      orgId,
      user.id,
      `Blocked removal of ${roleLabel(targetRole)} ${targetEmail ?? userId}: ${guard.error}`,
    );
    return guard;
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

  const orgName = await getOrgName(orgId);
  await notifyMemberRemoved(userId, { orgName });

  await logActivity(
    orgId,
    user.id,
    "org.member_removed",
    `Removed ${targetEmail ?? userId} (${roleLabel(targetRole)}) from the organization`,
  );
  revalidatePath("/organization");
  return { ok: true };
}

export async function inviteMemberAction(input: {
  email: string;
  role: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  // Rules 4, 5, 8: nobody can invite at Admin; Managers cannot invite at Manager.
  const guard = assertCanInviteAtRole(role, input.role);
  if (!guard.ok) {
    await recordEscalationAttempt(
      orgId,
      user.id,
      `Blocked invite of ${email} at ${input.role}: ${guard.error}`,
    );
    return guard;
  }

  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: input.role,
      inviterUserId: user.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to invite";
    return { ok: false, error: msg };
  }

  await logActivity(
    orgId,
    user.id,
    "org.member_invited",
    `Invited ${email} as ${roleLabel(input.role)}`,
  );
  revalidatePath("/organization");
  return { ok: true };
}

export async function revokeInvitationAction(
  invitationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { user, orgId, role } = await requireWorkspace();
  if (!isAdmin(role)) {
    return { ok: false, error: "Only admins and managers can revoke invitations." };
  }

  // Look up the invitation first so we can audit the email + role being revoked.
  let invEmail: string | null = null;
  let invRole: string | null = null;
  try {
    const client = await clerkClient();
    const list = await client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      status: ["pending"],
    });
    const inv = list.data.find((i) => i.id === invitationId);
    invEmail = inv?.emailAddress ?? null;
    invRole = inv?.role ?? null;
  } catch {
    /* best-effort lookup */
  }

  // Rule 8: Managers cannot revoke an invitation that would create someone
  // above their rank (e.g. Manager invitation).
  if (invRole && roleRank(role) > roleRank(invRole)) {
    await recordEscalationAttempt(
      orgId,
      user.id,
      `Blocked revoke of ${invRole} invitation to ${invEmail ?? invitationId}: insufficient rank`,
    );
    return { ok: false, error: "You can't revoke an invitation above your rank." };
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

  await logActivity(
    orgId,
    user.id,
    "org.invitation_revoked",
    `Revoked invitation${invEmail ? ` for ${invEmail}` : ""}`,
  );
  revalidatePath("/organization");
  return { ok: true };
}
