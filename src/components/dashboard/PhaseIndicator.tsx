"use client";

import { Compass, ArrowRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNextPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { useDashboardMilestones } from "./MilestonesContext";
import type { PhaseAccent } from "@/lib/dashboard/types";

const ACCENT_TEXT: Record<PhaseAccent, string> = {
  luminous: "text-luminous",
  clover: "text-clover",
};
const ACCENT_BG: Record<PhaseAccent, string> = {
  luminous: "bg-luminous",
  clover: "bg-clover",
};
const ACCENT_RING: Record<PhaseAccent, string> = {
  luminous: "border-luminous/30 bg-luminous/10",
  clover: "border-clover/30 bg-clover/10",
};

/**
 * Active phase indicator — persistent in the dashboard shell across
 * all phases. Shows the current phase name, a short purpose, and (when
 * the phase isn't terminal) progress toward the next phase derived from
 * the gatekeeper milestones.
 */
export function PhaseIndicator({ className }: { className?: string }) {
  const { config, progress } = useDashboardMilestones();
  const next = getNextPhaseConfig(config.phase);
  const accent = config.accent;

  return (
    <div
      data-judge-target="phase-indicator"
      className={cn("glass-4 w-full rounded-2xl border p-4", className)}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            ACCENT_RING[accent],
            ACCENT_TEXT[accent],
          )}
        >
          {config.isFinal ? (
            <Flag className="size-5" />
          ) : (
            <Compass className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
            Current phase
          </p>
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold leading-tight">
            {config.label}
            <span className="text-muted-foreground text-[11px] font-normal">
              · {config.ageHint}
            </span>
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            {config.purpose}
          </p>
        </div>
      </div>

      {/* Progress toward the next phase (milestone-driven). */}
      {next ? (
        <div className="mt-3">
          <div className="text-muted-foreground mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider">
            <span>Toward {next.label}</span>
            <span className="font-mono">
              {progress.completed}/{progress.total} · {progress.pct}%
            </span>
          </div>
          <div className="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                ACCENT_BG[accent],
              )}
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 inline-flex items-center gap-1 text-[11px]">
            Next
            <ArrowRight className="size-3" aria-hidden />
            <span className="text-foreground">{next.goalHeader}</span>
          </p>
        </div>
      ) : (
        <p
          className={cn(
            "mt-3 rounded-md border px-2.5 py-1.5 text-[11px]",
            ACCENT_RING[accent],
            ACCENT_TEXT[accent],
          )}
        >
          Final phase — focus is on legacy &amp; influence.
        </p>
      )}
    </div>
  );
}
