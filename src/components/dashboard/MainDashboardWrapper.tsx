"use client";

import { Loader2, TriangleAlert, Compass, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { useCandidateDashboard } from "@/lib/dashboard/useCandidateDashboard";
import { DashboardShell } from "./DashboardShell";
import { PhaseDashboardRegistry } from "./PhaseDashboardRegistry";

/**
 * The single Candidate dashboard container.
 *
 * Responsibilities (Step 2 of the spec):
 *  - read the signed-in candidate's resolved dashboard payload
 *    (`useCandidateDashboard`), whose phase comes from the backend;
 *  - render loading / error / setup-required states safely;
 *  - hand the ready payload to the persistent `DashboardShell` and let
 *    `PhaseDashboardRegistry` pick the phase-specific inner view.
 *
 * It NEVER changes the URL when the phase changes — switching phases
 * just swaps the inner component the registry returns. Routing /
 * sign-out / onboarding gating all stay in `AppShell` (the parent).
 */
export function MainDashboardWrapper() {
  const { status, error, data, needsSetup } = useCandidateDashboard();

  if (status === "loading") return <DashboardLoading />;
  if (status === "error") return <DashboardError message={error} />;
  if (needsSetup || !data) return <DashboardSetupRequired />;

  return (
    <DashboardShell data={data}>
      <PhaseDashboardRegistry data={data} />
    </DashboardShell>
  );
}

// ── States ──────────────────────────────────────────────────────────

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="glass-4 ring-luminous/15 w-full max-w-md rounded-2xl p-8 text-center ring-1">
        {children}
      </div>
    </section>
  );
}

function DashboardLoading() {
  return (
    <CenteredState>
      <Loader2 className="text-luminous mx-auto size-7 animate-spin" aria-hidden />
      <p className="mt-4 text-sm font-medium">Loading your dashboard…</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Reading your current phase and personalizing your view.
      </p>
    </CenteredState>
  );
}

function DashboardError({ message }: { message: string | null }) {
  return (
    <CenteredState>
      <span
        aria-hidden
        className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive"
      >
        <TriangleAlert className="size-6" />
      </span>
      <p className="mt-4 text-base font-semibold">We hit a snag</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {message ?? "We couldn't load your dashboard. Please try again."}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-5"
        onClick={() => window.location.reload()}
      >
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </CenteredState>
  );
}

function DashboardSetupRequired() {
  return (
    <CenteredState>
      <span
        aria-hidden
        className="bg-luminous/15 text-luminous mx-auto flex size-12 items-center justify-center rounded-full"
      >
        <Compass className="size-6" />
      </span>
      <p className="mt-4 text-base font-semibold">Let&apos;s set up your phase</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Tell us where you are in your career and we&apos;ll tailor your whole
        dashboard around it.
      </p>
      {/* No auto-redirect here — a clear CTA avoids redirect loops. */}
      <LinkButton
        href="/candidate/onboarding"
        size="default"
        className="mt-5"
        iconRight={<Compass className="size-4" />}
      >
        Start setup
      </LinkButton>
    </CenteredState>
  );
}
