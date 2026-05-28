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
 * candidate signal (match / readiness). Extracted from inline
 * duplicates in CandidateCard, CandidateDetailModal,
 * SavedCandidateCard, and the public profile page — visual output
 * is intentionally identical to the previous inline versions.
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
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
          {label}
        </p>
        {trailing}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span
          className={cn(
            "font-semibold",
            VALUE_TEXT_SIZE[size],
            TEXT[accent],
          )}
        >
          {safe}
        </span>
        <span className="text-muted-foreground text-[10px]">/ 100</span>
      </div>
      <div className="bg-muted/40 h-1 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", BG[accent])}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}
