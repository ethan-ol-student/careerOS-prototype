import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Design-system select: strips the native widget face (which ignores
 * dark tokens on some platforms) and paints the standard input recipe
 * with a chevron affordance. Pass sizing/width via className.
 */
export function Select({
  className,
  wrapperClassName,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
}) {
  return (
    <span className={cn("relative inline-flex", wrapperClassName)}>
      <select
        {...props}
        className={cn(
          "bg-background border-border/15 text-foreground focus:border-luminous/60 w-full cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-8 text-sm outline-none scheme-dark",
          className,
        )}
      />
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2"
      />
    </span>
  );
}
