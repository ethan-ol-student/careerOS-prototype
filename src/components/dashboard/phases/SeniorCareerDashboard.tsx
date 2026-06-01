"use client";

import {
  Crown,
  Landmark,
  Users,
  ArrowUpRight,
  GraduationCap,
} from "lucide-react";
import { Col } from "@/components/app/Grid";
import { Button } from "@/components/ui/Button";
import { GatekeeperChecklist } from "@/components/dashboard/GatekeeperChecklist";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
  StatTile,
  MockBadge,
} from "@/components/dashboard/PhaseWidgetGrid";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

// ── Mock fallback data (no backend leadership/advisory tables yet) ──
const MOCK_ADVISORY = [
  { org: "SeedStage Ventures", role: "Technical Advisor", status: "Active" },
  { org: "WomenInTech Foundation", role: "Board Member", status: "Active" },
  { org: "ScaleUp Labs", role: "Advisor (pending)", status: "Pending" },
];
const MOCK_MENTEES = [
  { name: "Aisha R.", focus: "Eng leadership" },
  { name: "Daniel K.", focus: "System design" },
  { name: "Mei L.", focus: "Career pivot" },
];

export function SeniorCareerDashboard({ data }: PhaseDashboardProps) {
  const experienceCount = data.portfolio.experienceCount;

  return (
    <>
      <PhaseWidgetGrid>
        {/* Leadership metrics (mock + real experience count) */}
        <Col span={12} lg={5}>
          <DashboardCard glow="clover" className="h-full">
            <WidgetHeader
              icon={Crown}
              eyebrow="Leadership metrics"
              title="Scope of your impact"
              accent="clover"
              action={<MockBadge />}
            />
            <div className="grid grid-cols-2 gap-2">
              <StatTile
                label="Roles on record"
                value={experienceCount || "—"}
                accent="clover"
              />
              <StatTile label="Teams led" value={4} />
              <StatTile label="People mentored" value={MOCK_MENTEES.length} />
              <StatTile label="Sphere index" value={86} accent="clover" />
            </div>
            <p className="text-muted-foreground mt-3 text-[11px]">
              &ldquo;Roles on record&rdquo; reflects your real portfolio; the
              rest are demo metrics until leadership data is connected.
            </p>
          </DashboardCard>
        </Col>

        {/* External advisory board tracking (mock) */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Landmark}
              eyebrow="Advisory board tracking"
              title="External seats"
              action={<MockBadge />}
            />
            <ul className="flex flex-col gap-2">
              {MOCK_ADVISORY.map((a) => (
                <li
                  key={a.org}
                  className="border-border/40 bg-card/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.org}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {a.role}
                    </p>
                  </div>
                  <span
                    className={
                      a.status === "Active"
                        ? "bg-clover/15 text-clover shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        : "shrink-0 rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400"
                    }
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-3">
              Track a new seat
              <ArrowUpRight />
            </Button>
          </DashboardCard>
        </Col>

        {/* Internal mentorship connection hub (mock) */}
        <Col span={12}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Users}
              eyebrow="Mentorship hub"
              title="Grow the next cohort"
              accent="clover"
              action={<MockBadge />}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MOCK_MENTEES.map((m) => (
                <div
                  key={m.name}
                  className="border-border/40 bg-card/40 flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="bg-clover/15 text-clover flex size-10 shrink-0 items-center justify-center rounded-full">
                    <GraduationCap className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {m.focus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3">
              Connect with a mentee
              <ArrowUpRight />
            </Button>
          </DashboardCard>
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
