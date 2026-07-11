import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "outline"
  | "glow"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "xs" | "icon";

/* Career OS Design System: the primary CTA is an accent gradient with
   a lighter bevel edge on top. Colors come from the --btn-* vars so an
   employer shell (data-role-accent="employer") recolors it to the
   clover ramp — one variant, both marketplace sides. */
export const variantClasses: Record<ButtonVariant, string> = {
  default:
    "font-semibold text-(--btn-fg) shadow-sm " +
    "bg-linear-to-b from-(--btn-from) to-(--btn-to) " +
    "border-t border-t-(--btn-edge) " +
    "hover:brightness-110 active:brightness-95",
  outline:
    "border border-border/20 bg-transparent shadow-xs hover:bg-accent/50 hover:text-foreground",
  glow: "glass-4 hover:glass-5 shadow-md text-foreground",
  secondary:
    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-foreground underline-offset-4 hover:underline",
};

export const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  xs: "h-7 rounded-lg px-2",
  sm: "h-8 rounded-lg px-3 text-xs",
  lg: "h-11 rounded-lg px-5",
  icon: "size-9",
};

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,filter] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export type { ButtonVariant, ButtonSize };
