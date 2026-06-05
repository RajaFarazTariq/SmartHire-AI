"use client";

import { useEffect } from "react";

/**
 * Auto-recovers from the transient first-login client crash.
 *
 * On the deployed Clerk DEVELOPMENT instance, the first post-login navigation
 * can throw an UNHANDLED async error (the session handshake / dev-mode
 * injection isn't settled yet) that escapes React's error boundaries — Next
 * shows the white "Application error: a client-side exception" page. A reload
 * recovers it, which is what users currently do by hand.
 *
 * This mirrors that: if a fatal uncaught error / unhandled rejection happens
 * during the INITIAL page load, reload once. It's tightly scoped so it never
 * interferes with normal use:
 *   - only within the first few seconds of a page load (where the crash occurs);
 *   - at most one reload per 8s window (no reload loop — a persistent error
 *     then surfaces normally);
 *   - ignores benign resource-load / ResizeObserver / cross-origin "Script
 *     error" noise.
 */
const KEY = "shai-recover-ts";
const RECOVER_WINDOW_MS = 8000;
const LOAD_GRACE_MS = 6000;

function isBenign(msg: string): boolean {
  return /resizeobserver|^script error\.?$/i.test(msg);
}

export function AutoRecover() {
  useEffect(() => {
    const loadedAt = Date.now();

    function recover(message: string) {
      // Only during the initial load window, and not for benign noise.
      if (Date.now() - loadedAt > LOAD_GRACE_MS) return;
      if (isBenign(message)) return;
      try {
        const now = Date.now();
        const last = Number(sessionStorage.getItem(KEY) ?? "0");
        if (now - last > RECOVER_WINDOW_MS) {
          sessionStorage.setItem(KEY, String(now));
          window.location.reload();
        }
      } catch {
        /* storage blocked — do nothing */
      }
    }

    function onError(e: ErrorEvent) {
      // Skip resource-load failures (img/script/link); only real JS errors.
      if (e.target instanceof HTMLElement) return;
      recover(e.message || "error");
    }
    function onRejection(e: PromiseRejectionEvent) {
      const r = e.reason as { message?: string } | string | undefined;
      recover(
        typeof r === "string" ? r : r?.message || "unhandledrejection",
      );
    }

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
