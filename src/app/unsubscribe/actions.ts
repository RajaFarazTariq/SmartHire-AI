"use server";

import { prisma } from "@/lib/prisma";

export async function setSubscriptionWithToken(
  token: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "Missing token" };
  const pref = await prisma.notificationPreference.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!pref) {
    // Don't leak token validity — return ok regardless.
    return { ok: true };
  }
  await prisma.notificationPreference.update({
    where: { userId: pref.userId },
    data: { emailEnabled: enabled },
  });
  return { ok: true };
}
