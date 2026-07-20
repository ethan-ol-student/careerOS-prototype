"use client";

import { Check } from "lucide-react";
import { ALL_PHASES } from "@/lib/dev/testMode";
import { getPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { cn } from "@/lib/utils";
import type { CareerPhase } from "@/lib/dashboard/types";

/**
 * Career Phase Tester — switches the test candidate's `careerStage`
 * (persisted in the DB via `/api/dev/state`). The unified dashboard then
 * renders the matching phase layout without a URL change.
 */
export function TestPhaseSwitcher({
  current,
  busy,
  onSelect,
}: {
  current: CareerPhase | null;
  busy: boolean;
  onSelect: (phase: CareerPhase) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ALL_PHASES.map((phase) => {
        const cfg = getPhaseConfig(phase);
        const active = current === phase;
        return (
          <button
            key={phase}
            type="button"
            disabled={busy}
            onClick={() => onSelect(phase)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors disabled:opacity-50",
              active
                ? "border-luminous bg-luminous/10"
                : "border-border/60 bg-card/40 hover:border-luminous/40",
            )}
          >
            <span className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "text-sm font-semibold",
                  active && "text-luminous",
                )}
              >
                {cfg.label}
              </span>
              {active ? <Check className="text-luminous size-4" /> : null}
            </span>
            <span className="text-muted-foreground block font-mono text-[0.6875rem]">
              {phase}
            </span>
          </button>
        );
      })}
    </div>
  );
}
