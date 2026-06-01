"use client";

import { Check, CircleCheck, ListChecks, RotateCcw, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNextPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { useDashboardMilestones } from "./MilestonesContext";
import { DashboardCard, WidgetHeader } from "./PhaseWidgetGrid";
import type { PhaseAccent } from "@/lib/dashboard/types";

const ACCENT_BG: Record<PhaseAccent, string> = {
  luminous: "from-luminous to-luminous-soft",
  clover: "from-clover to-clover-soft",
};
const ACCENT_CHECK: Record<PhaseAccent, string> = {
  luminous: "bg-luminous border-luminous text-white",
  clover: "bg-clover border-clover text-white",
};

/**
 * "Milestones Required to Transition" — the gatekeeper section every
 * phase dashboard renders. Data-driven: each criterion derives its
 * completion from real candidate data where a signal exists, and the
 * user can manually check/uncheck (override) any item.
 *
 * Persistence today is local-only (see `useMilestoneProgress`); the
 * structure is wired so a future `/api/me/milestones` route can persist
 * overrides without changing this component.
 */
export function GatekeeperChecklist({ className }: { className?: string }) {
  const { config, progress } = useDashboardMilestones();
  const { items, toggle, resetOverride, completed, total, pct } = progress;
  const next = getNextPhaseConfig(config.phase);
  const accent = config.accent;
  const allDone = total > 0 && completed === total;

  return (
    <DashboardCard
      data-judge-target="gatekeeper-checklist"
      className={className}
      glow={accent}
    >
      <WidgetHeader
        icon={ListChecks}
        eyebrow="Gatekeeper"
        title="Milestones Required to Transition"
        accent={accent}
        description={
          config.isFinal
            ? "This is the final phase. These are your ongoing focus areas."
            : next
              ? `Clear these to advance to ${config.nextPhase ? next.label : "the next phase"}.`
              : "Clear these to advance to the next phase."
        }
        hint={`${completed}/${total} done`}
      />

      {/* Aggregate progress bar. */}
      <div className="mb-5">
        <div className="bg-muted/40 h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full bg-linear-to-r transition-all duration-700",
              ACCENT_BG[accent],
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {items.map(({ milestone, checked, derived, overridden }) => {
          const checkboxId = `milestone-${milestone.id}`;
          return (
            <li
              key={milestone.id}
              className={cn(
                "border-border/40 bg-card/40 flex items-start gap-3 rounded-lg border p-3 transition-colors",
                checked && "border-border/60",
              )}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-labelledby={checkboxId}
                onClick={() => toggle(milestone.id)}
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  checked
                    ? ACCENT_CHECK[accent]
                    : "border-border bg-background/40 hover:border-foreground/40",
                )}
              >
                {checked ? (
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                ) : null}
              </button>

              <div className="min-w-0 flex-1">
                <label
                  id={checkboxId}
                  className={cn(
                    "block cursor-pointer text-sm font-medium leading-snug",
                    checked && "text-foreground",
                  )}
                  onClick={() => toggle(milestone.id)}
                >
                  {milestone.label}
                </label>
                {milestone.description ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {milestone.description}
                  </p>
                ) : null}

                {/* Provenance: auto vs. manual, so users trust the state. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {milestone.derive ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider",
                        derived ? "text-clover" : "text-muted-foreground",
                      )}
                    >
                      <CircleCheck className="size-3" aria-hidden />
                      {derived ? "Auto-detected from your data" : "Not yet detected"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Lock className="size-3" aria-hidden />
                      Manual check
                    </span>
                  )}
                  {overridden ? (
                    <button
                      type="button"
                      onClick={() => resetOverride(milestone.id)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[10px] uppercase tracking-wider transition-colors"
                    >
                      <RotateCcw className="size-3" aria-hidden />
                      Reset to auto
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {allDone && !config.isFinal ? (
        <div className="border-clover/30 bg-clover/10 text-clover mt-4 rounded-lg border px-3 py-2.5 text-xs">
          🎉 All milestones complete — you&apos;re ready to transition
          {next ? ` to ${next.label}` : ""}. A coach will confirm your move.
        </div>
      ) : null}

      {/* Local-persistence disclosure — honest about where state lives. */}
      <p className="text-muted-foreground mt-4 text-[11px] leading-relaxed">
        Auto-detected items read from your real profile &amp; portfolio. Manual
        ticks are saved to this device for now.{" "}
        <span className="text-muted-foreground/80">
          {/* TODO(backend): persist via /api/me/milestones when available. */}
          Cross-device sync arrives with milestone persistence.
        </span>
      </p>
    </DashboardCard>
  );
}
