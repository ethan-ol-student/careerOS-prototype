"use client";

import type { ComponentType } from "react";
import type { CareerPhase, PhaseDashboardProps } from "@/lib/dashboard/types";
import { StudentDashboard } from "./phases/StudentDashboard";
import { YoungAdultDashboard } from "./phases/YoungAdultDashboard";
import { EarlyCareerDashboard } from "./phases/EarlyCareerDashboard";
import { MidCareerDashboard } from "./phases/MidCareerDashboard";
import { SeniorCareerDashboard } from "./phases/SeniorCareerDashboard";
import { ExecutiveDashboard } from "./phases/ExecutiveDashboard";

/**
 * Registry Pattern — the single mapping from a normalized
 * `CareerPhase` to the phase-specific dashboard component. Adding a
 * new phase = add the union member, its config, and one entry here.
 *
 * This is what lets ONE dashboard route render six different layouts
 * without ever changing the URL.
 */
export const PHASE_DASHBOARD_REGISTRY: Record<
  CareerPhase,
  ComponentType<PhaseDashboardProps>
> = {
  student: StudentDashboard,
  young_adult: YoungAdultDashboard,
  early_career: EarlyCareerDashboard,
  mid_career: MidCareerDashboard,
  senior_career: SeniorCareerDashboard,
  executive: ExecutiveDashboard,
};

/**
 * Looks up and renders the dashboard for the resolved phase. The phase
 * is already normalized upstream (`useCandidateDashboard`), so the
 * lookup always hits; the `?? YoungAdultDashboard` is a belt-and-braces
 * guard so a future phase gap degrades gracefully instead of crashing.
 */
export function PhaseDashboardRegistry({ data }: PhaseDashboardProps) {
  const Dashboard =
    PHASE_DASHBOARD_REGISTRY[data.phase] ?? YoungAdultDashboard;
  return <Dashboard data={data} />;
}
