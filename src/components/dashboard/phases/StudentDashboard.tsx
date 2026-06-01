"use client";

import {
  Compass,
  Telescope,
  NotebookPen,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { ChapterTimetableCard } from "@/components/dashboard/ChapterTimetableCard";
import { GatekeeperChecklist } from "@/components/dashboard/GatekeeperChecklist";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
  StatTile,
  MeterRow,
  EmptyHint,
  MockBadge,
} from "@/components/dashboard/PhaseWidgetGrid";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

// ── Mock fallback data (no backend signal yet) ──────────────────────
// Suggested directions are demo-only; a real recommender would derive
// these from interests + aptitude. Flagged with <MockBadge /> in the UI.
const SUGGESTED_PATHS: Record<string, string[]> = {
  Technology: ["Software Engineering", "Data Science", "Cybersecurity"],
  Design: ["Product Design", "UX Research", "Motion Design"],
  Engineering: ["Mechanical", "Robotics", "Aerospace"],
  Business: ["Product Management", "Operations", "Entrepreneurship"],
  default: ["Explore a few fields", "Try a short course", "Shadow a mentor"],
};

const LEVEL_PCT: Record<string, number> = {
  beginner: 33,
  intermediate: 66,
  expert: 100,
};

export function StudentDashboard({ data }: PhaseDashboardProps) {
  const interests = data.ai?.interestedIndustries ?? [];
  const skillLevels = data.ai?.skillLevels ?? {};
  const trackedSkills = data.currentSkills;
  const explorations = data.projects;

  const derivedPaths = interests
    .flatMap((i) => SUGGESTED_PATHS[i] ?? [])
    .slice(0, 6);
  const suggestions = derivedPaths.length
    ? derivedPaths
    : SUGGESTED_PATHS.default;

  return (
    <>
      <PhaseWidgetGrid>
        {/* Exploration tools — directions & interests (real + mock paths) */}
        <Col span={12} lg={7}>
          <DashboardCard glow="luminous" className="h-full">
            <WidgetHeader
              icon={Telescope}
              eyebrow="Exploration tools"
              title="Find directions that fit you"
              description="Interests you picked during setup, with paths to try next."
            />
            <div className="mb-4">
              <p className="text-muted-foreground mb-2 text-[11px] uppercase tracking-wider">
                Your interests
              </p>
              {interests.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <li key={i}>
                      <Chip tone="luminous">{i}</Chip>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyHint>
                  No interests yet — add a few in onboarding to unlock tailored
                  paths.
                </EmptyHint>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                  Paths to explore
                </p>
                <MockBadge label="Sample paths" />
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((p) => (
                  <li
                    key={p}
                    className="border-border/40 bg-card/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Compass className="text-luminous size-3.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </DashboardCard>
        </Col>

        {/* Early skill tracking — levels from onboarding (real) */}
        <Col span={12} lg={5}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Sparkles}
              eyebrow="Early skill tracking"
              title="Skills you're growing"
              hint={`${trackedSkills.length} tracked`}
            />
            {trackedSkills.length ? (
              <div className="flex flex-col gap-3">
                {trackedSkills.slice(0, 6).map((skill) => {
                  const level = skillLevels[skill];
                  const pct = level ? LEVEL_PCT[level] : 20;
                  return (
                    <MeterRow
                      key={skill}
                      label={skill}
                      value={pct}
                      accent="luminous"
                      caption={level ? `Level: ${level}` : "Just getting started"}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyHint>
                Log your first skill in onboarding or the Living Portfolio to
                start tracking growth.
              </EmptyHint>
            )}
          </DashboardCard>
        </Col>

        {/* Subject logs — projects / experiments (real) */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={NotebookPen}
              eyebrow="Subject logs"
              title="What you're exploring"
              description="Projects, experiments, and subjects you've logged."
            />
            {explorations.length ? (
              <ul className="flex flex-col gap-2">
                {explorations.map((e, i) => (
                  <li
                    key={`${e}-${i}`}
                    className="border-border/40 bg-card/40 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <GraduationCap className="text-luminous mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0">{e}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint>
                Nothing logged yet. Add a project or subject you&apos;re curious
                about to build your first proof.
              </EmptyHint>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatTile label="Subjects logged" value={explorations.length} />
              <StatTile
                label="Skills tracked"
                value={trackedSkills.length}
                accent="luminous"
              />
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
