"use client";

import AppShell from "@/components/app/AppShell";
import { MainDashboardWrapper } from "@/components/dashboard/MainDashboardWrapper";

/**
 * The single, unified Candidate dashboard route.
 *
 * The URL (`/candidate/dashboard`) never changes when the user's phase
 * changes. `AppShell` provides the persistent global candidate frame
 * (brand + Candidate label, notification bell, user menu, auth gating);
 * `MainDashboardWrapper` reads the candidate's current phase from the
 * backend and uses the Registry Pattern to render the matching
 * phase-specific dashboard inside one persistent dashboard shell.
 *
 * See `src/components/dashboard/*` and `src/lib/dashboard/*`.
 */
export default function CandidateDashboardPage() {
  return (
    <AppShell>
      <MainDashboardWrapper />
    </AppShell>
  );
}
