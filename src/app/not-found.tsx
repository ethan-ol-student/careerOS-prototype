import Link from "next/link";
import { Compass, Home, Briefcase } from "lucide-react";

/**
 * Branded 404 page. Rendered both for missing static routes and for
 * any dynamic route that calls notFound(). Keeps the surface consistent
 * with the landing page — no shell, no providers required.
 */
export default function NotFound() {
  return (
    <main className="bg-background text-foreground relative flex min-h-screen w-full items-center justify-center px-4">
      <div className="glass-3 ring-border/60 mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl p-8 text-center ring-1 sm:p-10">
        <span className="bg-luminous/15 text-luminous-soft flex size-12 items-center justify-center rounded-2xl">
          <Compass className="size-6" aria-hidden />
        </span>

        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          404 · Off the map
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          This page isn&apos;t on the trajectory.
        </h1>

        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist — or it might
          have moved as Career OS evolved. Pick a direction below and
          we&apos;ll get you back on track.
        </p>

        <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="text-primary-foreground bg-linear-to-b from-primary/60 to-primary/100 dark:from-primary/100 dark:to-primary/70 border-t border-t-primary hover:from-primary/70 hover:to-primary/90 dark:hover:from-primary/80 dark:hover:to-primary/70 focus-visible:ring-luminous/40 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2"
          >
            <Home className="size-4" aria-hidden />
            Back to landing
          </Link>
          <Link
            href="/candidate/dashboard"
            className="border-border/20 hover:border-luminous/60 hover:text-luminous focus-visible:ring-luminous/40 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
          >
            Open candidate dashboard
          </Link>
          <Link
            href="/employers/marketplace"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-luminous/40 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
          >
            <Briefcase className="size-4" aria-hidden />
            Employer marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
