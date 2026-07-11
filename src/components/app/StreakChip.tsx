"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface GamState {
  xpTotal: number;
  streak: { current: number; best: number; cadence: "daily" | "monthly" };
  checkedInThisPeriod: boolean;
}

/**
 * Compact top-nav streak: age-tuned cadence (daily flame for younger
 * phases, quiet monthly calendar for mid-career+), one check-in action.
 * Replaces the old full-width GamificationWidget — same API, one line
 * of chrome instead of a dashboard band.
 */
export function StreakChip() {
  const [state, setState] = useState<GamState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/gamification", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (json?.ok) setState(json.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  if (!state) return null;
  const monthly = state.streak.cadence === "monthly";
  const Icon = monthly ? CalendarCheck : Flame;
  const unit = monthly ? "month" : "day";

  return (
    <span
      className="border-border/15 bg-foreground/2 flex min-h-11 items-center gap-2 rounded-lg border px-2.5"
      title={`${state.streak.current}-${unit} streak (best ${state.streak.best}) · ${state.xpTotal} XP — missing one ${unit} never resets it`}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-4",
          state.streak.current > 0 ? "text-clover" : "text-muted-foreground",
        )}
      />
      <span className="text-sm font-medium tabular-nums">
        {state.streak.current}
        <span className="text-muted-foreground ml-1 hidden text-xs sm:inline">
          {unit}
          {state.streak.current === 1 ? "" : "s"}
        </span>
      </span>
      {!state.checkedInThisPeriod && (
        <Button
          size="xs"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await fetch("/api/me/checkin", { method: "POST" });
            await load();
            setBusy(false);
          }}
        >
          {busy ? "…" : "Check in"}
        </Button>
      )}
    </span>
  );
}
