import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyInterviewReminder } from "@/lib/notify";

// Vercel Cron invokes GET; protect with the CRON_SECRET when set.
// Vercel Hobby only allows daily crons, so we send a single 24-hour-ahead
// heads-up. Upgrade to Pro + change LEAD_MINUTES to 120 (with an hourly
// schedule in vercel.json) to get the true 2-hour reminder.
const LEAD_MINUTES = 24 * 60;
const BUFFER_MINUTES = 60;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  // In production the secret is mandatory; locally we allow unauthenticated
  // invocation so devs can curl the endpoint without setting up the secret.
  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + (LEAD_MINUTES + BUFFER_MINUTES) * 60_000,
  );

  const due = await prisma.interview.findMany({
    where: {
      status: "Scheduled",
      reminderSentAt: null,
      scheduledAt: { gte: now, lte: windowEnd },
    },
    select: {
      id: true,
      candidateId: true,
      type: true,
      scheduledAt: true,
      meetingLink: true,
    },
  });

  let sent = 0;
  const failures: { id: string; error: string }[] = [];
  for (const iv of due) {
    try {
      await notifyInterviewReminder(iv.candidateId, {
        type: iv.type,
        scheduledAt: iv.scheduledAt,
        meetingLink: iv.meetingLink,
      });
      await prisma.interview.update({
        where: { id: iv.id },
        data: { reminderSentAt: now },
      });
      sent += 1;
    } catch (err) {
      // One bad interview must not abort the batch.
      const msg = err instanceof Error ? err.message : "unknown";
      console.error(`interview-reminders ${iv.id} failed:`, msg);
      failures.push({ id: iv.id, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    considered: due.length,
    sent,
    failed: failures.length,
    failures,
  });
}
