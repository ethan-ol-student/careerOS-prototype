import { cn } from "@/lib/utils";

export type ChipTone =
  | "neutral"
  | "luminous"
  | "clover"
  | "warning";

/* Design-system pills: faint white-tint neutral, soft accent text on
   a 10% accent wash for the toned variants. */
const TONE_CLASSES: Record<ChipTone, string> = {
  neutral: "bg-foreground/3 border-border/15 text-foreground/90",
  luminous: "bg-luminous/10 text-luminous-soft border-luminous/30",
  clover: "bg-clover/10 text-clover-soft border-clover/30",
  warning:
    "bg-yellow-400/15 text-yellow-400 border-yellow-400/40",
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  /** Optional leading icon (already sized). */
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Small inline chip used for skills, growth signals, status labels.
 * Extracted from many duplicate inline spans across the marketplace
 * surfaces — the default tone matches the previous "skill chip"
 * styling, while the luminous/clover/warning tones cover the
 * existing match/readiness/growth pills.
 */
export function Chip({
  tone = "neutral",
  icon,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
