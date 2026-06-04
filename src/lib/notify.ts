import { prisma } from "./prisma";
import { sendNotificationEmail } from "./email/send";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
};

/**
 * Best-effort: a failed notification must never break the triggering action.
 * The email side-effect is awaited but isolated by sendNotificationEmail's
 * own try/catch — it never throws, and is a no-op when RESEND_API_KEY is unset.
 */
export async function createNotification(input: NotificationInput) {
  try {
    const row = await prisma.notification.create({ data: input });
    await sendNotificationEmail(row);
  } catch (err) {
    console.error("createNotification failed:", err);
  }
}

/**
 * Notifies the applicant behind a candidate record that their hiring stage
 * changed. No-op for recruiter-uploaded candidates (no linked application).
 */
export async function notifyStageChange(candidateId: string, stage: string) {
  try {
    const app = await prisma.application.findUnique({
      where: { candidateId },
      include: { job: { select: { title: true, company: true } } },
    });
    if (!app) return;

    // The interviewer's candidate-facing message (one interview per candidate).
    // Only the dedicated "message to candidate" is surfaced — strengths /
    // concerns / recommendation stay internal.
    const feedback = await prisma.interviewFeedback.findFirst({
      where: { interview: { candidateId }, candidateMessage: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { candidateMessage: true },
    });

    const at = app.job.company ? ` at ${app.job.company}` : "";
    const isHired = stage === "Hired";
    const title = isHired
      ? "🎉 Congratulations — you've been hired!"
      : `Application moved to ${stage}`;
    let body = isHired
      ? `Great news — you've been hired for "${app.job.title}"${at}. Congratulations!`
      : `Your application for "${app.job.title}"${at} is now in the ${stage} stage.`;
    if (feedback?.candidateMessage) {
      body += ` Your interviewer's message: "${feedback.candidateMessage}"`;
    }

    await createNotification({
      userId: app.applicantId,
      type: "application.status",
      title,
      body,
      link: `/portal/applications/${app.id}`,
    });
  } catch (err) {
    console.error("notifyStageChange failed:", err);
  }
}

/** Notifies the applicant that the interview's meeting link was added/updated. */
export async function notifyInterviewLinkUpdated(
  candidateId: string,
  info: { type: string; scheduledAt: Date; isNew: boolean },
) {
  try {
    const app = await prisma.application.findUnique({
      where: { candidateId },
      include: { job: { select: { title: true } } },
    });
    if (!app) return;
    const verb = info.isNew ? "added" : "updated";
    await createNotification({
      userId: app.applicantId,
      type: "interview.link",
      title: `Meeting link ${verb} for your ${info.type} interview`,
      body: `Your ${info.type} interview for "${app.job.title}" on ${info.scheduledAt.toLocaleString()} now has a meeting link.`,
      link: `/portal/applications/${app.id}`,
    });
  } catch (err) {
    console.error("notifyInterviewLinkUpdated failed:", err);
  }
}

/** Notifies the applicant 2 hours before their scheduled interview. */
export async function notifyInterviewReminder(
  candidateId: string,
  info: { type: string; scheduledAt: Date; meetingLink: string | null },
) {
  try {
    const app = await prisma.application.findUnique({
      where: { candidateId },
      include: { job: { select: { title: true } } },
    });
    if (!app) return;
    await createNotification({
      userId: app.applicantId,
      type: "interview.reminder",
      title: `Reminder: ${info.type} interview soon`,
      body: `Your ${info.type} interview for "${app.job.title}" starts at ${info.scheduledAt.toLocaleString()}.${info.meetingLink ? " Join link is on your application page." : ""}`,
      link: `/portal/applications/${app.id}`,
    });
  } catch (err) {
    console.error("notifyInterviewReminder failed:", err);
  }
}

/** Notifies a member that their role within an org has changed. */
export async function notifyRoleChanged(
  userId: string,
  info: {
    orgName: string;
    fromLabel: string;
    toLabel: string;
    direction: "promoted" | "demoted" | "changed";
  },
) {
  const title =
    info.direction === "promoted"
      ? `You were promoted to ${info.toLabel}`
      : info.direction === "demoted"
        ? `Your role was changed to ${info.toLabel}`
        : `Your role was updated to ${info.toLabel}`;
  await createNotification({
    userId,
    type:
      info.direction === "promoted"
        ? "org.role.promoted"
        : info.direction === "demoted"
          ? "org.role.demoted"
          : "org.role.changed",
    title,
    body: `Your role in ${info.orgName} changed from ${info.fromLabel} to ${info.toLabel}.`,
    link: "/organization",
  });
}

/** Notifies a user that they were removed from an organization. */
export async function notifyMemberRemoved(
  userId: string,
  info: { orgName: string },
) {
  await createNotification({
    userId,
    type: "org.member.removed",
    title: `You were removed from ${info.orgName}`,
    body: "If this was unexpected, contact the organization's admin.",
    link: "/continue",
  });
}

/** Notifies a member that the organization has been deleted. */
export async function notifyOrgDeleted(
  userId: string,
  info: { orgName: string },
) {
  await createNotification({
    userId,
    type: "org.deleted",
    title: `${info.orgName} was deleted`,
    body: "All jobs, candidates and interviews for this workspace have been permanently removed.",
    link: "/continue",
  });
}

/**
 * Notifies the org members assigned to an interview panel (e.g. when an admin
 * schedules an interview and assigns it to recruiters/managers). In-app + email
 * (best-effort). The person who scheduled it is excluded so they don't notify
 * themselves.
 */
export async function notifyInterviewPanel(
  interviewerIds: string[],
  info: {
    type: string;
    scheduledAt: Date;
    candidateName: string;
    jobTitle: string;
    candidateId: string;
    excludeUserId?: string;
  },
) {
  const recipients = [...new Set(interviewerIds)].filter(
    (id) => id && id !== info.excludeUserId,
  );
  if (recipients.length === 0) return;

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        type: "interview.panel_assigned",
        title: `You're on a ${info.type} interview panel`,
        body: `You've been assigned to interview ${info.candidateName} for "${info.jobTitle}" on ${info.scheduledAt.toLocaleString()}.`,
        link: `/candidates/${info.candidateId}`,
      }),
    ),
  );
}

/** Notifies the applicant behind a candidate that an interview was scheduled. */
export async function notifyInterviewScheduled(
  candidateId: string,
  info: { type: string; scheduledAt: Date },
) {
  try {
    const app = await prisma.application.findUnique({
      where: { candidateId },
      include: { job: { select: { title: true } } },
    });
    if (!app) return;

    await createNotification({
      userId: app.applicantId,
      type: "interview.scheduled",
      title: `${info.type} interview scheduled`,
      body: `Your ${info.type} interview for "${app.job.title}" is set for ${info.scheduledAt.toLocaleString()}.`,
      link: `/portal/applications/${app.id}`,
    });
  } catch (err) {
    console.error("notifyInterviewScheduled failed:", err);
  }
}
