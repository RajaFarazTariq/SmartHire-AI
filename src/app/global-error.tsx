"use client";

// Last-resort error boundary — fires when the ROOT layout itself fails to
// render (e.g. ClerkProvider crash, theme provider crash). Replaces the
// layout entirely, so we must provide our own <html> + <body>.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: 480, margin: 0, color: "#475569", fontSize: 14 }}>
          The application failed to load. Try again, or sign in fresh.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={reset}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "white",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/sign-in"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#0f172a",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Sign in
          </a>
        </div>
        {error.digest && (
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
            Reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
