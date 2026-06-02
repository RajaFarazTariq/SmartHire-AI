import { prisma } from "./prisma";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
};

/** Best-effort: a failed notification must never break the triggering action. */
export async function createNotification(input: NotificationInput) {
  try {
    await prisma.notification.create({ data: input });
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

    await createNotification({
      userId: app.applicantId,
      type: "application.status",
      title: `Application moved to ${stage}`,
      body: `Your application for "${app.job.title}"${
        app.job.company ? ` at ${app.job.company}` : ""
      } is now in the ${stage} stage.`,
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
