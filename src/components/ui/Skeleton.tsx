import { cn } from "@/lib/utils";

/** Pulsing placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-white/5", className)} aria-hidden />
  );
}

/**
 * Neutral full-page skeleton for data routes — a faux app header + a card
 * grid. Rendered by each segment's `loading.tsx` while the route streams in.
 * Mobile-first: single column, then a 12-col grid at md+.
 */
export function PageSkeleton() {
  return (
    <div
      className="bg-background min-h-screen w-full"
      role="status"
      aria-label="Loading…"
    >
      <div className="max-w-container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Skeleton className="h-6 w-28 sm:w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          <Skeleton className="h-32 md:col-span-7" />
          <Skeleton className="h-32 md:col-span-5" />
          <Skeleton className="h-48 md:col-span-12" />
          <Skeleton className="h-40 md:col-span-6" />
          <Skeleton className="h-40 md:col-span-6" />
        </div>
      </div>
    </div>
  );
}
