"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STROKE: Record<"luminous" | "clover", string> = {
  luminous: "stroke-luminous",
  clover: "stroke-clover",
};
const TEXT: Record<"luminous" | "clover", string> = {
  luminous: "text-luminous",
  clover: "text-clover",
};

export interface ProgressRingProps {
  /** 0–100. Clamped before rendering. */
  value: number;
  /** Small uppercase label under the number (e.g. "Suitability"). */
  label: string;
  accent?: "luminous" | "clover";
  /** Outer diameter in px. Defaults to 112. */
  size?: number;
  className?: string;
}

/**
 * Compact percentage ring for headline scores (suitability, readiness).
 * Hand-rolled SVG per project convention — the arc sweeps in on mount
 * via a CSS stroke-dashoffset transition.
 */
export function ProgressRing({
  value,
  label,
  accent = "luminous",
  size = 112,
  className,
}: ProgressRingProps) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const r = 45;
  const c = 2 * Math.PI * r;
  // Start the arc at 0 and transition to the real value on mount.
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setSweep(safe));
    return () => cancelAnimationFrame(t);
  }, [safe]);

  return (
    <div
      role="img"
      aria-label={`${label}: ${safe} percent`}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-foreground/10"
          strokeWidth={7}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={cn("fill-none", STROKE[accent])}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (sweep / 100) * c}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold leading-none", TEXT[accent])}>
          {safe}%
        </span>
        <span className="text-muted-foreground mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </span>
    </div>
  );
}
