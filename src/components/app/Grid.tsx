import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 12-column grid scoped to the launch-ui container width.
 * Every internal page uses this as its main layout primitive.
 */
export function Grid12({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-container mx-auto grid grid-cols-12 gap-4 px-4 sm:gap-6",
        className,
      )}
      {...props}
    />
  );
}

interface ColProps extends React.ComponentProps<"div"> {
  /** Mobile (default) span — defaults to 12 (full row). */
  span?: number;
  /** Tablet (md) span override. */
  md?: number;
  /** Desktop (lg) span override. */
  lg?: number;
  /** Optional column-start override (lg breakpoint). */
  startLg?: number;
}

const SPAN_BASE: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};
const SPAN_MD: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};
const SPAN_LG: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};
const START_LG: Record<number, string> = {
  1: "lg:col-start-1",
  2: "lg:col-start-2",
  3: "lg:col-start-3",
  4: "lg:col-start-4",
  5: "lg:col-start-5",
  6: "lg:col-start-6",
  7: "lg:col-start-7",
  8: "lg:col-start-8",
  9: "lg:col-start-9",
  10: "lg:col-start-10",
  11: "lg:col-start-11",
  12: "lg:col-start-12",
};

export function Col({
  span = 12,
  md,
  lg,
  startLg,
  className,
  ...props
}: ColProps) {
  return (
    <div
      className={cn(
        SPAN_BASE[span],
        md != null && SPAN_MD[md],
        lg != null && SPAN_LG[lg],
        startLg != null && START_LG[startLg],
        className,
      )}
      {...props}
    />
  );
}
