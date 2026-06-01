import * as React from "react";
import { cn } from "@/lib/utils";

type GlowVariant = "top" | "above" | "bottom" | "below" | "center";

const variantClasses: Record<GlowVariant, string> = {
  top: "top-0",
  above: "-top-[128px]",
  bottom: "bottom-0",
  below: "-bottom-[128px]",
  center: "top-[50%]",
};

interface GlowProps extends React.ComponentProps<"div"> {
  variant?: GlowVariant;
}

export function Glow({ className, variant = "top", ...props }: GlowProps) {
  return (
    <div
      data-slot="glow"
      aria-hidden
      className={cn(
        // Decorative only — must never intercept clicks (it sits over
        // CTA sections and was swallowing button presses).
        "pointer-events-none absolute w-full",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "from-brand-foreground/50 to-brand-foreground/0 absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[512px] dark:opacity-100",
          variant === "center" && "-translate-y-1/2",
        )}
      />
      <div
        className={cn(
          "from-brand/30 to-brand-foreground/0 absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] bg-radial from-10% to-60% opacity-20 sm:h-[256px] dark:opacity-100",
          variant === "center" && "-translate-y-1/2",
        )}
      />
    </div>
  );
}
