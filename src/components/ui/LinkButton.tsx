import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  variantClasses,
  sizeClasses,
  type ButtonVariant,
  type ButtonSize,
} from "./Button";

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
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,filter] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
