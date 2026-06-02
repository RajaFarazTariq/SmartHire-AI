/** Origin used to build absolute URLs in emails. */
export function appOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    null;
  if (!raw) return null;
  // VERCEL_URL is bare host, NEXT_PUBLIC_APP_URL is usually a full origin.
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
}

export function toAbsoluteUrl(relative?: string | null): string | null {
  const origin = appOrigin();
  if (!origin) return null;
  if (!relative) return origin;
  if (/^https?:\/\//i.test(relative)) return relative;
  const path = relative.startsWith("/") ? relative : `/${relative}`;
  return `${origin}${path}`;
}
