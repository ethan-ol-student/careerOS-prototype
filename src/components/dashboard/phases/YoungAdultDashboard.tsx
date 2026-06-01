"use client";

import { Target, FileCheck2, GitCompareArrows, CheckCircle2, Circle } from "lucide-react";
import { Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ChapterTimetableCard } from "@/components/dashboard/ChapterTimetableCard";
import { GatekeeperChecklist } from "@/components/dashboard/GatekeeperChecklist";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
  StatTile,
  EmptyHint,
} from "@/components/dashboard/PhaseWidgetGrid";
import { cn } from "@/lib/utils";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

export function YoungAdultDashboard({ data }: PhaseDashboardProps) {
  const p = data.portfolio;

  // Portfolio completeness — computed entirely from REAL portfolio data.
  const dimensions = [
    { label: "Headline", done: p.headline.trim().length > 0, weight: 15 },
    { label: "Summary", done: p.summary.trim().length > 0, weight: 15 },
    { label: "Skills (3+)", done: p.skills.length >= 3, weight: 20 },
    { label: "Projects", done: p.projectCount > 0, weight: 20 },
    { label: "Experience", done: p.experienceCount > 0, weight: 15 },
    { label: "Bio", done: p.hasBio, weight: 15 },
  ];
  const score = dimensions.reduce((s, d) => s + (d.done ? d.weight : 0), 0);

  const targetRoles = data.targetRoles;
  const opportunityTypes = data.ai?.opportunityTypes ?? [];
  const improve = data.skillsToImprove;

  return (
    <>
      <PhaseWidgetGrid>
        {/* Portfolio completeness score (real) */}
        <Col span={12} lg={5}>
          <DashboardCard glow="luminous" className="h-full">
            <WidgetHeader
              icon={FileCheck2}
              eyebrow="Portfolio completeness"
              title="Internship-ready score"
              description="How close your Living Portfolio is to application-ready."
            />
            <ScoreBar label="Completeness" value={score} accent="luminous" />
            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {dimensions.map((d) => (
                <li
                  key={d.label}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    d.done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {d.done ? (
                    <CheckCircle2 className="text-clover size-3.5 shrink-0" />
                  ) : (
                    <Circle className="size-3.5 shrink-0" />
                  )}
                  {d.label}
                </li>
              ))}
            </ul>
          </DashboardCard>
        </Col>

        {/* Target role metrics (real) */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Target}
              eyebrow="Target role metrics"
              title="Where you're aiming"
              hint={`${targetRoles.length} role${targetRoles.length === 1 ? "" : "s"}`}
            />
            {targetRoles.length ? (
              <ul className="mb-4 flex flex-wrap gap-1.5">
                {targetRoles.map((r) => (
                  <li key={r}>
                    <Chip tone="luminous">{r}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint className="mb-4">
                Add target roles in onboarding so we can map your readiness.
              </EmptyHint>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatTile
                label="Target roles"
                value={targetRoles.length}
                accent="luminous"
              />
              <StatTile label="Skills" value={p.skills.length} />
              <StatTile label="Projects" value={p.projectCount} />
              <StatTile
                label="Opportunity types"
                value={opportunityTypes.length || "—"}
              />
              <StatTile
                label="Availability"
                value={data.ai?.availability ? "Set" : "—"}
              />
              <StatTile
                label="Timeline"
                value={data.ai?.timeline ? "Set" : "—"}
              />
            </div>
          </DashboardCard>
        </Col>

        {/* Skill mapping — have vs. want to improve (real) */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={GitCompareArrows}
              eyebrow="Skill mapping"
              title="Have vs. need"
              description="Skills you already have, mapped against the gaps you want to close."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-clover mb-2 text-[11px] font-semibold uppercase tracking-wider">
                  You have ({data.currentSkills.length})
                </p>
                {data.currentSkills.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {data.currentSkills.map((s) => (
                      <li key={s}>
                        <Chip tone="clover">{s}</Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyHint>No skills logged yet.</EmptyHint>
                )}
              </div>
              <div>
                <p className="text-luminous mb-2 text-[11px] font-semibold uppercase tracking-wider">
                  Want to improve ({improve.length})
                </p>
                {improve.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {improve.map((s) => (
                      <li key={s}>
                        <Chip tone="luminous">{s}</Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyHint>
                    No growth targets set — add a few to guide your learning.
                  </EmptyHint>
                )}
              </div>
            </div>
          </DashboardCard>
        </Col>

        {/* Planner continuity — real chapter/timetable data */}
        <Col span={12} lg={5}>
          <ChapterTimetableCard className="h-full" />
        </Col>
      </PhaseWidgetGrid>

      <PhaseWidgetGrid topLine>
        <Col span={12}>
          <GatekeeperChecklist />
        </Col>
      </PhaseWidgetGrid>
    </>
  );
}
