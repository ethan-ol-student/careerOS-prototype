"use client";

import type { ReactNode } from "react";
import { Sparkles, Layers } from "lucide-react";
import { Grid12, Col } from "@/components/app/Grid";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { getPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { DashboardCard, WidgetHeader } from "./PhaseWidgetGrid";
import { ArchetypeBadge, GamificationWidget } from "./GamificationWidget";
import { MilestonesProvider } from "./MilestonesContext";
import { PhaseIndicator } from "./PhaseIndicator";
import { TrajectoriesPanel } from "./TrajectoriesPanel";
import type { CandidateDashboardData } from "@/lib/dashboard/types";

/**
 * The persistent dashboard frame that stays visually consistent across
 * every phase. Only the goal header text, the focus-areas overview, the
 * phase indicator's content, and the inner `children` (the phase
 * widgets + gatekeeper) change between phases.
 *
 * Sits INSIDE `AppShell`, which already provides the global candidate
 * header (Career OS · Candidate brand, notification bell, user menu)
 * and the auth gating — so this shell focuses purely on the dashboard
 * surface and never touches routing.
 */
export function DashboardShell({
  data,
  children,
}: {
  data: CandidateDashboardData;
  children: ReactNode;
}) {
  const config = getPhaseConfig(data.phase);
  const summary =
    data.ai?.dashboardPersonalizationSummary?.trim() || config.purpose;

  return (
    <MilestonesProvider config={config} data={data}>
      <PageHeader
        eyebrow={`${config.label} phase · ${config.ageHint}`}
        title={config.goalHeader}
        description={summary}
        actions={
          <span className="flex items-center gap-2">
            <ArchetypeBadge />
            <Badge variant="outline" className="hidden sm:inline-flex">
              <Sparkles className="size-3 text-luminous" />
              <span className="text-muted-foreground">
                Good day, {data.firstName}
              </span>
            </Badge>
          </span>
        }
      />

      {/* Age-tuned engagement: daily ring/XP for younger phases, a quiet
          Monthly Career Check-Up for mid-career+. */}
      <GamificationWidget data={data} />

      {/* Persistent phase band — focus overview + active phase indicator. */}
      <section className="px-4 pt-8">
        <Grid12>
          <Col span={12} lg={8}>
            <DashboardCard className="h-full">
              <WidgetHeader
                icon={Layers}
                eyebrow="This phase is about"
                title={config.goalHeader}
                accent={config.accent}
              />
              <ul className="flex flex-wrap gap-2">
                {config.focusWidgets.map((w) => (
                  <li key={w.id}>
                    <Chip
                      tone={config.accent === "clover" ? "clover" : "luminous"}
                    >
                      {w.label}
                    </Chip>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                {config.focusWidgets.map((w) => w.hint).filter(Boolean).join(" · ")}
              </p>
            </DashboardCard>
          </Col>
          <Col span={12} lg={4} className="flex">
            <PhaseIndicator className="h-full" />
          </Col>
        </Grid12>
      </section>

      {/* Phase-specific inner view (selected via the registry). */}
      {children}

      {/* Phase-agnostic landscape view — multiple realistic paths with
          honest trade-offs (principles #1 & #2). Shown for every phase. */}
      <TrajectoriesPanel data={data} />
    </MilestonesProvider>
  );
}
