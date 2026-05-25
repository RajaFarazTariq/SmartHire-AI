"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Client-side redirect with a branded loading state. Used on the auth pages so
// an already-signed-in user is moved into the app immediately (instead of seeing
// a blank Clerk component) — independent of middleware/build timing.
export function RedirectTo({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">Taking you to your dashboard…</p>
    </div>
  );
}
