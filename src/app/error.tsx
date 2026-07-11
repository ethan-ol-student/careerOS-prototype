"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * Route-level error boundary. Next.js will render this when a route
 * inside the App Router throws during render, in a Server Component,
 * or in a Client Component. We keep the surface intentionally calm —
 * one clear message, one reset action, one safe escape hatch — so it
 * stays consistent with the rest of the Career OS shell.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the browser console so the engineer who
    // hits it in dev / preview has something to work with. We do not
    // ship to a remote logger — the app is in-memory only.
    if (process.env.NODE_ENV !== "production") {
      console.error("[Career OS] route error:", error);
    }
  }, [error]);

  return (
    <main className="bg-background text-foreground relative flex min-h-screen w-full items-center justify-center px-4">
      <div className="glass-3 ring-border/60 mx-auto flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl p-8 text-center ring-1 sm:p-10">
        <span className="bg-brand/15 text-brand flex size-12 items-center justify-center rounded-2xl">
          <AlertTriangle className="size-6" aria-hidden />
        </span>

        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Something went sideways
        </p>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          We hit an unexpected error.
        </h1>

        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          Career OS couldn&apos;t finish loading this page. Try again, or head
          back to your dashboard — your progress is safe.
        </p>

        {error?.digest ? (
          <p className="text-muted-foreground/80 font-mono text-[10px] uppercase tracking-wider">
            Ref · {error.digest}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => reset()}
            className="text-primary-foreground bg-linear-to-b from-primary/60 to-primary/100 dark:from-primary/100 dark:to-primary/70 border-t border-t-primary hover:from-primary/70 hover:to-primary/90 dark:hover:from-primary/80 dark:hover:to-primary/70 focus-visible:ring-luminous/40 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2"
          >
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/"
            className="border-border/20 hover:border-luminous/60 hover:text-luminous focus-visible:ring-luminous/40 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
          >
            <Home className="size-4" aria-hidden />
            Back to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
