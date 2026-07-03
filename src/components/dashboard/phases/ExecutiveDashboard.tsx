"use client";

import {
  Landmark,
  Briefcase,
  Award,
  Sparkles,
  ArrowUpRight,
  Infinity as InfinityIcon,
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
import { CareerHealthHome } from "@/components/dashboard/midcareer/CareerHealthHome";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

// ── Mock fallback data (terminal phase — no backend tables yet) ─────
const MOCK_BOARDS = [
  { org: "Atlas Robotics", role: "Non-Exec Director", since: "2021" },
  { org: "Greenfield Capital", role: "Board Advisor", since: "2023" },
];
const MOCK_CONSULTING = [
  { client: "FinTech Scale-up", stage: "Active", fee: "Retainer" },
  { client: "Gov Digital Office", stage: "Proposal", fee: "Project" },
  { client: "Series B SaaS", stage: "Lead", fee: "Advisory" },
];

export function ExecutiveDashboard({ data }: PhaseDashboardProps) {
  return (
    <>
      {/* Career Health home — shared mid-career+ engine modules. */}
      <CareerHealthHome data={data} />
      <PhaseWidgetGrid topLine>
        {/* Board seats dashboard (mock) */}
        <Col span={12} lg={6}>
          <DashboardCard glow="luminous" className="h-full">
            <WidgetHeader
              icon={Landmark}
              eyebrow="Board seats"
              title="Governance roles"
              action={<MockBadge />}
            />
            <ul className="flex flex-col gap-2">
              {MOCK_BOARDS.map((b) => (
                <li
                  key={b.org}
                  className="border-border/40 bg-card/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.org}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {b.role}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                    since {b.since}
                  </span>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-3">
              Add a seat
              <ArrowUpRight />
            </Button>
          </DashboardCard>
        </Col>

        {/* Consulting pipeline (mock) */}
        <Col span={12} lg={6}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Briefcase}
              eyebrow="Consulting pipeline"
              title="Advisory engagements"
              action={<MockBadge />}
            />
            <ul className="flex flex-col gap-2">
              {MOCK_CONSULTING.map((c) => (
                <li
                  key={c.client}
                  className="border-border/40 bg-card/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.client}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {c.fee}
                    </p>
                  </div>
                  <span className="bg-luminous/15 text-luminous shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    {c.stage}
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </Col>

        {/* Master mentorship tools (mock) */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Sparkles}
              eyebrow="Master mentorship"
              title="Scale your wisdom"
              accent="clover"
              action={<MockBadge />}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Cohorts hosted", value: 3 },
                { label: "Office hours / mo", value: 8 },
                { label: "Playbooks shared", value: 12 },
              ].map((t) => (
                <StatTile
                  key={t.label}
                  label={t.label}
                  value={t.value}
                  accent="clover"
                />
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-3">
              Open a mentorship circle
              <ArrowUpRight />
            </Button>
          </DashboardCard>
        </Col>

        {/* Legacy metrics (mock) */}
        <Col span={12} lg={5}>
          <DashboardCard glow="clover" className="h-full">
            <WidgetHeader
              icon={Award}
              eyebrow="Legacy metrics"
              title="Lasting impact"
              action={<MockBadge />}
            />
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="People impacted" value="1.2k" accent="clover" />
              <StatTile label="Orgs advised" value={9} />
              <StatTile label="Talks / writing" value={27} />
              <StatTile
                label="Legacy score"
                value={
                  <span className="inline-flex items-center gap-1">
                    94
                    <InfinityIcon className="size-4 opacity-70" />
                  </span>
                }
                accent="clover"
              />
            </div>
            <p className="text-muted-foreground mt-3 text-[11px]">
              Welcome to the final phase, {data.firstName}. Your experience is
              now a shortcut for the next generation.
            </p>
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
