"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { CareerHealthHome } from "@/components/dashboard/midcareer/CareerHealthHome";
import { useCandidateDashboard } from "@/lib/dashboard/useCandidateDashboard";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";
import { normalizeCareerPhase } from "@/lib/dashboard/phaseConfig";

/**
 * The full mid-career Career Health suite (Fair Pay, Skill Bridge, Next
 * Move, Story Map + the freemium gates). Mid-career+ ONLY.
 *
 * Gating note: we key off the RAW stored career stage (not the dashboard's
 * `young_adult` fallback, which it substitutes whenever careerStage is
 * momentarily unreadable) and only redirect once the authoritative fetch
 * has settled (`aiStatus === "ready"`) AND the phase is a *definite* early
 * phase. An empty/unknown phase never redirects — otherwise a real
 * mid-career user gets bounced during the load window.
 */
export default function CareerHealthPage() {
  return (
    <AppShell>
      <CareerHealthContent />
    </AppShell>
  );
}

const EARLY_PHASES = new Set(["student", "young_adult", "early_career"]);

function CareerHealthContent() {
  const router = useRouter();
  const { status, data } = useCandidateDashboard();
  const { status: aiStatus } = useCandidatesAI();

  // Real phase from stored data, NOT the dashboard's fallback substitute.
  const phase = data ? normalizeCareerPhase(data.rawPhase) : null;
  // Deny only a known early phase, and only after the authoritative fetch
  // has confirmed it — empty/unknown/still-loading is never denied.
  const deny = aiStatus === "ready" && phase !== null && EARLY_PHASES.has(phase);

  useEffect(() => {
    if (deny) router.replace("/candidate/dashboard");
  }, [deny, router]);

  if (status === "loading" || !data || deny) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading Career
        Health…
      </div>
    );
  }

  return (
    <div>
      <CareerHealthHome data={data} />
    </div>
  );
}
