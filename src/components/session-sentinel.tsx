"use client";

import { useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const SENTINEL_KEY = "shai_session_active";
const HANDSHAKE_CHANNEL = "shai-session-handshake";

/**
 * Forces re-authentication when the browser was fully closed and reopened.
 *
 * Why this exists:
 *   Clerk's `__session` cookie is a long-lived persistent cookie (~7 days by
 *   default). It survives browser restarts, so a user reopening Chrome stays
 *   signed in. To honor the "must re-login after closing the browser"
 *   requirement we use a sessionStorage marker — sessionStorage is wiped when
 *   the browser is fully closed (not just when a tab is closed).
 *
 * How it works:
 *   1. On every protected page load, check for our sentinel marker in
 *      sessionStorage.
 *   2. If the user is signed in AND the marker is missing, it means the
 *      Clerk cookie carried over a "dead" session — the browser was closed
 *      and reopened. Sign the user out and bounce to /sign-in.
 *   3. If the marker is present, this is the same browser session that did
 *      the sign-in — let them through.
 *
 * New-tab handling:
 *   sessionStorage is per-tab. Opening a fresh tab to a protected URL would
 *   normally also wipe the marker → false sign-out. We mitigate via a brief
 *   BroadcastChannel handshake: a new tab pings all other tabs of this origin
 *   and adopts the session if any other tab confirms it's alive.
 */
export function SessionSentinel() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Not signed in → just ensure the sentinel is set so a subsequent in-tab
    // sign-in is recognized as "fresh".
    if (!isSignedIn) {
      try {
        sessionStorage.setItem(SENTINEL_KEY, "1");
      } catch {
        /* private mode / storage disabled — no-op */
      }
      return;
    }

    let hasMarker = false;
    try {
      hasMarker = sessionStorage.getItem(SENTINEL_KEY) === "1";
    } catch {
      // sessionStorage unavailable (e.g., quota, blocked) — fail OPEN so the
      // user isn't locked out. The Clerk cookie is still the primary auth.
      return;
    }

    if (hasMarker) return;

    // Marker missing → either a reopened browser (sign out) OR a freshly
    // opened tab while another tab is still alive (adopt). Coordinate.
    if (typeof BroadcastChannel === "undefined") {
      // No BroadcastChannel (very old browser) — fall back to strict mode.
      void signOut().then(() => router.replace("/sign-in"));
      return;
    }

    const bc = new BroadcastChannel(HANDSHAKE_CHANNEL);
    let resolved = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    bc.onmessage = (e) => {
      if (resolved) return;
      if (e.data === "alive") {
        resolved = true;
        try {
          sessionStorage.setItem(SENTINEL_KEY, "1");
        } catch {
          /* no-op */
        }
        if (timer) clearTimeout(timer);
        bc.close();
      } else if (e.data === "ping") {
        // Another tab is asking — respond only if we currently hold a marker.
        try {
          if (sessionStorage.getItem(SENTINEL_KEY) === "1") {
            bc.postMessage("alive");
          }
        } catch {
          /* no-op */
        }
      }
    };

    bc.postMessage("ping");

    timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      bc.close();
      void signOut().then(() => router.replace("/sign-in"));
    }, 400);

    return () => {
      if (timer) clearTimeout(timer);
      bc.close();
    };
  }, [isLoaded, isSignedIn, signOut, router]);

  return null;
}
