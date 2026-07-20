"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CalendarCheck,
  Flame,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import type {
  MarketValue,
  SkillTruth,
  TrustTier,
} from "@/lib/intelligence/skillTruthEngine";
import type { CandidateDashboardData } from "@/lib/dashboard/types";
import type { TargetJob } from "@/lib/jobs/data";
import { cn } from "@/lib/utils";

interface ClaimRow {
  name: string;
  level: number;
  tier: TrustTier;
}
interface JobRow extends TargetJob {
  match: number;
}
interface AppRow {
  id: string;
  status: string;
  job: { id: string };
}

/**
 * Young-Adult dashboard (10-Second Rule): market worth, today's one blocker,
 * and pipeline health readable in a glance. Portfolio Readiness gauge (0–3s)
 * + High-Impact Action (4–7s) up top, the Active Pipeline funnel (8–10s)
 * across the middle, and a curated match feeder to convert. All live data:
 * skill-truth readiness, real applications, and the personalized job feed.
 */
export function YoungAdultDashboard({
  data,
  claims,
  jobs,
  truth,
  mv,
}: {
  data: CandidateDashboardData;
  claims: ClaimRow[];
  jobs: JobRow[];
  truth: SkillTruth | null;
  mv: MarketValue | null;
}) {
  const [apps, setApps] = useState<AppRow[] | null>(null);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/applications", { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => null);
      const list = json?.ok ? json.data?.applications : null;
      setApps(Array.isArray(list) ? (list as AppRow[]) : []);
    })();
  }, []);

  const topJob = jobs[0] ?? null;
  const readiness = truth?.score ?? 0;

  const gaps = useMemo(
    () =>
      truth
        ? truth.axes
            .filter((a) => a.required > 0 && a.you < a.required)
            .sort((a, b) => b.required - b.you - (a.required - a.you))
        : [],
    [truth],
  );

  return (
    <div className="max-w-container mx-auto flex w-full flex-col gap-4 px-4 pb-8 pt-2">
      <div className="shrink-0">
        <p className="text-luminous font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          Candidate · Young Adult phase
        </p>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Good day, <span className="text-luminous">{data.firstName}.</span>
        </h1>
      </div>

      {/* Zone 1 + 2 — Readiness (0–3s) & High-Impact Action (4–7s) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReadinessGauge data={data} claims={claims} readiness={readiness} mv={mv} topJob={topJob} />
        <HighImpactAction
          apps={apps}
          gaps={gaps}
          topJob={topJob}
          readiness={readiness}
          portfolioThin={data.portfolio.projectCount + data.portfolio.experienceCount < 2}
        />
      </div>

      {/* Zone 3 — Active Pipeline Funnel (8–10s) */}
      <PipelineFunnel apps={apps} jobs={jobs} />

      {/* Discovery/Conversion — Curated Match Feeder */}
      <MatchFeeder jobs={jobs} apps={apps} />
    </div>
  );
}

// ── 1 · Portfolio Market Readiness Gauge ────────────────────────────

