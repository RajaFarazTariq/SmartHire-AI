import "server-only";

import { prisma } from "@/lib/prisma";
import { toAbsoluteUrl } from "./absolute-url";

export type TypePrefs = Record<string, boolean>;

/** Returns the preference row, lazily creating it with defaults on first use. */
export async function getOrCreatePreference(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  if (existing) return existing;
  // Best-effort create — if the user row disappeared (e.g. cascade delete
  // race), the FK throws and we fall back to a synthetic default object.
  try {
    return await prisma.notificationPreference.create({ data: { userId } });
  } catch {
    return null;
  }
}

/** True when the per-type opt-out is OFF (i.e. allowed to send). */
export function isTypeAllowed(types: unknown, type: string): boolean {
  if (!types || typeof types !== "object" || Array.isArray(types)) return true;
  const t = (types as TypePrefs)[type];
  // missing key = on by default; only an explicit false opts out.
  return t !== false;
}

export function buildUnsubscribeUrl(token: string): string | null {
  return toAbsoluteUrl(`/unsubscribe?token=${encodeURIComponent(token)}`);
}

export function buildManagePreferencesUrl(): string | null {
  return toAbsoluteUrl("/portal/preferences");
}
