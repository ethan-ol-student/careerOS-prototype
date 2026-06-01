"use client";

import {
  KanbanSquare,
  ListChecks,
  LineChart,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { ChapterTimetableCard } from "@/components/dashboard/ChapterTimetableCard";
import { GatekeeperChecklist } from "@/components/dashboard/GatekeeperChecklist";
import { ReadinessGrowthSection } from "@/components/dashboard/phases/shared/ReadinessGrowthSection";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
  StatTile,
  MockBadge,
} from "@/components/dashboard/PhaseWidgetGrid";
import { cn } from "@/lib/utils";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

// ── Mock fallback data (no backend job-tracking tables yet) ─────────
// A real pipeline would come from an applications table. Until then the
// board renders demo cards, clearly flagged with <MockBadge />.
interface PipelineCard {
  role: string;
  company: string;
}
const MOCK_PIPELINE: { stage: string; tone: string; items: PipelineCard[] }[] = [
  {
    stage: "Wishlist",
    tone: "border-border/60 text-muted-foreground",
    items: [
      { role: "Frontend Engineer", company: "Stripe" },
      { role: "Product Analyst", company: "Notion" },
    ],
  },
  {
    stage: "Applied",
    tone: "border-luminous/40 text-luminous",
    items: [
      { role: "Software Engineer", company: "Grab" },
      { role: "Data Engineer", company: "Shopee" },
    ],
  },
  {
    stage: "Interviewing",
    tone: "border-yellow-400/50 text-yellow-400",
    items: [{ role: "Junior SWE", company: "Sea Ltd" }],
  },
  {
    stage: "Offer",
    tone: "border-clover/50 text-clover",
    items: [],
  },
];

// Demo market signal — a real version would query a comp dataset.
const MOCK_MARKET = {
  median: "$72k",
  range: "$58k – $94k",
  demandIndex: 78,
  trend: "+6% YoY",
};

export function EarlyCareerDashboard({ data }: PhaseDashboardProps) {
  const primaryRole = data.targetRoles[0] || data.targetJob || "your target role";

  return (
    <>
      <PhaseWidgetGrid>
        {/* Job tracking pipeline — Kanban (mock) */}
        <Col span={12}>
          <DashboardCard glow="clover">
            <WidgetHeader
              icon={KanbanSquare}
              eyebrow="Job pipeline"
              title="Track applications, Kanban style"
              accent="clover"
              description="Move roles from wishlist to offer as you progress."
              action={<MockBadge label="Demo board" />}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MOCK_PIPELINE.map((col) => (
                <div
                  key={col.stage}
                  className="bg-card/30 border-border/40 flex flex-col gap-2 rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        col.tone,
                      )}
                    >
                      {col.stage}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {col.items.length}
                    </span>
                  </div>
                  {col.items.length ? (
                    col.items.map((c) => (
                      <div
                        key={`${c.role}-${c.company}`}
                        className="border-border/40 bg-background/40 rounded-lg border px-3 py-2"
                      >
                        <p className="truncate text-sm font-medium">{c.role}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {c.company}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground/70 rounded-lg border border-dashed border-border/40 px-3 py-4 text-center text-[11px]">
                      Empty
                    </p>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        </Col>

        {/* Active applications summary (mock counts) */}
        <Col span={12} lg={5}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={ListChecks}
              eyebrow="Active applications"
              title="In flight right now"
              action={<MockBadge />}
            />
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Applied" value={2} accent="luminous" />
              <StatTile label="Interviewing" value={1} />
              <StatTile label="Offers" value={0} />
              <StatTile label="Wishlist" value={2} />
            </div>
            <p className="text-muted-foreground mt-3 text-[11px]">
              Connect a tracker to replace these demo counts with your live
              applications.
            </p>
          </DashboardCard>
        </Col>

        {/* Salary / market value tracking (mock + real target role) */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={LineChart}
              eyebrow="Market value"
              title="Salary & demand signal"
              accent="clover"
              description={
                <>
                  Benchmark for{" "}
                  <span className="text-foreground font-medium">
                    {primaryRole}
                  </span>
                  .
                </>
              }
              action={<MockBadge label="Sample comp" />}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile
                label="Median"
                value={MOCK_MARKET.median}
                accent="clover"
              />
              <StatTile label="Range" value={MOCK_MARKET.range} />
              <StatTile
                label="Demand"
                value={`${MOCK_MARKET.demandIndex}`}
                sub={
                  <span className="text-clover inline-flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    {MOCK_MARKET.trend}
                  </span>
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Building2 className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground text-xs">
                Industries:
              </span>
              {(data.ai?.interestedIndustries ?? []).slice(0, 4).map((i) => (
                <Chip key={i} tone="neutral">
                  {i}
                </Chip>
              ))}
              {(data.ai?.interestedIndustries ?? []).length === 0 ? (
                <span className="text-muted-foreground/70 text-xs">
                  add some in onboarding
                </span>
              ) : null}
            </div>
          </DashboardCard>
        </Col>

        {/* Planner continuity — real chapter/timetable data */}
        <Col span={12}>
          <ChapterTimetableCard />
        </Col>
      </PhaseWidgetGrid>

      {/* Signature growth loop → readiness toward target jobs (real). */}
      <ReadinessGrowthSection data={data} />

      <PhaseWidgetGrid topLine>
        <Col span={12}>
          <GatekeeperChecklist />
        </Col>
      </PhaseWidgetGrid>
    </>
  );
}
