import * as React from "react";
import { cn } from "@/lib/utils";

type MockupType = "mobile" | "responsive";
type MockupFrameSize = "small" | "large";

const mockupVariants: Record<MockupType, string> = {
  mobile: "rounded-[48px] max-w-[350px]",
  responsive: "rounded-lg",
};

export function Mockup({
  className,
  type = "responsive",
  ...props
}: React.ComponentProps<"div"> & { type?: MockupType }) {
  return (
    <div
      data-slot="mockup"
      className={cn(
        "flex relative z-10 overflow-hidden shadow-2xl border border-border/70 dark:border-border/5 dark:border-t-border/15",
        mockupVariants[type],
        className,
      )}
      {...props}
    />
  );
}

const frameVariants: Record<MockupFrameSize, string> = {
  small: "p-2",
  large: "p-4",
};

export function MockupFrame({
  className,
  size = "small",
  ...props
}: React.ComponentProps<"div"> & { size?: MockupFrameSize }) {
  return (
    <div
      data-slot="mockup-frame"
      className={cn(
        "bg-border/50 flex relative z-10 overflow-hidden rounded-2xl dark:bg-border/10",
        frameVariants[size],
        className,
      )}
      {...props}
    />
  );
}
