"use client";

import { Zap } from "lucide-react";
import { usePerformanceMode } from "@/lib/hooks/usePerformanceMode";
import { cn } from "@/lib/utils";

/**
 * "Disable animations for performance" switch — localStorage-backed
 * (device-level, instant, no API) via usePerformanceMode. Stops all
 * decorative motion (job orbit, entrance effects, hover transitions)
 * through the global `html.reduce-motion` class.
 */
export function PerformanceSection() {
  const [enabled, setEnabled] = usePerformanceMode();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Turns off decorative animations everywhere — the job orbit, entrance
        effects, and hover motion. Handy on older devices. Takes effect
        instantly and is saved on this device.
      </p>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Disable animations for performance"
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "flex min-h-11 items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
          enabled
            ? "border-luminous/60 bg-luminous/10"
            : "border-border/15 bg-card/40 hover:border-luminous/40",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Zap className="text-luminous size-4" aria-hidden />
          Disable animations for performance
        </span>
        <span
          aria-hidden
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors",
            enabled ? "bg-luminous" : "bg-muted/60",
          )}
        >
          <span
            className={cn(
              "bg-background absolute top-0.5 size-5 rounded-full transition-transform",
              enabled ? "translate-x-[1.125rem]" : "translate-x-0.5",
            )}
          />
        </span>
      </button>

      <p className="text-muted-foreground text-xs">
        {enabled
          ? "Animations are off — spinners and charts stay visible, just static."
          : "Animations are on (the default, regardless of system settings)."}
      </p>
    </div>
  );
}
