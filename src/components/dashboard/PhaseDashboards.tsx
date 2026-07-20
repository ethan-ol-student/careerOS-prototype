"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Flag,
  Flame,
  Gem,
  Megaphone,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ScoreBar } from "@/components/ui/ScoreBar";
import {
  TIER_LABEL,
  type MarketValue,
  type SkillTruth,
  type TrustTier,
} from "@/lib/intelligence/skillTruthEngine";
import { CAREER_PHASES, type CandidateDashboardData } from "@/lib/dashboard/types";
import { getPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { normalizeSkill, type TargetJob } from "@/lib/jobs/data";
import { cn } from "@/lib/utils";

/**
 * Phase-adaptive dashboards (mentor "3 phases career" spec) for the three
 * later phases. Each keeps the cockpit's four questions but re-shapes the
 * layout: Mid-Career = action-oriented single-column feed, Senior =
 * two-panel roadmap, Executive = three-column board cockpit. Everything
 * renders from REAL data (claims, jobs, truth engine, onboarding answers);
 * the few widgets with no data source yet carry the "Demo data" badge.
 */

export interface PhaseClaim {
  name: string;
  level: number;
  tier: TrustTier;
}
export interface PhaseJob extends TargetJob {
  match: number;
}
interface PhaseDashProps {
  data: CandidateDashboardData;
  claims: PhaseClaim[];
  jobs: PhaseJob[];
  truth: SkillTruth | null;
  mv: MarketValue | null;
}

// ── Shared derivations ─────────────────────────────────────────────

const MEDAL: Record<TrustTier, { label: string; tone: "clover" | "warning" | "neutral" }> = {
  3: { label: "Gold", tone: "clover" },
  2: { label: "Silver", tone: "warning" },
  1: { label: "Bronze", tone: "neutral" },
};

const topBadges = (claims: PhaseClaim[], n: number) =>
  [...claims].sort((a, b) => b.tier - a.tier || b.level - a.level).slice(0, n);

const gapsOf = (truth: SkillTruth | null) =>
  truth
    ? truth.axes
        .filter((a) => a.required > 0 && a.you < a.required)
        .sort((a, b) => b.required - b.you - (a.required - a.you))
    : [];

/** First required skill of a job the candidate actually holds. */
const matchedSkill = (job: PhaseJob, claims: PhaseClaim[]) => {
  const have = new Set(claims.map((c) => normalizeSkill(c.name)));
  return job.requiredSkills.find((s) => have.has(normalizeSkill(s))) ?? null;
};

const pct = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-luminous font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
      {children}
    </p>
  );
}

function PhaseGreeting({ data }: { data: CandidateDashboardData }) {
  const cfg = getPhaseConfig(data.phase);
  return (
    <div className="shrink-0">
      <Eyebrow>Candidate · {cfg.label} phase</Eyebrow>
      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
        Good day, <span className="text-luminous">{data.firstName}.</span>
      </h1>
    </div>
  );
}

/** Segmented career-stage bar: passed phases fill, the current one pulses. */
function StageBar({ data }: { data: CandidateDashboardData }) {
  const idx = CAREER_PHASES.indexOf(data.phase);
  const next = CAREER_PHASES[idx + 1];
  return (
    <div>
      <div className="flex items-center gap-1">
        {CAREER_PHASES.map((p, i) => (
          <span
            key={p}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < idx && "bg-luminous/50",
              i === idx && "bg-luminous",
              i > idx && "bg-foreground/10",
            )}
          />
        ))}
        <span className="bg-luminous ml-0.5 size-2 animate-pulse rounded-full" aria-hidden />
      </div>
      <p className="text-muted-foreground mt-1 font-mono text-[0.625rem] uppercase tracking-wider">
        {next
          ? `Next zone: ${getPhaseConfig(next).label}`
          : "Top of the ladder — legacy mode"}
      </p>
    </div>
  );
}

