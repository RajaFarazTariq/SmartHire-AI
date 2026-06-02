import "server-only";

import { Resend } from "resend";

let cached: Resend | null | undefined;

/**
 * Returns a Resend client or null when email is disabled.
 *
 * Email is disabled when RESEND_API_KEY is unset/empty — every call site
 * MUST be a no-op in that case so the platform behaves exactly like before
 * the integration shipped. Do not instantiate Resend at module load.
 */
export function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  cached = key ? new Resend(key) : null;
  return cached;
}

export const RESEND_FROM =
  process.env.RESEND_FROM ?? "SmartHire-AI <onboarding@resend.dev>";

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
