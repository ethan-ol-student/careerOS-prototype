import * as React from "react";
import { cn } from "@/lib/utils";

export function LayoutLines({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 top-0 z-0", className)}
      {...props}
    >
      <div className="max-w-container line-y line-dashed mx-auto flex h-full flex-col" />
    </section>
  );
}