/** Career-health traffic light — green/amber/red from a 0–100 score. */
function TrafficLight({ label, score }: { label: string; score: number }) {
  const tone =
    score >= 60 ? "bg-clover" : score >= 30 ? "bg-yellow-400" : "bg-destructive";
  return (
    <Link
      href="/candidate/career-health"
      title={`${label}: ${score}/100 — open Career Health`}
      className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors"
    >
      <span className={cn("size-2.5 shrink-0 rounded-full", tone)} aria-hidden />
      <span className="text-muted-foreground truncate text-[0.6875rem]">{label}</span>
    </Link>
  );
}

/** Health signals derived deterministically from claims + onboarding. */
function healthSignals(claims: PhaseClaim[], data: CandidateDashboardData) {
  const validated = claims.filter((c) => c.tier >= 2).length;
  const endorsed = claims.filter((c) => c.tier === 3).length;
  const learning = data.ai?.weeklyLearningTime ?? "";
  const learningScore = learning.startsWith("10")
    ? 90
    : learning.startsWith("5")
      ? 70
      : learning.startsWith("2")
        ? 45
        : learning ? 20 : 0;
  return {
    freshness: pct(validated, Math.max(1, claims.length)),
    network: Math.min(100, endorsed * 34),
    learning: learningScore,
  };
}

// ══════════════════════════════════════════════════════════════════
// MID-CAREER — action-oriented single-column feed
// ══════════════════════════════════════════════════════════════════

