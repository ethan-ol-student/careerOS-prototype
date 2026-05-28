"use client";

import {
  CirclePlus,
  UserCog,
  TrendingUp,
  Briefcase,
  Eye,
  Sparkles,
  Gauge,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LoopStep =
  | "idle"
  | "add-skill"
  | "profile"
  | "trajectory"
  | "opportunities"
  | "visibility"
  | "ai"
  | "progress"
  | "loop";

interface LoopNode {
  step: LoopStep;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const LOOP_NODES: LoopNode[] = [
  { step: "add-skill", label: "1. Skill added", short: "Skill", icon: CirclePlus },
  { step: "profile", label: "2. Profile evolves", short: "Profile", icon: UserCog },
  { step: "trajectory", label: "3. Trajectory updates", short: "Trajectory", icon: TrendingUp },
  { step: "opportunities", label: "4. Opportunities surface", short: "Jobs", icon: Briefcase },
  { step: "visibility", label: "5. Employer visibility", short: "Visibility", icon: Eye },
  { step: "ai", label: "6. AI recommends", short: "AI", icon: Sparkles },
  { step: "progress", label: "7. Progress advances", short: "Progress", icon: Gauge },
  { step: "loop", label: "8. Loop", short: "Loop", icon: RefreshCw },
];

interface GrowthLoopProps {
  current: LoopStep;
  /** Steps the user has reached at least once. */
  reached: Set<LoopStep>;
  className?: string;
}

/**
 * Horizontal cycle visualization — eight nodes connected by a
 * dashed line, the active one glows in Luminous, completed ones
 * use Clover green, and the loop reverses back to the start.
 */
export function GrowthLoop({ current, reached, className }: GrowthLoopProps) {
  return (
    <div className={cn("glass-3 relative overflow-hidden rounded-2xl p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-luminous text-xs font-medium uppercase tracking-[0.18em]">
            The Career OS growth loop
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Every new skill ripples through your profile, trajectory, opportunities, and visibility.
          </p>
        </div>
        <span className="bg-luminous/15 text-luminous hidden rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider sm:inline-flex">
          Live
        </span>
      </div>

      <div className="relative">
        {/* Dashed connector */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-6 -z-10 border-t border-dashed border-border/60"
        />
        <ol className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
          {LOOP_NODES.map((node) => {
            const isActive = current === node.step;
            const isComplete = reached.has(node.step) && !isActive;
            const Icon = node.icon;
            return (
              <li
                key={node.step}
                className="flex min-w-[64px] flex-1 flex-col items-center gap-2 text-center"
              >
                <span
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-full border transition-all",
                    isActive &&
                      "border-luminous bg-luminous text-white shadow-[0_0_0_6px_rgba(77,122,255,0.18)]",
                    isComplete &&
                      "border-clover/60 bg-clover/15 text-clover",
                    !isActive &&
                      !isComplete &&
                      "border-border/60 bg-card/60 text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {isActive && (
                    <span
                      aria-hidden
                      className="bg-luminous/40 absolute inset-0 -z-10 animate-ping rounded-full"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider transition-colors",
                    isActive
                      ? "text-foreground"
                      : isComplete
                        ? "text-clover"
                        : "text-muted-foreground",
                  )}
                >
                  {node.short}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        Step{" "}
        <span className="font-mono text-foreground">
          {current === "idle"
            ? "0"
            : LOOP_NODES.findIndex((n) => n.step === current) + 1}
        </span>{" "}
        of <span className="font-mono">8</span> ·{" "}
        {current === "idle"
          ? "Add a new skill to start the loop."
          : LOOP_NODES.find((n) => n.step === current)?.label}
      </p>
    </div>
  );
}