function ReadinessGauge({
  data,
  claims,
  readiness,
  mv,
  topJob,
}: {
  data: CandidateDashboardData;
  claims: ClaimRow[];
  readiness: number;
  mv: MarketValue | null;
  topJob: JobRow | null;
}) {
  const validated = claims.filter((c) => c.tier >= 2).length;
  const skillsPct = claims.length ? Math.round((validated / claims.length) * 100) : 0;
  const p = data.portfolio;
  const depth = Math.round(
    ([p.skills.length > 0, p.experienceCount > 0, p.projectCount > 0, p.hasBio].filter(
      Boolean,
    ).length /
      4) *
      100,
  );
  const factors: { label: string; value: number }[] = [
    { label: "Role match", value: readiness },
    { label: "Skills validated", value: skillsPct },
    { label: "Portfolio depth", value: depth },
  ];

  return (
    <section className="glass-3 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <ProgressRing value={readiness} label="Readiness" size={128} accent={readiness >= 60 ? "clover" : "luminous"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          <Target className="size-3.5" aria-hidden /> Portfolio Readiness
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          How aligned you are with the market bar for{" "}
          <Link
            href="/candidate/future-self"
            title="Change your Future Self path"
            className="text-luminous-soft hover:text-luminous font-medium transition-colors"
          >
            {topJob ? topJob.title : "your target roles"} →
          </Link>
          {mv && (
            <>
              {" "}· market signal{" "}
              <span className="text-clover font-medium">{mv.label}</span>
            </>
          )}
          .
        </p>
        <div className="mt-3 space-y-2">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-muted-foreground w-28 shrink-0 text-[0.6875rem]">{f.label}</span>
              <span className="bg-foreground/8 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                <span
                  className={cn(
                    "block h-full rounded-full transition-[width] duration-700",
                    f.value >= 60 ? "bg-clover" : "bg-luminous",
                  )}
                  style={{ width: `${Math.max(3, f.value)}%` }}
                />
              </span>
              <span className="text-muted-foreground w-8 shrink-0 text-right font-mono text-[0.625rem] tabular-nums">
                {f.value}
              </span>
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
    </section>
  );
}

// ── 2 · Ultimate Bottleneck / High-Impact Action ────────────────────

function HighImpactAction({
  apps,
  gaps,
  topJob,
  readiness,
  portfolioThin,
}: {
  apps: AppRow[] | null;
  gaps: { skill: string; you: number; required: number }[];
  topJob: JobRow | null;
  readiness: number;
  portfolioThin: boolean;
}) {
  // Exactly ONE high-leverage next move, filtered from the noise.
  const sent = apps?.length ?? 0;
  let action: { title: string; why: string; href: string; cta: string; impact: string };
  if (topJob && sent === 0) {
    action = {
      title: `Apply to ${topJob.title}`,
      why: `Your strongest live match at ${topJob.match}% — one application starts your pipeline.`,
      href: `/jobs/${topJob.id}`,
      cta: "Open role",
      impact: "Starts your funnel",
    };
  } else if (gaps[0]) {
    action = {
      title: `Validate “${gaps[0].skill}”`,
      why: `Your biggest gap to the market bar — closing it lifts readiness the most.`,
      href: `/candidate/skills?focus=${encodeURIComponent(gaps[0].skill)}`,
      cta: "Add evidence",
      impact: `+${gaps[0].required - gaps[0].you} to match`,
    };
  } else if (portfolioThin) {
    action = {
      title: "Add a project to your portfolio",
      why: "One proof-of-work entry is the fastest lift to your readiness score.",
      href: "/candidate/portfolio",
      cta: "Add a project",
      impact: "Raises portfolio depth",
    };
  } else {
    action = {
      title: "Keep the momentum",
      why: "You're on the bar — apply to another matched role to widen your pipeline.",
      href: "/jobs",
      cta: "Browse roles",
      impact: "Widens your pipeline",
    };
  }

  return (
    <section className="border-luminous/25 from-luminous/12 to-luminous/2 flex flex-col rounded-2xl border bg-linear-to-b p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          <Flame className="size-3.5" aria-hidden /> Do this next
        </p>
        <Chip tone="luminous">
          <Sparkles className="size-3" aria-hidden /> {action.impact}
        </Chip>
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight">{action.title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{action.why}</p>
      <div className="mt-auto pt-4">
        <Link
          href={action.href}
          className="bg-luminous hover:bg-luminous-soft inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          {action.cta} <ArrowRight className="size-4" aria-hidden />
        </Link>
        <p className="text-muted-foreground mt-2 text-[0.6875rem]">
          One task, chosen by leverage — the rest can wait.
          {readiness > 0 && ` Readiness ${readiness}/100.`}
        </p>
      </div>
    </section>
  );
}

// ── 3 · Active Pipeline Funnel ──────────────────────────────────────