export function MidCareerDashboard({ data, claims, jobs, truth }: PhaseDashProps) {
  const gaps = gapsOf(truth);
  const topGap = gaps[0] ?? null;
  const signals = healthSignals(claims, data);
  const target = data.targetJob || data.desiredNextMove || "your next role";
  const headline = data.portfolio.headline || getPhaseConfig(data.phase).label;

  return (
    <div className="max-w-container mx-auto flex w-full flex-col gap-4 px-4 pb-20 pt-2">
      <PhaseGreeting data={data} />

      {/* Hero — who/where in 3 seconds */}
      <section className="glass-3 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold ring-2">
              {(data.firstName[0] ?? "C").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight">{data.name}</p>
              <p className="text-muted-foreground truncate text-sm">{headline}</p>
            </div>
          </div>
          {/* Trust-tier badge strip */}
          <div className="flex flex-wrap items-center gap-1.5">
            {topBadges(claims, 3).map((c) => (
              <Chip key={c.name} tone={MEDAL[c.tier].tone} title={TIER_LABEL[c.tier]}>
                <Award className="size-3" aria-hidden />
                <span className="max-w-32 truncate capitalize">{c.name}</span>
                <span className="opacity-70">· {MEDAL[c.tier].label}</span>
              </Chip>
            ))}
            {claims.length === 0 && (
              <Link href="/candidate/skills" className="text-luminous text-xs hover:underline">
                Add your first skill →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4"><StageBar data={data} /></div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TrafficLight label="Skill Freshness" score={signals.freshness} />
          <TrafficLight label="Network Strength" score={signals.network} />
          <TrafficLight label="Learning Velocity" score={signals.learning} />
        </div>
      </section>

      {/* Row 2 — what do you want? */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass-3 flex items-center gap-4 rounded-2xl p-5">
          <ProgressRing value={truth?.score ?? 0} label="Match" size={104} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
              <Flag className="text-luminous size-3.5" aria-hidden /> Goal
            </p>
            <p className="mt-1 text-sm font-semibold">Target: {target}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Readiness fills as your validated skills close the role&apos;s bar.
            </p>
          </div>
        </section>

        <section className="border-yellow-400/30 bg-yellow-400/5 flex flex-col justify-center rounded-2xl border p-5">
          <p className="flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-yellow-400">
            <Target className="size-3.5" aria-hidden /> Top gap
          </p>
          {topGap ? (
            <>
              <p className="mt-1 text-sm font-semibold capitalize">
                Missing: {topGap.skill}
                <span className="text-muted-foreground font-normal">
                  {" "}(−{topGap.required - topGap.you} points)
                </span>
              </p>
              <Link
                href={`/candidate/skills?focus=${encodeURIComponent(topGap.skill)}`}
                className="text-luminous mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                See how <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </>
          ) : (
            <p className="text-clover mt-1 text-sm font-medium">
              No open gaps against {target} — you clear the bar.
            </p>
          )}
        </section>
      </div>

      {/* Row 3 — how do you get there? */}
      <section className="glass-3 rounded-2xl p-5">
        <Eyebrow>Priority actions</Eyebrow>
        <ol className="mt-3 space-y-2">
          {[
            gaps[0] && {
              text: `Validate or learn “${gaps[0].skill}” — it moves your match most`,
              href: `/candidate/skills?focus=${encodeURIComponent(gaps[0].skill)}`,
              status: `${gaps[0].you}/100`,
            },
            gaps[1] && {
              text: `Strengthen “${gaps[1].skill}” with evidence or an endorsement`,
              href: `/candidate/skills?focus=${encodeURIComponent(gaps[1].skill)}`,
              status: `${gaps[1].you}/100`,
            },
            {
              text: "Apply to matched roles",
              href: "/jobs",
              status: `${jobs.filter((j) => j.match >= 50).length} suggested`,
            },
          ]
            .filter(Boolean)
            .map((step, i) => {
              const s = step as { text: string; href: string; status: string };
              return (
                <li key={s.text}>
                  <Link
                    href={s.href}
                    className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                  >
                    <span className="bg-luminous/15 text-luminous flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{s.text}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[0.625rem] uppercase tracking-wider">
                      {s.status}
                    </span>
                  </Link>
                </li>
              );
            })}
        </ol>

        {/* Job-match carousel */}
        <p className="text-muted-foreground mt-4 font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
          Job matches
        </p>
        <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
          {jobs.slice(0, 6).map((j) => {
            const why = matchedSkill(j, claims);
            return (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="border-border/15 bg-foreground/2 hover:border-luminous/40 w-56 shrink-0 rounded-xl border p-3.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-luminous/10 text-luminous-soft flex size-8 items-center justify-center rounded-lg text-sm font-semibold">
                    {j.company[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="text-luminous text-xl font-bold tabular-nums">
                    {j.match}%
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-medium">{j.title}</p>
                <p className="text-muted-foreground truncate text-xs">{j.company}</p>
                <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[0.6875rem]">
                  {why
                    ? <>Your <span className="text-clover capitalize">{why}</span> matches their top need</>
                    : "Build the required skills to lift this match"}
                </p>
              </Link>
            );
          })}
          {jobs.length === 0 && (
            <p className="text-muted-foreground py-4 text-sm">No open roles loaded yet.</p>
          )}
        </div>
      </section>

      {/* FAB — quick-log evidence into the portfolio */}
      <Link
        href="/candidate/portfolio"
        title="Quick-log evidence — update your Living Portfolio"
        aria-label="Quick-log evidence"
        className="bg-luminous hover:bg-luminous-soft fixed bottom-4 right-20 z-40 flex size-12 items-center justify-center rounded-full text-white shadow-xl transition-colors"
      >
        <Plus className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SENIOR — two-panel magazine layout, gold accents
// ══════════════════════════════════════════════════════════════════

/** Semicircular readiness gauge with red/amber/green zones (hand-rolled SVG). */
function ReadinessGauge({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const ang = Math.PI * (1 - v / 100); // 100 → 0rad (right), 0 → π (left)
  const R = 70;
  const cx = 90;
  const cy = 84;
  const nx = cx + (R - 14) * Math.cos(ang);
  const ny = cy - (R - 14) * Math.sin(ang);
  const arc = (from: number, to: number) => {
    const sx = cx + R * Math.cos(Math.PI * (1 - from / 100));
    const sy = cy - R * Math.sin(Math.PI * (1 - from / 100));
    const ex = cx + R * Math.cos(Math.PI * (1 - to / 100));
    const ey = cy - R * Math.sin(Math.PI * (1 - to / 100));
    return `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
  };
  return (
    <figure className="m-0">
      <svg viewBox="0 0 180 96" className="w-full max-w-52" role="img" aria-label={`${label}: ${v} out of 100`}>
        <path d={arc(0, 40)} className="stroke-destructive/50" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d={arc(42, 70)} className="stroke-yellow-400/60" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d={arc(72, 100)} className="stroke-clover/70" strokeWidth={8} fill="none" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} className="stroke-foreground" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} className="fill-foreground" />
        <text x={cx} y={cy - 18} textAnchor="middle" className="fill-foreground text-xl font-bold tabular-nums">
          {v}%
        </text>
      </svg>
      <figcaption className="text-muted-foreground -mt-1 font-mono text-[0.625rem] uppercase tracking-wider">
        {label}
      </figcaption>
    </figure>
  );
}

/** 2×2 Performance vs Potential matrix with a gold "You" dot. */
function TrajectoryMatrix({ performance, potential }: { performance: number; potential: number }) {
  const x = 8 + (performance / 100) * 104;
  const y = 112 - (potential / 100) * 104;
  const ready = performance >= 60 && potential >= 60;
  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-36" role="img"
      aria-label={`Trajectory: performance ${performance}, potential ${potential}${ready ? " — executive ready" : ""}`}>
      <rect x={8} y={8} width={104} height={104} rx={8} className="fill-foreground/3 stroke-border/40" />
      <line x1={60} y1={8} x2={60} y2={112} className="stroke-border/40" strokeDasharray="3 3" />
      <line x1={8} y1={60} x2={112} y2={60} className="stroke-border/40" strokeDasharray="3 3" />
      <line x1={x} y1={112} x2={x} y2={y} className="stroke-yellow-400/30" strokeWidth={1} />
      <line x1={8} y1={y} x2={x} y2={y} className="stroke-yellow-400/30" strokeWidth={1} />
      <circle cx={x} cy={y} r={5} className="fill-yellow-400" />
      <text x={x} y={y - 8} textAnchor="middle" className="fill-foreground text-[0.5rem] font-semibold">
        You
      </text>
      {ready && (
        <text x={86} y={20} textAnchor="middle" className="fill-yellow-400 text-[0.4375rem] font-semibold uppercase">
          Exec ready
        </text>
      )}
    </svg>
  );
}

export function SeniorDashboard({ data, claims, jobs, truth, mv }: PhaseDashProps) {
  const gaps = gapsOf(truth);
  const endorsed = claims.filter((c) => c.tier === 3);
  const evidenced = claims.filter((c) => c.tier >= 2);
  const goal = data.longTermGoal || data.desiredNextMove || data.targetJob || "define your next summit";
  const subtitle =
    [
      data.portfolio.experienceCount > 0 &&
        `${data.portfolio.experienceCount} role${data.portfolio.experienceCount === 1 ? "" : "s"}`,
      data.portfolio.projectCount > 0 && `${data.portfolio.projectCount} projects`,
      claims.length > 0 && `${claims.length} skills on record`,
    ]
      .filter(Boolean)
      .join(" · ") || "Build your record in the Living Portfolio";

  return (
    <div className="max-w-container mx-auto flex w-full flex-col gap-4 px-4 pb-8 pt-2">
      <PhaseGreeting data={data} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left panel (40%) — identity & position */}
        <section className="glass-3 flex flex-col gap-5 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="bg-luminous/15 ring-yellow-400/40 text-luminous-soft flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold ring-2">
              {(data.firstName[0] ?? "C").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight">{data.name}</p>
              <p className="text-muted-foreground truncate text-sm">
                {data.portfolio.headline || "Senior professional"}
              </p>
              <p className="text-muted-foreground/70 truncate text-xs">{subtitle}</p>
            </div>
          </div>

          {/* Trust-tier skill cloud — size & shine follow the tier */}
          <div>
            <Eyebrow>Skill cloud</Eyebrow>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              {topBadges(claims, 14).map((c) => (
                <span
                  key={c.name}
                  title={`${c.name} — ${TIER_LABEL[c.tier]}`}
                  className={cn(
                    "capitalize",
                    c.tier === 3 &&
                      "text-base font-semibold text-yellow-400 [text-shadow:0_0_12px_rgba(250,204,21,0.35)]",
                    c.tier === 2 && "text-foreground/90 text-sm font-medium",
                    c.tier === 1 && "text-muted-foreground text-xs",
                  )}
                >
                  {c.name}
                </span>
              ))}
              {claims.length === 0 && (
                <Link href="/candidate/skills" className="text-luminous text-xs hover:underline">
                  Add skills to grow the cloud →
                </Link>
              )}
            </p>
          </div>

          {/* Scope of influence — no data source yet, honestly demo-labelled */}
          <div>
            <div className="flex items-center justify-between">
              <Eyebrow>Scope of influence</Eyebrow>
              <Badge variant="outline" className="text-[0.625rem]">Demo data</Badge>
            </div>
            <div className="mt-2 space-y-1.5">
              {[
                { label: "Team size", fill: 70, note: "150+ people" },
                { label: "Budget", fill: 55, note: "$20M" },
                { label: "Geography", fill: 85, note: "Global" },
              ].map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-20 shrink-0 text-[0.6875rem]">{seg.label}</span>
                  <span className="bg-foreground/8 h-2 min-w-0 flex-1 overflow-hidden rounded-full">
                    <span className="bg-yellow-400/60 block h-full rounded-full" style={{ width: `${seg.fill}%` }} />
                  </span>
                  <span className="text-muted-foreground w-16 shrink-0 text-right font-mono text-[0.625rem]">{seg.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Executive health diagnostic — real, trust-weighted */}
          <div className="space-y-2.5">
            <Eyebrow>Executive health</Eyebrow>
            <ScoreBar label="Influence" value={pct(endorsed.length, Math.max(1, claims.length))} size="sm" accent="clover" />
            <ScoreBar label="Presence" value={pct(evidenced.length, Math.max(1, claims.length))} size="sm" />
            <ScoreBar label="Market demand" value={mv?.score ?? 0} size="sm" accent="clover" />
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <Eyebrow>Trajectory</Eyebrow>
              <p className="text-muted-foreground mt-1 text-[0.6875rem]">
                Performance × potential — gold dot is you.
              </p>
            </div>
            <TrajectoryMatrix
              performance={truth?.score ?? 0}
              potential={pct(evidenced.length, Math.max(1, claims.length))}
            />
          </div>
        </section>

        {/* Right panel (60%) — aspiration & path */}
        <section className="flex flex-col gap-4 lg:col-span-3">
          <div className="glass-3 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
            <div className="min-w-0">
              <Eyebrow>Aspiration</Eyebrow>
              <p className="mt-1 text-base font-semibold">Goal: {goal}</p>
              {/* Market-demand signal — real marketValue engine output */}
              <p className="border-yellow-400/30 bg-yellow-400/5 mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                <Flame className="size-3.5 text-yellow-400" aria-hidden />
                <span className="font-medium text-yellow-400">{mv?.label ?? "—"} market signal</span>
              </p>
              <p className="text-muted-foreground mt-1.5 max-w-sm text-[0.6875rem]">{mv?.reason}</p>
            </div>
            <ReadinessGauge value={truth?.score ?? 0} label="Next-move readiness" />
          </div>

          {/* Roadmap — vertical timeline from your real gaps */}
          <div className="glass-3 rounded-2xl p-5">
            <Eyebrow>Path forward</Eyebrow>
            <ol className="border-border/20 ml-2 mt-3 space-y-4 border-l pl-4">
              {[
                gaps[0]
                  ? { when: "0–6m", text: `Close the “${gaps[0].skill}” gap`, href: `/candidate/skills?focus=${encodeURIComponent(gaps[0].skill)}` }
                  : { when: "0–6m", text: "Keep every required skill endorsed", href: "/candidate/skills" },
                gaps[1]
                  ? { when: "6–12m", text: `Get “${gaps[1].skill}” evidence-backed, then endorsed`, href: `/candidate/skills?focus=${encodeURIComponent(gaps[1].skill)}` }
                  : { when: "6–12m", text: "Log a flagship problem-solved in your portfolio", href: "/candidate/portfolio" },
                { when: "12–18m", text: "Targeted applications to matched roles", href: "/jobs" },
              ].map((node, i) => (
                <li key={node.text} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[1.4rem] top-1 size-2.5 rounded-full border-2",
                      i === 0 ? "border-yellow-400 bg-yellow-400/40" : "border-border bg-background",
                    )}
                    aria-hidden
                  />
                  <p className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-wider">{node.when}</p>
                  <Link href={node.href} className="hover:text-luminous text-sm font-medium transition-colors">
                    {node.text}
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          {/* Explainable marketplace — top two matches with the why */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {jobs.slice(0, 2).map((j) => {
              const why = matchedSkill(j, claims);
              return (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="glass-3 hover:border-yellow-400/40 border-border/15 rounded-2xl border p-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold">{j.title}</p>
                    <span className="text-yellow-400 shrink-0 text-lg font-bold tabular-nums">{j.match}%</span>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">{j.company} · {j.location}</p>
                  <p className="text-muted-foreground mt-2 text-[0.6875rem]">
                    {why ? (
                      <>Matched because you hold <span className="text-clover capitalize">{why}</span></>
                    ) : (
                      "Close the skill gaps to unlock this match"
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// EXECUTIVE — board-level cockpit, three columns
// ══════════════════════════════════════════════════════════════════

interface AppRow {
  id: string;
  status: string;
}

const FUNNEL: { key: string; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "reviewing", label: "In review" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

export function ExecutiveDashboard({ data, claims, jobs, truth, mv }: PhaseDashProps) {
  const [apps, setApps] = useState<AppRow[] | null>(null);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/applications", { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => null);
      const list = json?.ok ? json.data?.applications : null;
      setApps(Array.isArray(list) ? (list as AppRow[]) : []);
    })();
  }, []);

  const platinum = claims.filter((c) => c.tier === 3).slice(0, 3);
  const endorsedCount = claims.filter((c) => c.tier === 3).length;
  const goal = data.longTermGoal || data.desiredNextMove || "set your legacy goal";
  const topJob = jobs[0] ?? null;
  const topWhy = topJob ? matchedSkill(topJob, claims) : null;
  const depth = Math.min(100, data.portfolio.totalAdditions * 5);
  const funnelCounts = FUNNEL.map((f) => ({
    ...f,
    n: (apps ?? []).filter((a) => a.status === f.key).length,
  }));

  return (
    <div className="max-w-container mx-auto flex w-full flex-col gap-4 px-4 pb-8 pt-2">
      {/* Persistent top bar — instant identity */}
      <section className="glass-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="border-foreground/30 text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold">
            {(data.firstName[0] ?? "C").toUpperCase()}
            {(data.name.split(" ")[1]?.[0] ?? "").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight">{data.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {data.portfolio.headline || "Executive & Beyond"}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {platinum.map((c) => (
            <Chip key={c.name} tone="neutral" title={`${c.name} — endorsed`} className="border-foreground/25">
              <Gem className="size-3 text-foreground/70" aria-hidden />
              <span className="max-w-36 truncate capitalize">{c.name}</span>
            </Chip>
          ))}
          {platinum.length === 0 && (
            <span className="text-muted-foreground text-xs">
              Endorsed skills appear here as platinum credentials.
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-right">
            <span className="flex items-center gap-1 text-sm font-bold">
              {mv?.label ?? "—"} <TrendingUp className="text-clover size-3.5" aria-hidden />
            </span>
            <span className="text-muted-foreground block font-mono text-[0.5625rem] uppercase tracking-wider">
              Market signal
            </span>
          </span>
          <span className="text-right">
            <span className="flex items-center justify-end gap-1 text-sm font-bold tabular-nums">
              <Users className="text-muted-foreground size-3.5" aria-hidden /> {endorsedCount}
            </span>
            <span className="text-muted-foreground block font-mono text-[0.5625rem] uppercase tracking-wider">
              Endorsements
            </span>
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Column 1 — Portfolio */}
        <section className="glass-3 flex flex-col gap-5 rounded-2xl p-5">
          <div>
            <Eyebrow>Portfolio</Eyebrow>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { n: data.portfolio.experienceCount, label: "Roles" },
                { n: data.portfolio.projectCount, label: "Projects" },
                { n: data.portfolio.certificateCount + data.portfolio.awardCount, label: "Credentials" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-2xl font-light tabular-nums tracking-tight">{m.n}</p>
                  <p className="text-muted-foreground font-mono text-[0.5625rem] uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/candidate/portfolio"
              className="text-luminous mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              Open Living Portfolio <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing
              value={depth}
              label="Depth"
              size={88}
              accent={depth >= 60 ? "clover" : "luminous"}
            />
            <p className="text-muted-foreground min-w-0 text-xs">
              Portfolio depth — evidence logged across roles, projects, and
              credentials. {depth < 60 && "Amber until the record runs deeper."}
            </p>
          </div>
        </section>

        {/* Column 2 — Aspiration */}
        <section className="glass-3 flex flex-col gap-4 rounded-2xl p-5">
          <div>
            <Eyebrow>Aspiration</Eyebrow>
            <p className="mt-1.5 text-sm font-semibold leading-snug">“{goal}”</p>
          </div>
          <div>
            <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
              Readiness vs {topJob ? topJob.title : "benchmark"}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-3xl font-light tabular-nums">{truth?.score ?? 0}</span>
              <ScoreBar label="Readiness" value={truth?.score ?? 0} size="sm" accent="clover" className="min-w-0 flex-1" />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
              Opportunity feed
            </p>
            <p className="mt-1 text-sm">
              <span className="text-luminous font-bold tabular-nums">{jobs.length}</span>{" "}
              matched opportunities live
            </p>
            <ul className="mt-2 space-y-1.5">
              {jobs.slice(0, 3).map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        j.match >= 70 ? "bg-clover" : j.match >= 40 ? "bg-yellow-400" : "bg-muted-foreground/40",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{j.title} · {j.company}</span>
                    <span className="text-luminous shrink-0 font-semibold tabular-nums">{j.match}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Column 3 — Activation */}
        <section className="glass-3 flex flex-col gap-5 rounded-2xl p-5">
          <div>
            <Eyebrow>Pipeline</Eyebrow>
            <div className="mt-2 space-y-1">
              {funnelCounts.map((f, i) => (
                <div key={f.key} className="flex items-center gap-2">
                  <span
                    className="bg-luminous/15 text-luminous-soft flex h-6 items-center justify-center rounded font-mono text-[0.625rem] font-semibold tabular-nums"
                    style={{ width: `${100 - i * 18}%`, minWidth: "3rem" }}
                  >
                    {f.n}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[0.6875rem]">{f.label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/candidate/applications"
              className="text-luminous mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              Open applications <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>

          <div>
            <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
              Personal-brand accelerator
            </p>
            <ul className="mt-2 space-y-1.5">
              {[
                { icon: Megaphone, text: "Speak at an industry event", add: "Industry keynote" },
                { icon: BadgeCheck, text: "Publish a flagship article", add: "Flagship article" },
                { icon: Users, text: "Mentor a rising leader", add: "Mentorship session" },
              ].map((a) => (
                <li key={a.text}>
                  <Link
                    href={`/candidate/chapters?add=${encodeURIComponent(a.add)}`}
                    className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors"
                  >
                    <a.icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{a.text}</span>
                    <span className="text-luminous shrink-0 font-mono text-[0.5625rem] uppercase">Plan</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explainable match — platinum-bordered feature card */}
          {topJob && (
            <Link
              href={`/jobs/${topJob.id}`}
              className="border-foreground/25 bg-foreground/3 hover:border-foreground/50 rounded-xl border p-3.5 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold">
                  <Briefcase className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                  {topJob.title}
                </p>
                <span className="shrink-0 text-lg font-bold tabular-nums">{topJob.match}%</span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-[0.6875rem]">
                {topWhy ? (
                  <>Matched: endorsed <span className="text-clover capitalize">{topWhy}</span> + your validated record</>
                ) : (
                  "Your strongest live match — open for the full breakdown"
                )}
              </p>
              <span className="text-luminous mt-2 inline-flex items-center gap-1 text-xs font-medium">
                Express interest <ArrowUpRight className="size-3" aria-hidden />
              </span>
            </Link>
          )}
        </section>
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-[0.6875rem]">
        <Sparkles className="text-luminous size-3.5 shrink-0" aria-hidden />
        Every number derives from your validated record — trust-weighted, no
        vanity metrics. <CalendarClock className="ml-2 size-3.5 shrink-0" aria-hidden />
        Signals refresh each visit.
      </p>
    </div>
  );
}
