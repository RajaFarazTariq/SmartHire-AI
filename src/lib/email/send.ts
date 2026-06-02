import "server-only";

import type { Notification } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getResend, RESEND_FROM, emailEnabled } from "./resend";
import { toAbsoluteUrl } from "./absolute-url";
import {
  buildManagePreferencesUrl,
  buildUnsubscribeUrl,
  getOrCreatePreference,
  isTypeAllowed,
} from "./preferences";
import { renderEmailFor } from "./templates/registry";

const DAILY_CAP = Number(process.env.EMAIL_DAILY_CAP ?? 80); // stay under Resend free 100/day

/**
 * Email side-effect for createNotification. NEVER throws.
 *
 * Short-circuits as a no-op in any of these cases:
 *   - RESEND_API_KEY unset
 *   - notification has no recipient email
 *   - user opted out (emailEnabled=false or per-type=false)
 *   - no template registered for this notification.type
 *   - already emailed (idempotency)
 *   - daily cap reached
 *
 * Writes notification.emailedAt on success, notification.emailError on a
 * non-throwing skip (for ops visibility). Throwing exceptions are caught
 * and turned into emailError = error.message.
 */
export async function sendNotificationEmail(
  notification: Notification,
): Promise<void> {
  try {
    if (!emailEnabled()) return;

    if (notification.emailedAt) return; // idempotent

    const resend = getResend();
    if (!resend) return;

    const recipient = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true },
    });
    if (!recipient?.email) {
      await markSkipped(notification.id, "no-recipient");
      return;
    }

    const pref = await getOrCreatePreference(notification.userId);
    if (pref && !pref.emailEnabled) {
      await markSkipped(notification.id, "opted-out");
      return;
    }
    if (pref && !isTypeAllowed(pref.types, notification.type)) {
      await markSkipped(notification.id, "type-opted-out");
      return;
    }

    const ctaUrl = toAbsoluteUrl(notification.link);
    const unsubscribeUrl = pref ? buildUnsubscribeUrl(pref.unsubscribeToken) : null;
    const manageUrl = buildManagePreferencesUrl();

    const rendered = renderEmailFor(notification.type, {
      title: notification.title,
      body: notification.body,
      ctaUrl,
      unsubscribeUrl,
      managePreferencesUrl: manageUrl,
    });
    if (!rendered) {
      await markSkipped(notification.id, "no-template");
      return;
    }

    // Daily cap check — cheap count over today.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sentToday = await prisma.notification.count({
      where: { emailedAt: { gte: startOfDay } },
    });
    if (sentToday >= DAILY_CAP) {
      await markSkipped(notification.id, "daily-cap");
      return;
    }

    const headers: Record<string, string> = {};
    if (unsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: recipient.email,
      subject: rendered.subject,
      react: rendered.element,
      headers,
    });

    if (result.error) {
      await markSkipped(
        notification.id,
        `resend:${result.error.name ?? "error"}`,
      );
      return;
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { emailedAt: new Date(), emailError: null },
    });
  } catch (err) {
    // Last-resort guard. Email failures must never break the triggering action.
    console.error("sendNotificationEmail failed:", err);
    try {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailError:
            err instanceof Error ? err.message.slice(0, 200) : "unknown",
        },
      });
    } catch {
      /* swallow — we tried */
    }
  }
}

async function markSkipped(id: string, reason: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { emailError: reason },
    });
  } catch {
    /* swallow */
  }
}
