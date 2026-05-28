import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { ButtonVariant, ButtonSize } from "./Button";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "text-primary-foreground shadow-sm bg-linear-to-b " +
    "from-primary/60 to-primary/100 dark:from-primary/100 dark:to-primary/70 " +
    "border-t border-t-primary " +
    "hover:from-primary/70 hover:to-primary/90 dark:hover:from-primary/80 dark:hover:to-primary/70",
  outline:
    "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  glow: "glass-4 hover:glass-5 shadow-md text-foreground",
  secondary:
    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-foreground underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  xs: "h-7 rounded-md px-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-5",
  icon: "size-9",
};

export interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  external?: boolean;
}

export function LinkButton({
  href,
  children,
  variant = "default",
  size = "lg",
  icon,
  iconRight,
  className,
  external,
}: LinkButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noreferrer"
      >
        {icon}
        {children}
        {iconRight}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
