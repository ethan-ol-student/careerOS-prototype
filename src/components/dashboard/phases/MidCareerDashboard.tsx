"use client";

import {
  ShieldAlert,
  Crosshair,
  GitBranch,
  TriangleAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { GatekeeperChecklist } from "@/components/dashboard/GatekeeperChecklist";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
  MeterRow,
  EmptyHint,
  MockBadge,
} from "@/components/dashboard/PhaseWidgetGrid";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

// ── Leadership branches — mock guidance (no backend signal) ─────────
const BRANCHES = [
  {
    id: "ic",
    icon: UserCog,
    title: "Deep specialist (IC)",
    body: "Go deeper as a principal/staff individual contributor — own hard problems.",
  },
  {
    id: "manager",
    icon: Users,
    title: "People leadership",
    body: "Lead a team — multiply impact through others and own outcomes.",
  },
];

export function MidCareerDashboard({ data }: PhaseDashboardProps) {
  // Risk proxy: skills the user is actively improving are "maintained";
  // the rest are flagged to watch for decay. This is a heuristic over
  // REAL onboarding data (currentSkills vs skillsToImprove), surfaced as
  // a demo signal until a real recency/decay model exists.
  const improving = new Set(data.skillsToImprove.map((s) => s.toLowerCase()));
  const maintained = data.currentSkills.filter((s) =>
    improving.has(s.toLowerCase()),
  );
  const atRisk = data.currentSkills.filter(
    (s) => !improving.has(s.toLowerCase()),
  );
  const total = data.currentSkills.length;
  const decayRisk = total
    ? Math.round((atRisk.length / total) * 100)
    : 0;

  return (
    <>
      <PhaseWidgetGrid>
        {/* Skill deprecation risk matrix (heuristic over real skills) */}
        <Col span={12} lg={7}>
          <DashboardCard glow="luminous" className="h-full">
            <WidgetHeader
              icon={ShieldAlert}
              eyebrow="Skill deprecation risk"
              title="What's at risk of going stale"
              description="Skills you're actively investing in vs. ones to refresh."
              action={<MockBadge label="Heuristic" />}
            />
            <MeterRow
              label="Estimated decay exposure"
              value={decayRisk}
              accent="luminous"
              caption={`${atRisk.length} of ${total || 0} skills not actively maintained`}
              className="mb-4"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-clover mb-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider">
                  <ShieldCheck className="size-3.5" />
                  Maintained ({maintained.length})
                </p>
                {maintained.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {maintained.map((s) => (
                      <li key={s}>
                        <Chip tone="clover">{s}</Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyHint>
                    Pick skills to improve so we can track what you&apos;re
                    keeping sharp.
                  </EmptyHint>
                )}
              </div>
              <div>
                <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-yellow-400">
                  <TriangleAlert className="size-3.5" />
                  Watch for decay ({atRisk.length})
                </p>
                {atRisk.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {atRisk.map((s) => (
                      <li key={s}>
                        <Chip tone="warning">{s}</Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyHint>Nothing flagged — nicely maintained.</EmptyHint>
                )}
              </div>
            </div>
          </DashboardCard>
        </Col>

        {/* Specialization tracking (real next-move + demo depth) */}
        <Col span={12} lg={5}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Crosshair}
              eyebrow="Specialization"
              title="Your chosen track"
            />
            {data.desiredNextMove ? (
              <p className="border-border/40 bg-card/40 mb-4 rounded-lg border px-3 py-2 text-sm">
                {data.desiredNextMove}
              </p>
            ) : (
              <EmptyHint className="mb-4">
                Describe your desired next move in onboarding to set a track.
              </EmptyHint>
            )}
            {data.targetRoles.length ? (
              <ul className="mb-4 flex flex-wrap gap-1.5">
                {data.targetRoles.map((r) => (
                  <li key={r}>
                    <Chip tone="luminous">{r}</Chip>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex items-center gap-2">
              <MeterRow
                label="Specialization depth"
                value={Math.min(40 + maintained.length * 12, 100)}
                accent="luminous"
                className="flex-1"
              />
              <MockBadge label="Est." />
            </div>
          </DashboardCard>
        </Col>

        {/* Leadership branch options (mock guidance) */}
        <Col span={12}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={GitBranch}
              eyebrow="Leadership branches"
              title="Two ways to grow your impact"
              action={<MockBadge label="Guidance" />}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BRANCHES.map((b) => (
                <div
                  key={b.id}
                  className="border-border/40 bg-card/40 hover:border-luminous/40 rounded-xl border p-4 transition-colors"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="bg-luminous/15 text-luminous flex size-8 items-center justify-center rounded-lg">
                      <b.icon className="size-4" />
                    </span>
                    <p className="font-semibold">{b.title}</p>
                  </div>
                  <p className="text-muted-foreground text-sm leading-snug">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
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
