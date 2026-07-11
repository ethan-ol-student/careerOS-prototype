"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Compass,
  HeartPulse,
  Loader2,
  Radar as RadarIcon,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SkillRadar } from "@/components/skills/SkillRadar";
import {
  scoreSkillTruth,
  marketValue,
  type SkillClaimInput,
  type TrustTier,
} from "@/lib/intelligence/skillTruthEngine";
import { getPhaseConfig } from "@/lib/dashboard/phaseConfig";
import { useUiDensity } from "@/lib/dashboard/useUiDensity";
import { PRIORITY_META, type Priority } from "@/lib/chapters/data";
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
interface ActionRow {
  icon: typeof Sparkles;
  label: string;
  href: string;
}

// ── Date helpers (local-time, matches ChapterEvent's YYYY-MM-DD) ──

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/**
 * The cockpit dashboard (mentor spec): ONE screen answering the four
 * questions — Who are you? / Where are you? / What's possible? /
 * How do I get there? — each card a drill-down link into the module
 * that owns the depth. Fits a 1080p viewport without scrolling; the
 * shell's content region scrolls gracefully on smaller screens.
 */
export function CockpitDashboard({ data }: { data: CandidateDashboardData }) {
  const uiDensity = useUiDensity(data.phase);
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
      setJobs(j2?.ok ? j2.data.jobs : []);
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

  // AI insight nudge (spec Step 7): personalize by what the candidate said
  // matters most × their biggest current gap. Falls back to gap-only.
  const insight = useMemo(() => {
    const topValue = data.ai?.topValues?.[0];
    const gap = truth?.gaps[0];
    if (topValue && gap) {
      return `You told us "${topValue}" matters most — closing "${gap}" is the fastest move toward roles that offer it.`;
    }
    if (topValue) {
      return `You value "${topValue}" most — we'll weight matches toward roles that deliver it.`;
    }
    if (gap) return `Your biggest lever right now: close the "${gap}" gap.`;
    return null;
  }, [data.ai?.topValues, truth]);

  // Recommended actions: the engine's ONE next step, the top gaps as
  // learn-links, and the always-available CV quick upload.
  const actions: ActionRow[] | null = truth
    ? [
        { icon: Sparkles, label: truth.nextStep, href: "/candidate/skills" },
        ...truth.gaps.slice(0, 2).map((g) => ({
          icon: BookOpen,
          label: `Learn ${g}`,
          href: `/candidate/skills?focus=${encodeURIComponent(g)}`,
        })),
        {
          icon: Upload,
          label: "Quick upload CV",
          href: "/candidate/onboarding?edit=1",
        },
      ]
    : null;

  return (
    <div data-ui-density={uiDensity} className="flex h-full flex-col">
      <section className="max-w-container mx-auto flex w-full flex-1 flex-col px-4 pb-4 pt-2 lg:min-h-0">
        <p className="text-luminous shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
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
                    <p className="text-muted-foreground text-[10px] font-mono font-semibold uppercase tracking-wider">
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
                    <p className="text-muted-foreground text-[10px] font-mono font-semibold uppercase tracking-wider">
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

          {/* 4 — How do I get there? */}
          <CockpitCard
            className="lg:col-span-7"
            eyebrow="How do I get there?"
            icon={<Compass className="text-luminous size-4" aria-hidden />}
            href={midCareerPlus ? "/candidate/career-health" : "/candidate/chapters"}
            linkLabel={
              midCareerPlus ? "Open Career Health home" : "Open Life Chapter Designer"
            }
          >
            <WeekStrip events={events} />
            <p className="text-muted-foreground mt-3 text-xs font-mono font-semibold uppercase tracking-wider">
              Recommended actions
            </p>
            {actions ? (
              <RecommendedActions
                actions={actions}
                onAdded={(created) => setEvents((prev) => [...prev, created])}
              />
            ) : (
              <div className="mt-2">
                <CardLoading />
              </div>
            )}
            {insight && (
              <p className="border-luminous/30 bg-luminous/5 text-muted-foreground mt-2 flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs">
                <Sparkles className="text-luminous mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{insight}</span>
              </p>
            )}
            {midCareerPlus && (
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                <HeartPulse className="text-clover size-3.5" aria-hidden />
                Your full Career Health plan — Fair Pay, Skill Bridge, Next Move —
                lives one click away.
              </p>
            )}
          </CockpitCard>

          {/* 2 — Where are you? */}
          <CockpitCard
            className="lg:col-span-6"
            eyebrow="Where are you?"
            icon={<RadarIcon className="text-luminous size-4" aria-hidden />}
            href="/candidate/skills"
            linkLabel="Open Skill Radar"
          >
            {truth && topJob ? (
              <div className="flex h-full min-h-0 items-center gap-4">
                <div className="w-1/2 min-w-0">
                  <SkillRadar axes={truth.axes} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                  <ProgressRing value={truth.score} label="Suitability" size={100} />
                  <p className="text-muted-foreground text-xs">
                    vs {topJob.title} — your best match
                  </p>
                  {mv && (
                    <p className="text-muted-foreground text-xs" title={mv.reason}>
                      Market signal:{" "}
                      <span className="text-clover font-medium">{mv.label}</span>
                    </p>
                  )}
                  {truth.gaps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {truth.gaps.map((g) => (
                        <Chip key={g}>{g}</Chip>
                      ))}
                    </div>
                  )}
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
                <p className="text-muted-foreground shrink-0 pt-1 text-[10px]">
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

// ── Card 4: 7-day calendar strip (Life Chapter events) ─────────────

function WeekStrip({ events }: { events: EventRow[] }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const todayIso = toISODate(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const byDate = new Map<string, EventRow[]>();
  for (const e of events) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const shift = (weeks: number) =>
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weeks * 7);
      return next;
    });

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => shift(-1)}
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p
          className="text-xs font-mono font-bold uppercase tracking-[0.18em]"
          title={weekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        >
          {weekStart.toLocaleDateString("en-US", { month: "long" })}
        </p>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => shift(1)}
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = toISODate(d);
          const todays = (byDate.get(iso) ?? []).sort((a, b) =>
            a.time.localeCompare(b.time),
          );
          return (
            <div
              key={iso}
              className={cn(
                "border-border/15 bg-foreground/2 h-16 overflow-hidden rounded-lg border px-1 py-1",
                iso === todayIso && "ring-luminous/50 ring-1",
              )}
            >
              <p className="text-muted-foreground text-center text-[9px] font-semibold uppercase leading-tight">
                {d.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                <span className={cn(iso === todayIso && "text-luminous")}>
                  {d.getDate()}
                </span>
              </p>
              {todays.slice(0, 2).map((e) => (
                <p
                  key={e.id}
                  title={`${e.name}${e.time ? ` · ${e.time}` : ""}`}
                  className="flex items-center gap-1 truncate text-[9px] leading-tight"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1 shrink-0 rounded-full",
                      PRIORITY_META[e.priority]?.dot ?? "bg-luminous",
                    )}
                  />
                  <span className="truncate">{e.name}</span>
                </p>
              ))}
              {todays.length > 2 && (
                <p className="text-muted-foreground text-[9px] leading-tight">
                  +{todays.length - 2} more
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Card 4: scrollable actions with add-to-calendar ────────────────

function RecommendedActions({
  actions,
  onAdded,
}: {
  actions: ActionRow[];
  onAdded: (created: EventRow) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState(() => toISODate(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addToCalendar(label: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: label.slice(0, 80),
        priority: "medium",
        date: draftDate,
        time: "",
        subtasks: [],
      }),
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!json?.ok) {
      setError(json?.error?.message ?? "Couldn't add to your calendar.");
      return;
    }
    onAdded(json.data as EventRow);
    setExpanded(null);
  }

  return (
    /* Scrolls past 3 rows so any number of steps fits the card. */
    <ul className="mt-1.5 max-h-30 space-y-1.5 overflow-y-auto pr-1">
        {actions.map((a) => (
          <li key={a.label} className="border-border/15 bg-foreground/2 rounded-lg border">
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <span className="bg-luminous/15 text-luminous-soft flex size-7 shrink-0 items-center justify-center rounded-lg">
                <a.icon className="size-3.5" aria-hidden />
              </span>
              <Link
                href={a.href}
                title={a.label}
                className="hover:text-luminous min-w-0 flex-1 truncate text-sm transition-colors"
              >
                {a.label}
              </Link>
              <button
                type="button"
                aria-label={`Add "${a.label}" to your calendar`}
                aria-expanded={expanded === a.label}
                onClick={() => {
                  setExpanded(expanded === a.label ? null : a.label);
                  setError(null);
                }}
                className={cn(
                  "shrink-0 transition-colors",
                  expanded === a.label
                    ? "text-luminous"
                    : "text-muted-foreground hover:text-luminous",
                )}
              >
                <CalendarPlus className="size-4" aria-hidden />
              </button>
            </div>
            {expanded === a.label && (
              <form
                className="border-border/15 flex items-center gap-2 border-t px-3 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addToCalendar(a.label);
                }}
              >
                <label
                  htmlFor="action-date"
                  className="text-muted-foreground text-[11px]"
                >
                  Schedule for
                </label>
                <input
                  id="action-date"
                  type="date"
                  required
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="bg-foreground/2 border-border/15 rounded-lg border px-2 py-1 text-xs outline-none [color-scheme:dark]"
                />
                <Button type="submit" size="xs" disabled={busy}>
                  <CalendarPlus className="size-3" />
                  Add to calendar
                </Button>
                {error && <p className="text-destructive text-[11px]">{error}</p>}
              </form>
            )}
          </li>
        ))}
      </ul>
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
          style={{ width: ORBIT_RADII[i] * 2, height: ORBIT_RADII[i] * 2 }}
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
      <div style={{ transform: `translateX(${radius}px)` }}>
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
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              fontSize: size * 0.4,
              boxShadow: glowing
                ? `0 0 ${Math.round(job.match / 5)}px 2px rgba(77, 122, 255, 0.55)`
                : undefined,
            }}
          >
            {job.company[0]?.toUpperCase() ?? "?"}
            <span className="border-border/20 bg-background pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] font-normal group-hover:block">
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
        <p className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] [&_svg]:size-3">
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
