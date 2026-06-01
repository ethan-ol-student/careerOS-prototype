"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useMilestoneProgress,
  type MilestoneProgressState,
} from "@/lib/dashboard/useMilestoneProgress";
import type {
  CandidateDashboardData,
  PhaseDashboardConfig,
} from "@/lib/dashboard/types";

/**
 * Shares one `useMilestoneProgress` instance for the active phase
 * between the `PhaseIndicator` (which shows progress toward the next
 * phase) and the `GatekeeperChecklist` (which renders + toggles the
 * milestones). Running the hook once here keeps both perfectly in
 * sync — a toggle in the checklist immediately moves the indicator.
 */
interface MilestonesContextValue {
  config: PhaseDashboardConfig;
  data: CandidateDashboardData;
  progress: MilestoneProgressState;
}

const MilestonesContext = createContext<MilestonesContextValue | undefined>(
  undefined,
);

export function MilestonesProvider({
  config,
  data,
  children,
}: {
  config: PhaseDashboardConfig;
  data: CandidateDashboardData;
  children: ReactNode;
}) {
  const progress = useMilestoneProgress(
    data.userId,
    config.phase,
    config.milestones,
    data,
  );

  return (
    <MilestonesContext.Provider value={{ config, data, progress }}>
      {children}
    </MilestonesContext.Provider>
  );
}

export function useDashboardMilestones(): MilestonesContextValue {
  const ctx = useContext(MilestonesContext);
  if (!ctx) {
    throw new Error(
      "useDashboardMilestones must be used inside a MilestonesProvider",
    );
  }
  return ctx;
}
