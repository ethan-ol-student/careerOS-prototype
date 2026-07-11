"use client";

import { Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { CareerHealthHome } from "@/components/dashboard/midcareer/CareerHealthHome";
import { useCandidateDashboard } from "@/lib/dashboard/useCandidateDashboard";
import { useUiDensity } from "@/lib/dashboard/useUiDensity";

/**
 * The full mid-career Career Health suite (Fair Pay, Skill Bridge, Next
 * Move, Story Map + the freemium gates) — the cockpit dashboard's
 * "How do I get there?" drill-down for mid-career+ phases.
 */
export default function CareerHealthPage() {
  return (
    <AppShell>
      <CareerHealthContent />
    </AppShell>
  );
}

function CareerHealthContent() {
  const { status, data } = useCandidateDashboard();
  const uiDensity = useUiDensity(data?.phase ?? "mid_career");

  if (status === "loading" || !data) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading Career
        Health…
      </div>
    );
  }

  return (
    <div data-ui-density={uiDensity}>
      <CareerHealthHome data={data} />
    </div>
  );
}
