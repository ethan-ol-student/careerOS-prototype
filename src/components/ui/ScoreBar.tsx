"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ScoreAccent = "luminous" | "clover";
export type ScoreBarSize = "sm" | "md";

const TEXT: Record<ScoreAccent, string> = {
  luminous: "text-luminous",
  clover: "text-clover",
};
const BG: Record<ScoreAccent, string> = {
  luminous: "bg-luminous",
  clover: "bg-clover",
};

const VALUE_TEXT_SIZE: Record<ScoreBarSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
};

export interface ScoreBarProps {
  label: string;
  /** 0–100. Clamped before rendering. */
  value: number;
  accent?: ScoreAccent;
  /** Visual size — defaults to `md` (used in modals/detail views). */
  size?: ScoreBarSize;
  /** Glass surface class. Defaults to `glass-4` for `sm`, `glass-3` otherwise. */
  surfaceClassName?: string;
  /** Optional trailing slot (e.g. a `<ScoringInfo />` icon). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Shared mini "score dial" used wherever Career OS surfaces a 0–100
 * candidate signal (match / readiness). Design-system signal dial:
 * mono uppercase label, accent number, and a fill that sweeps from 0
 * to its value on mount.
 */
export function ScoreBar({
  label,
  value,
  accent = "luminous",
  size = "md",
  surfaceClassName,
  trailing,
  className,
}: ScoreBarProps) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const surface = surfaceClassName ?? (size === "sm" ? "glass-4" : "glass-3");
  // Paint the 0-state first, then transition to the real value.
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setSweep(safe));
    return () => cancelAnimationFrame(t);
  }, [safe]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg p-3",
        size === "sm" && "p-2",
        surface,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.12em]">
          {label}
        </p>
        {trailing}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span
          className={cn(
            "font-bold",
            VALUE_TEXT_SIZE[size],
            TEXT[accent],
          )}
        >
          {safe}
        </span>
        <span className="text-muted-foreground/80 font-mono text-[10px]">/ 100</span>
      </div>
      <div className="bg-foreground/8 h-1.25 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", BG[accent])}
          style={{
            width: `${sweep}%`,
            transition: "width 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
    </div>
  );
}