const STAGES = [
  { key: "leads", label: "Leads", icon: Bookmark, tone: "text-muted-foreground" },
  { key: "applied", label: "Applied", icon: Send, tone: "text-luminous-soft" },
  { key: "screening", label: "Screening", icon: CalendarCheck, tone: "text-luminous-soft" },
  { key: "interview", label: "Final rounds", icon: Briefcase, tone: "text-clover-soft" },
  { key: "offer", label: "Offers", icon: Trophy, tone: "text-clover" },
] as const;

function PipelineFunnel({ apps, jobs }: { apps: AppRow[] | null; jobs: JobRow[] }) {
  const appliedIds = new Set((apps ?? []).map((a) => a.job.id));
  const leads = jobs.filter((j) => j.match >= 55 && !appliedIds.has(j.id)).length;
  const count = (s: string) => (apps ?? []).filter((a) => a.status === s).length;
  const counts: Record<string, number> = {
    leads,
    applied: count("submitted"),
    screening: count("reviewing"),
    interview: count("interview"),
    offer: count("offer"),
  };
  const loading = apps === null;

  return (
    <section className="glass-3 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          <Briefcase className="size-3.5" aria-hidden /> Active pipeline
        </p>
        <Link href="/candidate/applications" className="text-luminous text-xs font-medium hover:underline">
          Open tracker →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STAGES.map((s, i) => (
          <div key={s.key} className="relative">
            <Link
              href={s.key === "leads" ? "/jobs" : "/candidate/applications"}
              className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex flex-col rounded-xl border p-3 transition-colors"
            >
              <span className="flex items-center justify-between gap-1">
                <s.icon className={cn("size-3.5", s.tone)} aria-hidden />
                <span className={cn("text-2xl font-bold tabular-nums", s.tone)}>
                  {loading ? "–" : counts[s.key]}
                </span>
              </span>
              <span className="text-muted-foreground mt-1 font-mono text-[0.5625rem] font-semibold uppercase tracking-wider">
                {s.label}
              </span>
            </Link>
            {i < STAGES.length - 1 && (
              <ArrowRight
                className="text-muted-foreground/40 absolute -right-2.5 top-1/2 z-10 hidden size-4 -translate-y-1/2 sm:block"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-2.5 text-[0.6875rem]">
        Leads = strong matches you haven&apos;t applied to yet · every other
        stage is live from your application timeline.
      </p>
    </section>
  );
}

// ── 4 · Curated Match Feeder ────────────────────────────────────────

function MatchFeeder({ jobs, apps }: { jobs: JobRow[]; apps: AppRow[] | null }) {
  const appliedIds = new Set((apps ?? []).map((a) => a.job.id));
  const feed = jobs.filter((j) => !appliedIds.has(j.id)).slice(0, 6);

  return (
    <section className="glass-3 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          <Sparkles className="size-3.5" aria-hidden /> Curated for you
        </p>
        <Link href="/jobs" className="text-luminous text-xs font-medium hover:underline">
          See all roles →
        </Link>
      </div>
      {feed.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">
          You&apos;ve acted on every strong match — add skills to surface new ones.
        </p>
      ) : (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1.5">
          {feed.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="border-border/15 bg-foreground/2 hover:border-luminous/40 w-56 shrink-0 rounded-xl border p-3.5 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="from-luminous/20 to-luminous/5 text-luminous-soft flex size-8 items-center justify-center rounded-lg bg-linear-to-br text-sm font-bold">
                  {j.company.slice(0, 1).toUpperCase()}
                </span>
                <span className={cn("text-lg font-bold tabular-nums", j.match >= 70 ? "text-clover" : "text-luminous")}>
                  {j.match}%
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{j.title}</p>
              <p className="text-muted-foreground truncate text-xs">{j.company} · {j.location}</p>
              <span className="text-luminous mt-2 inline-flex items-center gap-1 text-xs font-medium">
                <BadgeCheck className="size-3.5" aria-hidden /> View & apply
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
