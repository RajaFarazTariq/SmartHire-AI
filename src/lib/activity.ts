import { prisma } from "./prisma";

export type ActivityType =
  | "job.created"
  | "job.updated"
  | "job.deleted"
  | "candidate.uploaded"
  | "candidate.stage_changed"
  | "candidates.scored"
  | "interview.scheduled"
  // Org / membership audit trail
  | "org.member_added" // legacy: kept for backward-compat with old rows
  | "org.role_changed"
  | "org.member_removed"
  | "org.member_invited"
  | "org.invitation_revoked"
  | "org.request_submitted"
  | "org.request_approved"
  | "org.request_rejected"
  | "org.deleted"
  | "security.escalation_attempt";

/**
 * Records an activity-feed / audit entry. Best-effort: never throws, so it
 * can't break the action that triggered it.
 */
export async function logActivity(
  orgId: string,
  userId: string,
  type: ActivityType,
  message: string,
) {
  try {
    await prisma.activityLog.create({ data: { orgId, userId, type, message } });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
