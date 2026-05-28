"use client";

import { useEffect } from "react";

/**
 * Global error boundary. Renders when the root layout itself throws,
 * which means providers, fonts, and the regular shell are NOT
 * available. This file MUST define its own <html>/<body> and avoid
 * any imports from the rest of the app — the goal is to fail safely
 * with branded styling inlined.
 *
 * Keep this file dependency-free.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Career OS] global error:", error);
    }
  }, [error]);

  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          role="alert"
          style={{
            maxWidth: "480px",
            width: "100%",
            padding: "32px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            textAlign: "center",
            boxShadow: "0 24px 48px rgba(0,0,0,0.45)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7aa2ff",
              fontWeight: 600,
            }}
          >
            Career OS
          </p>
          <h1
            style={{
              margin: "12px 0 8px",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Career OS couldn&apos;t start.
          </h1>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "14px",
              lineHeight: 1.55,
              color: "rgba(250,250,250,0.65)",
            }}
          >
            Something failed at the application root. Try reloading — if it
            keeps happening, clear site data and start fresh.
          </p>
          {error?.digest ? (
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(250,250,250,0.5)",
                fontFamily:
                  "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Ref · {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: "40px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "1px solid rgba(122,162,255,0.4)",
              backgroundColor: "rgba(122,162,255,0.18)",
              color: "#fafafa",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
