"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Compass,
  Loader2,
  Radar as RadarIcon,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { CategoryRadar } from "@/components/skills/CategoryRadar";
import {
  ExecutiveDashboard,
  MidCareerDashboard,
  SeniorDashboard,
} from "@/components/dashboard/PhaseDashboards";
import { StudentDashboard } from "@/components/dashboard/student/StudentDashboard";
import { YoungAdultDashboard } from "@/components/dashboard/YoungAdultDashboard";
import { DayTimeline } from "@/components/dashboard/DayTimeline";
import {
  scoreSkillTruth,
  marketValue,
  type SkillClaimInput,
  type SkillTruth,
  type TrustTier,
} from "@/lib/intelligence/skillTruthEngine";
import { getPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { getFutureSelf } from "@/lib/futureSelf";
import type { Priority } from "@/lib/chapters/data";
import type { TargetJob } from "@/lib/jobs/data";
import type { CandidateDashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

interface ClaimRow {
  name: string;
  level: number;
  tier: TrustTier;
}
interface JobRow extends TargetJob {
  match: number;
}
interface EventRow {
  id: string;
  name: string;
  priority: Priority;
  date: string; // YYYY-MM-DD
  time: string;
}

/**
 * The cockpit dashboard (mentor spec): ONE screen answering the four
 * questions — Who are you? / Where are you? / What's possible? /
 * How do I get there? — each card a drill-down link into the module
 * that owns the depth. Fits a 1080p viewport without scrolling; the
 * shell's content region scrolls gracefully on smaller screens.
 */
export function CockpitDashboard({ data }: { data: CandidateDashboardData }) {
  const [claims, setClaims] = useState<ClaimRow[] | null>(null);
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    void (async () => {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/me/skills", { cache: "no-store" }),
        fetch("/api/jobs", { cache: "no-store" }),
        fetch("/api/me/chapters", { cache: "no-store" }),
      ]);
      const [j1, j2, j3] = await Promise.all([
        r1.json().catch(() => null),
        r2.json().catch(() => null),
        r3.json().catch(() => null),
      ]);
      setClaims(j1?.ok ? j1.data.claims : []);
      // Future Self path first: the chosen career leads every "vs" readout.
      const rows: JobRow[] = j2?.ok ? j2.data.jobs : [];
      const fs = getFutureSelf();
      const chosen = fs ? rows.findIndex((j) => j.id === fs.jobId) : -1;
      setJobs(
        chosen > 0 ? [rows[chosen], ...rows.filter((_, i) => i !== chosen)] : rows,
      );
      setEvents(j3?.ok ? j3.data : []);
    })();
  }, []);

  const topJob = jobs?.[0] ?? null;
  const truth = useMemo(
    () =>
      claims && topJob
        ? scoreSkillTruth(claims as SkillClaimInput[], topJob)
        : null,
    [claims, topJob],
  );
  const mv = useMemo(
    () => (claims?.length ? marketValue(claims as SkillClaimInput[]) : null),
    [claims],
  );

  const midCareerPlus =
    data.phase === "mid_career" ||
    data.phase === "senior_career" ||
    data.phase === "executive";

  const phaseCfg = getPhaseConfig(data.phase);
  const industry = data.field || data.ai?.interestedIndustries?.[0] || "";
  const target =
    data.targetJob || data.desiredNextMove || data.longTermGoal || "";

  // Student phase gets the exploration-first Discovery Radar dashboard
  // (no job section). Renders immediately; claims fill the micro-quest.
  if (data.phase === "student") {
    return (
      <div className="h-full overflow-y-auto">
        <StudentDashboard data={data} claims={claims} />
      </div>
    );
  }

  // Young Adult gets the 10-second readiness/pipeline dashboard.
  if (data.phase === "young_adult") {
    if (!claims || !jobs) {
      return (
        <div className="flex h-full items-center justify-center">
          <CardLoading />
        </div>
      );
    }
    return (
      <div className="h-full overflow-y-auto">
        <YoungAdultDashboard data={data} claims={claims} jobs={jobs} truth={truth} mv={mv} />
      </div>
    );
  }

  // Mid-career+ phases get their own dashboard layout (mentor "3 phases"
  // spec) — same data pipeline, different shape. Earlier phases keep the
  // four-question cockpit below.
  if (midCareerPlus) {
    if (!claims || !jobs) {
      return (
        <div className="flex h-full items-center justify-center">
          <CardLoading />
        </div>
      );
    }
    const phaseProps = { data, claims, jobs, truth, mv };
    return (
      <div className="h-full overflow-y-auto">
        {data.phase === "mid_career" ? (
          <MidCareerDashboard {...phaseProps} />
        ) : data.phase === "senior_career" ? (
          <SeniorDashboard {...phaseProps} />
        ) : (
          <ExecutiveDashboard {...phaseProps} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <section className="max-w-container mx-auto flex w-full flex-1 flex-col px-4 pb-4 pt-2 lg:min-h-0">
        <p className="text-luminous shrink-0 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          Candidate · {phaseCfg.label} phase
        </p>
        <h1 className="shrink-0 text-xl font-extrabold tracking-tight sm:text-2xl">
          Good day, <span className="text-luminous">{data.firstName}.</span>
        </h1>

        <div className="mt-3 grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-12 lg:grid-rows-2">
          {/* 1 — Who are you? */}
          <CockpitCard
            className="lg:col-span-5"
            eyebrow="Who are you?"
            icon={<User className="text-luminous size-4" aria-hidden />}
            href="/candidate/portfolio"
            linkLabel="Open Living Portfolio"
          >
            <div className="flex gap-4">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <span className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold ring-2">
                  {(data.firstName[0] ?? "C").toUpperCase()}
                </span>
                {industry && (
                  <Chip tone="luminous" className="max-w-28" title={industry}>
                    <span className="truncate">{industry}</span>
                  </Chip>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-3xl font-bold uppercase tracking-tight"
                  title={data.name}
                >
                  {data.firstName}
                </p>
                <p
                  className="bg-luminous/10 text-luminous-soft mt-1.5 truncate rounded-lg px-2 py-1 text-xs font-mono font-semibold uppercase tracking-wide"
                  title={target || undefined}
                >
                  Target: {target || "set your goal"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/candidate/skills"
                    className="glass-4 group rounded-xl p-3 transition-colors"
                  >
                    <p className="text-muted-foreground text-[0.625rem] font-mono font-semibold uppercase tracking-wider">
                      Skills
                    </p>
                    <span className="flex items-end justify-between">
                      <span className="text-luminous text-2xl font-semibold leading-none">
                        {claims ? claims.length : "–"}
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="text-muted-foreground group-hover:text-luminous size-3.5 transition-colors"
                      />
                    </span>
                  </Link>
                  <div className="glass-4 rounded-xl p-3">
                    <p className="text-muted-foreground text-[0.625rem] font-mono font-semibold uppercase tracking-wider">
                      Phase
                    </p>
                    <Chip
                      tone={phaseCfg.accent === "clover" ? "clover" : "luminous"}
                      className="mt-1"
                    >
                      {phaseCfg.label}
                    </Chip>
                  </div>
                </div>
              </div>
            </div>
          </CockpitCard>

          {/* 4 — How do I get there? — read-only calendar preview + the AI
              recommendation (the trigger point into the Life Chapter Designer).
              Scheduling/adding modules lives in the designer, not here. */}
          <CockpitCard
            className="lg:col-span-7"
            eyebrow="How do I get there?"
            icon={<Compass className="text-luminous size-4" aria-hidden />}
            href={midCareerPlus ? "/candidate/career-health" : "/candidate/chapters"}
            linkLabel={
              midCareerPlus ? "Open Career Health home" : "Open Life Chapter Designer"
            }
          >
            <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
              {/* Left ONLY: the single-day hourly timeline (wireframe). */}
              <div className="flex min-h-0 flex-col lg:w-1/2">
                <div className="min-h-0 flex-1">
                  <DayTimeline events={events} />
                </div>
              </div>
              {/* Right: the AI recommendation, two growth lanes. */}
              <div className="border-border/15 min-h-0 lg:w-1/2 lg:border-l lg:pl-4">
                {truth && topJob ? (
                  <AiRecommendation truth={truth} jobTitle={topJob.title} planHref="/candidate/chapters" />
                ) : (
                  <CardLoading />
                )}
              </div>
            </div>
            
    
          </CockpitCard>

          {/* 2 — Where are you? */}
          <CockpitCard
            className="lg:col-span-6"
            eyebrow="Where are you?"
            icon={<RadarIcon className="text-luminous size-4" aria-hidden />}
            href="/candidate/skills"
            linkLabel="Open Skill Radar"
          >
            {truth && topJob && claims ? (
              <div className="flex h-full min-h-0 items-stretch gap-4">
                {/* Wireframe: You vs Job radar with soft/hard arrows */}
                <div className="w-1/2 min-w-0 -translate-y-4">
                  <CategoryRadar
                    claims={claims as SkillClaimInput[]}
                    job={topJob}
                    focusGaps
                  />
                </div>
                {/* Wireframe: big Suitability % + minimum-requirements bars */}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="glass-4 text-luminous rounded-xl px-3.5 py-1.5 text-3xl font-bold tracking-tight">
                      {truth.score}%
                    </span>
                    <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.18em]">
                      Suitability
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <Link
                      href="/candidate/future-self"
                      className="text-luminous-soft hover:text-luminous font-medium transition-colors"
                      title="Change your Future Self path"
                    >
                      vs {topJob.title} →
                    </Link>
                    {mv && (
                      <span title={mv.reason}>
                        {" "}· market signal{" "}
                        <span className="text-clover font-medium">{mv.label}</span>
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-1 font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
                    Minimum requirements
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {truth.axes
                      .filter((a) => a.required > 0)
                      .slice(0, 5)
                      .map((a) => (
                        <li key={a.skill} className="flex items-center gap-2">
                          <span
                            className="w-24 shrink-0 truncate text-[0.6875rem] capitalize"
                            title={a.skill}
                          >
                            {a.skill}
                          </span>
                          <span className="bg-foreground/8 relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                a.you >= a.required ? "bg-clover" : "bg-luminous",
                              )}
                              style={{ width: `${a.you}%` }}
                            />
                          </span>
                          <span className="text-muted-foreground w-8 shrink-0 text-right font-mono text-[0.625rem] tabular-nums">
                            {a.you}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            ) : (
              <CardLoading />
            )}
          </CockpitCard>

          {/* 3 — What's possible? (job pools orbiting you) */}
          <CockpitCard
            className="lg:col-span-6"
            eyebrow="What's possible?"
            icon={<Briefcase className="text-luminous size-4" aria-hidden />}
            href="/jobs"
            linkLabel={`Browse all ${jobs?.length ?? ""} open roles`}
          >
            {jobs ? (
              <div className="flex h-full min-h-0 flex-col">
                <OrbitField
                  jobs={jobs.filter((j) => j.match > 0).slice(0, 5)}
                  centerInitial={(data.firstName[0] ?? "C").toUpperCase()}
                />
                <p className="text-muted-foreground shrink-0 pt-1 text-[0.625rem]">
                  Your top matches orbit you — bigger &amp; brighter = stronger
                  match. Hover to inspect, click to open the role.
                </p>
              </div>
            ) : (
              <CardLoading />
            )}
          </CockpitCard>
        </div>
      </section>
    </div>
  );
}

// ── Card 4: AI recommendation — two growth lanes ───────────────────
// Mentor feedback: the AI recommendation is the "trigger point" into the
// Life Chapter Designer, split into "learn new" vs "strengthen existing".
// No scheduling/adding happens here — every item links into the designer.

function AiRecommendation({
  truth,
  jobTitle,
  planHref,
}: {
  truth: SkillTruth;
  jobTitle: string;
  planHref: string;
}) {
  // Required skills not yet on the profile → learn new. Claimed but below
  // the bar (low tier / partial strength) → strengthen existing.
  const learnNew = truth.axes
    .filter((a) => a.tier === null && a.required > 0)
    .map((a) => a.skill)
    .slice(0, 3);
  const strengthen = truth.axes
    .filter((a) => a.tier !== null && a.you < a.required)
    .map((a) => a.skill)
    .slice(0, 3);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto">
      <div className="border-luminous/30 bg-luminous/5 rounded-lg border px-2.5 py-2">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
          <Sparkles className="size-3" aria-hidden /> AI recommendation
        </p>
        <p className="mt-1 block text-xs leading-snug">{truth.nextStep}</p>
      </div>
      <RecoGroup
        title="Learn new skills"
        icon={BookOpen}
        skills={learnNew}
        summary={
          learnNew.length
            ? `${jobTitle} expects these and they're not on your profile — plan a first session for each.`
            : undefined
        }
        planHref={planHref}
        empty="You've claimed every skill this role needs — nice."
      />
      <RecoGroup
        title="Strengthen existing skills"
        icon={TrendingUp}
        skills={strengthen}
        summary={
          strengthen.length
            ? "Claimed but below the bar — evidence or an endorsement lifts these over it."
            : undefined
        }
        planHref={planHref}
        empty="Your claimed skills already clear the bar for this role."
      />
    </div>
  );
}

function RecoGroup({
  title,
  icon: Icon,
  skills,
  summary,
  planHref,
  empty,
}: {
  title: string;
  icon: typeof Sparkles;
  skills: string[];
  summary?: string;
  planHref: string;
  empty: string;
}) {
  return (
    <div className="border-border/15 bg-foreground/2 rounded-lg border p-2.5">
      <p className="text-muted-foreground flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
        <Icon className="size-3" aria-hidden /> {title}
      </p>
      {/* {summary && (
        <InfoHint className="text-muted-foreground mt-1 block text-[0.6875rem] leading-snug">
          {summary}
        </InfoHint>
      )} */}
      {skills.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Link
              key={s}
              href={`${planHref}?add=${encodeURIComponent(s)}`}
              title={`Plan "${s}" in your Life Chapter Designer`}
              className="border-border/15 bg-foreground/2 hover:border-luminous/40 hover:text-luminous inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem] capitalize transition-colors"
            >
              {s}
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground/70 mt-1 text-[0.6875rem] italic">{empty}</p>
      )}
    </div>
  );
}

// ── Card 3: job pools orbiting the user ─────────────────────────────
// Pure CSS orbit: an invisible point at the centre rotates forever
// (Tailwind's spin keyframes, per-ring duration), a static translate
// pushes the icon out to its ring, and an equal-and-opposite spin
// keeps the icon upright. Hovering any icon pauses its ancestors'
// animations (the :hover state applies up the chain), so the orbit
// freezes while the icon scales up; clicking opens the job.

const ORBIT_RADII = [44, 62, 80, 98, 116];
const ORBIT_DURATIONS = [16, 22, 28, 34, 40];

function OrbitField({
  jobs,
  centerInitial,
}: {
  jobs: JobRow[];
  centerInitial: string;
}) {
  if (jobs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No matching roles yet — add skills to pull opportunities into your orbit.
      </p>
    );
  }
  return (
    <div className="border-border/15 bg-background/50 relative min-h-44 flex-1 overflow-hidden rounded-xl border">
      {/* Orbit rings */}
      {jobs.map((j, i) => (
        <span
          key={j.id}
          aria-hidden
          className="border-border/15 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
          style={{ width: `${ORBIT_RADII[i] / 8}rem`, height: `${ORBIT_RADII[i] / 8}rem` }}
        />
      ))}

      {/* You, at the centre */}
      <span className="bg-luminous/15 ring-luminous/40 text-luminous absolute left-1/2 top-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg font-semibold ring-2">
        {centerInitial}
      </span>

      {jobs.map((j, i) => (
        <Orbiter
          key={j.id}
          job={j}
          radius={ORBIT_RADII[i]}
          duration={ORBIT_DURATIONS[i]}
          index={i}
        />
      ))}
    </div>
  );
}

function Orbiter({
  job,
  radius,
  duration,
  index,
}: {
  job: JobRow;
  radius: number;
  duration: number;
  index: number;
}) {
  // 50% match → small (~43px), 100% → big (~56px); ≤0% never renders.
  const size = Math.round(30 + (job.match / 100) * 26);
  const glowing = job.match >= 70;
  // Negative delays scatter the start angles around the rings. The orbit
  // plays by DEFAULT (no prefers-reduced-motion gate — the in-app
  // Settings toggle `html.reduce-motion` is the only off switch); the
  // --orbit-angle var feeds the static-scatter fallback in globals.css.
  const spin: React.CSSProperties = {
    animationDuration: `${duration}s`,
    animationDelay: `-${(duration / 5) * (index + 1)}s`,
    ["--orbit-angle" as string]: `${72 * (index + 1) + 20}deg`,
  };
  const pause = "hover:[animation-play-state:paused]";

  return (
    <div
      data-orbit
      className={cn("absolute left-1/2 top-1/2 animate-spin hover:z-20", pause)}
      style={spin}
    >
      <div style={{ transform: `translateX(${radius / 16}rem)` }}>
        <div
          data-orbit-counter
          className={cn("animate-spin [animation-direction:reverse]", pause)}
          style={spin}
        >
          <Link
            href={`/jobs/${job.id}`}
            aria-label={`${job.title} at ${job.company} — ${job.match}% match`}
            className={cn(
              "group relative flex items-center justify-center rounded-2xl border font-semibold transition-transform hover:scale-125",
              glowing
                ? "border-luminous/60 bg-luminous/25 text-luminous"
                : "border-border/20 bg-card/80 text-foreground/80",
            )}
            style={{
              // rem so the orbit scales with the global root font-size
              width: `${size / 16}rem`,
              height: `${size / 16}rem`,
              marginLeft: `${-size / 32}rem`,
              marginTop: `${-size / 32}rem`,
              fontSize: `${(size * 0.4) / 16}rem`,
              boxShadow: glowing
                ? `0 0 ${Math.round(job.match / 5)}px 2px rgba(77, 122, 255, 0.55)`
                : undefined,
            }}
          >
            {job.company[0]?.toUpperCase() ?? "?"}
            <span className="border-border/20 bg-background pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border px-2 py-1 text-[0.625rem] font-normal group-hover:block">
              {job.title} · {job.company} —{" "}
              <span className="text-luminous font-semibold">{job.match}%</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CockpitCard({
  eyebrow,
  icon,
  href,
  linkLabel,
  className,
  children,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  href: string;
  linkLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "glass-3 flex flex-col overflow-hidden rounded-2xl p-5 lg:min-h-0",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        {/* Reference §04: module label rendered as an accent pill */}
        <p className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] [&_svg]:size-3">
          {icon}
          {eyebrow}
        </p>
        <Link
          href={href}
          aria-label={linkLabel}
          title={linkLabel}
          className="text-muted-foreground hover:text-luminous shrink-0 transition-colors"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </section>
  );
}

function CardLoading() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
    </div>
  );
}
