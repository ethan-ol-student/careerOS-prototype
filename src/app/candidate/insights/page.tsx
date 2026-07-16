"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Gem,
  Loader2,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { LinkButton } from "@/components/ui/LinkButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  scoreSkillTruth,
  type SkillClaimInput,
  type SkillTruth,
} from "@/lib/intelligence/skillTruthEngine";
import { ARCHETYPES } from "@/lib/intelligence/scoringConfig";
import type { TargetJob } from "@/lib/jobs/data";
import { cn } from "@/lib/utils";

interface Undervalued {
  skill: string;
  canonical: string;
  evidenceCount: number;
  selfLevel: number | null;
  tier: 1 | 2 | 3 | null;
  reason: string;
}
interface UndervaluedResult {
  score: number;
  reasons: string[];
  strengths: Undervalued[];
  nextStep: string | null;
}
interface Summary {
  skillsTracked: number;
  evidenceBacked: number;
  undervaluedCount: number;
}
interface MarketGap {
  skill: string;
  demandScore: number;
  ownedStrength: number;
  reason: string;
}
interface MarketGapsResult {
  gaps: MarketGap[];
  nextStep: string | null;
  field: string;
}
interface MarketContext {
  field: string;
  postingCount: number;
  salaryMinYr: number | null;
  salaryMaxYr: number | null;
  currency: string;
}
interface StyleFit {
  archetype: string; // archetype id (→ ARCHETYPES[...] for the animal)
  archetypeName: string;
  field: string;
  fitPct: number;
  axes: { style: string; you: number; role: number }[];
  reasons: string[];
  biasNote: string;
}
interface NarrativeTheme {
  theme: string;
  count: number;
  inPortfolio: boolean;
  energy: "energizing" | "draining" | "neutral";
}
interface Narrative {
  score: number;
  themes: NarrativeTheme[];
  tensions: string[];
  pivots: number;
  dominantMood: string | null;
  nextStep: string | null;
}
interface Payload {
  summary: Summary | null;
  undervalued: UndervaluedResult | null;
  marketGaps: MarketGapsResult | null;
  marketContext: MarketContext | null;
  styleFit: StyleFit | null;
  narrative: Narrative | null;
}

/** Accent-pill eyebrow — matches the dashboard cockpit cards. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] [&_svg]:size-3">
      {children}
    </p>
  );
}

export default function InsightsPage() {
  return (
    <AppShell>
      <InsightsContent />
    </AppShell>
  );
}

interface JobRow extends TargetJob {
  match: number;
}

function InsightsContent() {
  const [data, setData] = useState<Payload | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [claims, setClaims] = useState<SkillClaimInput[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [tab, setTab] = useState<"analysis" | "actions">("analysis");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/me/intelligence", { cache: "no-store" }).catch(() => null),
        fetch("/api/jobs", { cache: "no-store" }).catch(() => null),
        fetch("/api/me/skills", { cache: "no-store" }).catch(() => null),
      ]);
      const [j1, j2, j3] = await Promise.all([
        r1?.json().catch(() => null),
        r2?.json().catch(() => null),
        r3?.json().catch(() => null),
      ]);
      if (cancelled) return;
      if (j2?.ok) {
        setJobs(j2.data.jobs as JobRow[]);
        if (j2.data.jobs[0]) setSelectedJobId(j2.data.jobs[0].id);
      }
      if (j3?.ok) setClaims(j3.data.claims as SkillClaimInput[]);
      if (j1?.ok) {
        setData(j1.data as Payload);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0] ?? null;
  const truth = useMemo(
    () => (selectedJob && claims.length ? scoreSkillTruth(claims, selectedJob) : null),
    [claims, selectedJob],
  );

  if (status === "loading") {
    return (
      <div className="max-w-container text-muted-foreground mx-auto flex items-center gap-2 px-4 py-8">
        <Loader2 className="size-4 animate-spin" /> Reading across your modules…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="max-w-container mx-auto px-4 py-8">
        <div className="glass-3 rounded-2xl p-8 text-center">
          <TriangleAlert className="text-destructive mx-auto size-6" />
          <p className="mt-3 text-sm font-medium">Couldn&apos;t load your intelligence.</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const uv = data?.undervalued;

  // No profile data at all → point to the modules that feed this.
  if (!summary || !uv) {
    return (
      <div className="max-w-container mx-auto px-4 py-8">
        <div className="glass-3 ring-luminous/20 flex flex-col items-center gap-4 rounded-2xl p-10 text-center ring-1">
          <div className="bg-luminous/15 text-luminous-soft flex size-14 items-center justify-center rounded-2xl">
            <Sparkles className="size-6" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Add skills and portfolio entries to unlock insights.
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            Career Intelligence compares your Skill Radar against your Living
            Portfolio, Working Style, and the market — the more each module holds,
            the more it can reveal.
          </p>
          <div className="flex gap-2">
            <LinkButton href="/candidate/skills" variant="outline" size="sm">
              Skill Radar
            </LinkButton>
            <LinkButton href="/candidate/portfolio" variant="outline" size="sm">
              Living Portfolio
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-container mx-auto flex h-full w-full flex-col gap-3 px-4 pb-3 pt-3 lg:min-h-0">
      {/* Anchored header + Analysis|Actions toggle (never scroll) */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
          <Sparkles className="text-luminous size-5" />
          Career Intelligence
        </h1>
        <div
          role="group"
          aria-label="Intelligence view"
          className="border-border/15 bg-foreground/2 flex rounded-full border p-0.5"
        >
          {(
            [
              { id: "analysis", label: "Analysis" },
              { id: "actions", label: "Actions" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-8 rounded-full px-4 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-luminous/15 text-luminous-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "analysis" ? (
        /* Analysis = the read-across bundle (one internal scroll region) */
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <Grid12 className="gap-4">
            <Col span={12} lg={3}>
              <RolesRail jobs={jobs} selectedId={selectedJob?.id ?? ""} onSelect={setSelectedJobId} />
            </Col>
            <Col span={12} lg={5}>
              <WhereYouAreChart truth={truth} job={selectedJob} />
            </Col>
            <Col span={12} lg={4}>
              <CareerProfilePanel data={data!} truth={truth} job={selectedJob} />
            </Col>
          </Grid12>
          {data?.styleFit && <WorkAnimalCard fit={data.styleFit} />}
          {data?.narrative && <NarrativeCard n={data.narrative} />}
        </div>
      ) : (
        /* Actions = what to do next — gaps left, quiz + strengths right */
        <Grid12 className="min-h-0 flex-1 gap-4">
          <Col span={12} lg={7} className="flex min-h-0 flex-col">
            {data?.marketGaps ? (
              <MarketGapsCard gaps={data.marketGaps} ctx={data.marketContext} scroll />
            ) : (
              <div className="glass-3 text-muted-foreground flex h-full items-center justify-center rounded-2xl p-6 text-sm">
                No market-gap data yet — add skills to see what to improve.
              </div>
            )}
          </Col>
          <Col span={12} lg={5} className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            {data?.styleFit && <QuizChip fit={data.styleFit} />}
            <UndervaluedCard uv={uv} />
          </Col>
        </Grid12>
      )}
    </main>
  );
}

/** Compact working-style quiz entry (Actions tab, wireframe top-right). */
function QuizChip({ fit }: { fit: StyleFit }) {
  const a = ARCHETYPES[fit.archetype];
  return (
    <section className="glass-3 flex items-center gap-3 rounded-2xl p-4">
      <span
        aria-hidden
        className="bg-luminous/10 ring-luminous/25 flex size-12 shrink-0 items-center justify-center rounded-full text-2xl ring-2"
      >
        {a?.animalEmoji ?? "✨"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">The {a?.animal ?? fit.archetypeName}</p>
        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
          {fit.fitPct}% fit · {fit.field}
        </p>
      </div>
      <LinkButton href="/candidate/personality" variant="outline" size="sm">
        Work style quiz
      </LinkButton>
    </section>
  );
}

/** Undervalued strengths (extracted verbatim from the old Analysis stack). */
function UndervaluedCard({ uv }: { uv: UndervaluedResult }) {
  return (
    <section className="glass-3 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          <Gem aria-hidden />
          Undervalued strengths
        </Eyebrow>
        <Link
          href="/candidate/skills"
          aria-label="Open Skill Radar"
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Skills your portfolio proves, but your Skill Radar underrates.
      </p>

      {uv.strengths.length === 0 ? (
        <div className="mt-5 flex items-start gap-3">
          <CheckCircle2 className="text-clover mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            Your self-ratings line up with your portfolio evidence — nicely
            calibrated. Add more portfolio detail and we&apos;ll keep watching
            for hidden strengths.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-2.5">
            {uv.strengths.map((s) => (
              <li
                key={s.canonical}
                className="border-border/15 bg-foreground/2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border p-3"
              >
                <Chip tone="luminous" className="shrink-0 capitalize">
                  {s.skill}
                </Chip>
                <span className="text-clover inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
                  <Gem className="size-3" aria-hidden />
                  {s.evidenceCount}× in portfolio
                </span>
                <span className="text-muted-foreground min-w-40 flex-1 text-xs">
                  {s.reason}
                </span>
                <Link
                  href={`/candidate/skills?focus=${encodeURIComponent(s.canonical)}`}
                  className="text-luminous shrink-0 text-xs font-medium hover:underline"
                >
                  Fix on radar →
                </Link>
              </li>
            ))}
          </ul>

          {uv.nextStep && (
            <p className="border-luminous/30 bg-luminous/5 text-muted-foreground mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
              <Sparkles className="text-luminous mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{uv.nextStep}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Deterministic "AI" career summary — composed from the same signals the
 *  cards below expose (working style, portfolio evidence, hidden strength,
 *  market gap). No LLM: grounded, explainable, and stable for demos. */
function buildCareerSummary(d: Payload): string {
  const style = d.styleFit;
  const s = d.summary;
  const field = d.marketGaps?.field || d.marketContext?.field || style?.field || "your field";
  const parts: string[] = [];
  if (style) {
    parts.push(
      `Your working style reads as ${style.archetypeName}, a ${style.fitPct}% fit with the typical ${field} role`,
    );
  } else {
    parts.push(`Your profile is taking shape in ${field}`);
  }
  if (s) {
    parts.push(
      s.evidenceBacked > 0
        ? `with ${s.evidenceBacked} of ${s.skillsTracked} tracked skills backed by real evidence`
        : `with ${s.skillsTracked} tracked skill${s.skillsTracked === 1 ? "" : "s"} still to prove`,
    );
  }
  let text = parts.join(", ") + ".";
  const strength = d.undervalued?.strengths[0];
  if (strength) {
    text += ` Your portfolio shows real depth in ${strength.skill} that your Skill Radar currently underrates.`;
  }
  const gap = d.marketGaps?.gaps[0];
  if (gap) {
    text += ` To raise your readiness, ${gap.skill} is the highest-demand skill you haven't validated yet.`;
  } else if (d.undervalued?.nextStep) {
    text += ` ${d.undervalued.nextStep}`;
  }
  return text;
}

/** LEFT rail (wireframe): current job + selectable potential roles. */
function RolesRail({
  jobs,
  selectedId,
  onSelect,
}: {
  jobs: JobRow[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="glass-3 flex h-full flex-col rounded-2xl p-5">
      <Eyebrow>
        <Briefcase aria-hidden />
        Potential roles
      </Eyebrow>
      <p className="text-muted-foreground mt-2 text-xs">
        Ranked by your match — pick one to analyse.
      </p>
      <ul className="mt-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
        {jobs.slice(0, 8).map((j) => {
          const active = j.id === selectedId;
          return (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => onSelect(j.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-luminous/40 bg-luminous/12"
                    : "border-border/15 bg-foreground/2 hover:border-luminous/40",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{j.title}</span>
                  <span className="text-muted-foreground block truncate text-[10px]">
                    {j.company}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10px] font-semibold tabular-nums",
                    active ? "text-luminous" : "text-muted-foreground",
                  )}
                >
                  {j.match}%
                </span>
              </button>
            </li>
          );
        })}
        {jobs.length === 0 && (
          <p className="text-muted-foreground text-xs">No open roles loaded yet.</p>
        )}
      </ul>
    </section>
  );
}

/** MIDDLE (wireframe): per-skill bars vs the red dashed requirement line. */
function WhereYouAreChart({
  truth,
  job,
}: {
  truth: SkillTruth | null;
  job: JobRow | null;
}) {
  const axes = (truth?.axes ?? []).filter((a) => a.required > 0).slice(0, 5);
  // The skill closest to (but still under) the bar — the motivational callout.
  const nearest = [...axes]
    .filter((a) => a.you < a.required)
    .sort((a, b) => b.you - a.you)[0];

  return (
    <section className="glass-3 flex h-full flex-col rounded-2xl p-5">
      <Eyebrow>
        <TrendingUp aria-hidden />
        Where you are{job ? ` — ${job.title}` : ""}
      </Eyebrow>
      {axes.length ? (
        <>
          {/* Bars area: the dashed destructive line = the requirement (100). */}
          <div className="relative mt-4 flex-1">
            <div
              aria-hidden
              className="border-destructive/70 absolute inset-x-0 top-0 border-t border-dashed"
            />
            <p className="text-destructive/80 absolute -top-3 right-0 font-mono text-[9px] uppercase tracking-wider">
              Requirement
            </p>
            <div className="flex h-40 items-end justify-around gap-3 pt-2">
              {axes.map((a) => (
                <div key={a.skill} className="flex h-full w-full max-w-14 flex-col items-center justify-end gap-1">
                  <span
                    className={cn(
                      "text-[10px] font-semibold tabular-nums",
                      a.you >= a.required ? "text-clover" : "text-luminous",
                    )}
                  >
                    {a.you}
                  </span>
                  <div
                    title={`${a.skill} — ${a.you}/100`}
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      a.you >= a.required ? "bg-clover/70" : "bg-luminous/70",
                    )}
                    style={{ height: `${Math.max(4, a.you)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="border-border/20 flex justify-around gap-3 border-t pt-1.5">
              {axes.map((a) => (
                <p
                  key={a.skill}
                  title={a.skill}
                  className="text-muted-foreground w-full max-w-14 truncate text-center text-[9px] capitalize"
                >
                  {a.skill}
                </p>
              ))}
            </div>
          </div>
          <div className="border-border/15 bg-foreground/2 mt-3 rounded-lg border px-3 py-2">
            <p className="text-muted-foreground font-mono text-[9px] font-semibold uppercase tracking-wider">
              Skills
            </p>
            <p className="mt-0.5 text-xs leading-snug">
              {nearest
                ? `Your ${nearest.skill} is about to reach the requirement level — level it up by adding evidence.`
                : "Every required skill clears the bar for this role — nice."}
            </p>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground mt-4 text-xs">
          Add skills on your Skill Radar to see how you measure against this role.
        </p>
      )}
    </section>
  );
}

/** RIGHT (wireframe): desired-job progress + portfolio summary + AI summary. */
function CareerProfilePanel({
  data,
  truth,
  job,
}: {
  data: Payload;
  truth: SkillTruth | null;
  job: JobRow | null;
}) {
  const summary = data.summary;
  return (
    <section className="glass-3 ring-luminous/20 flex h-full flex-col gap-3 rounded-2xl p-5 ring-1">
      {/* Desired job / position progress */}
      <div>
        <div className="text-muted-foreground flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-wider">
          <span className="truncate">{job ? job.title : "Desired position"}</span>
          <span className="text-luminous text-sm tabular-nums">
            {truth ? `${truth.score}%` : "—"}
          </span>
        </div>
        <div className="bg-foreground/8 mt-1.5 h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-luminous h-full rounded-full transition-all"
            style={{ width: `${truth?.score ?? 0}%` }}
          />
        </div>
      </div>

      {/* Living Portfolio evidence summary */}
      <div className="border-border/15 bg-foreground/2 rounded-xl border p-3">
        <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-wider">
          Living Portfolio
        </p>
        <ul className="text-muted-foreground mt-1.5 space-y-1 text-xs">
          <li>
            <span className="text-foreground font-medium">
              {summary?.evidenceBacked ?? 0}
            </span>{" "}
            of {summary?.skillsTracked ?? 0} skills backed by evidence
          </li>
          <li>
            <span className="text-foreground font-medium">
              {data.narrative?.themes.length ?? 0}
            </span>{" "}
            reflection theme{(data.narrative?.themes.length ?? 0) === 1 ? "" : "s"} from your journal
            {data.narrative?.dominantMood ? ` · mostly ${data.narrative.dominantMood}` : ""}
          </li>
        </ul>
        <LinkButton href="/candidate/portfolio" variant="outline" size="sm" className="mt-2">
          Open portfolio
        </LinkButton>
      </div>

      {/* AI Career Summary — deterministic, grounded in the data above */}
      <div className="border-luminous/30 bg-luminous/5 rounded-xl border p-3">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
          <Sparkles className="size-3" aria-hidden /> AI summary
        </p>
        <p className="mt-1.5 text-xs leading-relaxed">{buildCareerSummary(data)}</p>
        <p className="text-muted-foreground/80 mt-2 text-[10px]">
          Generated from your own data — no black box.
        </p>
      </div>
    </section>
  );
}

const ENERGY_TONE = {
  energizing: "clover",
  draining: "warning",
  neutral: "neutral",
} as const;

function NarrativeCard({ n }: { n: Narrative }) {
  return (
    <section className="glass-3 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          <NotebookPen aria-hidden />
          Narrative themes
        </Eyebrow>
        <Link
          href="/candidate/chapters/journal"
          aria-label="Open Timeline Journal"
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Patterns your Timeline Journal reveals across entries.
        {(n.pivots > 0 || n.dominantMood) && (
          <>
            {" "}
            <span className="text-foreground/80">
              {n.pivots > 0
                ? `${n.pivots} turning point${n.pivots === 1 ? "" : "s"}`
                : ""}
              {n.pivots > 0 && n.dominantMood ? " · " : ""}
              {n.dominantMood ? `mostly ${n.dominantMood}` : ""}
            </span>
          </>
        )}
      </p>

      {n.themes.length === 0 ? (
        <div className="mt-5 flex items-start gap-3">
          <NotebookPen className="text-luminous mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            No repeating theme yet. Write a few journal entries and tag the
            skills they touch — patterns will surface here.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 flex flex-wrap gap-2">
            {n.themes.map((t) => (
              <li
                key={t.theme}
                className="border-border/15 bg-foreground/2 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3"
              >
                <Chip tone={ENERGY_TONE[t.energy]} className="capitalize">
                  {t.theme}
                </Chip>
                <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                  ×{t.count}
                </span>
                {!t.inPortfolio && (
                  <span
                    className="text-[10px] font-medium text-yellow-400"
                    title="Written about, but not yet proven in your portfolio"
                  >
                    unproven
                  </span>
                )}
              </li>
            ))}
          </ul>

          {n.tensions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {n.tensions.map((t) => (
                <li
                  key={t}
                  className="text-muted-foreground flex items-start gap-2 text-xs"
                >
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-yellow-400" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}

          {n.nextStep && (
            <p className="border-luminous/30 bg-luminous/5 text-muted-foreground mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
              <Sparkles className="text-luminous mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{n.nextStep}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Work-animal personality (mentor spec): the compass pentagon is gone —
 *  the archetype now reads as an animal you can picture in a workplace. */
function WorkAnimalCard({ fit }: { fit: StyleFit }) {
  const archetype = ARCHETYPES[fit.archetype];
  return (
    <section className="glass-3 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          <Sparkles aria-hidden />
          Your work animal
        </Eyebrow>
        <Link
          href="/candidate/personality"
          aria-label="Open Working Style Quiz"
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <span
          aria-hidden
          className="bg-luminous/10 ring-luminous/25 flex size-24 shrink-0 items-center justify-center rounded-full text-5xl ring-2"
        >
          {archetype?.animalEmoji ?? "✨"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold tracking-tight">
            The {archetype?.animal ?? fit.archetypeName}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {fit.archetypeName}
            </span>
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {archetype?.animalNote ?? ""}
          </p>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            {fit.reasons.slice(1, 3).map((r) => (
              <li key={r} className="flex gap-1.5">
                <span className="text-luminous">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          <ProgressRing value={fit.fitPct} label={`Fit · ${fit.field}`} size={96} />
        </div>
      </div>

      <p className="border-clover/25 bg-clover/5 text-muted-foreground mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
        <ShieldCheck className="text-clover mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>{fit.biasNote}</span>
      </p>
    </section>
  );
}

function fmtSalary(ctx: MarketContext): string | null {
  if (!ctx.salaryMinYr || !ctx.salaryMaxYr) return null;
  const k = (n: number) => `${ctx.currency}${Math.round(n / 1000)}k`;
  return `${k(ctx.salaryMinYr)}–${k(ctx.salaryMaxYr)}/yr`;
}

function MarketGapsCard({
  gaps,
  ctx,
  scroll,
}: {
  gaps: MarketGapsResult;
  ctx: MarketContext | null;
  /** In the Actions tab the card fills its column and its list scrolls. */
  scroll?: boolean;
}) {
  const salary = ctx ? fmtSalary(ctx) : null;
  return (
    <section
      className={cn(
        "glass-3 rounded-2xl p-6",
        scroll && "flex h-full min-h-0 flex-col",
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          <TrendingUp aria-hidden />
          Market gaps
        </Eyebrow>
        <Link
          href="/jobs"
          aria-label="Browse jobs"
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-muted-foreground mt-2 shrink-0 text-xs">
        In-demand skills you haven&apos;t validated — ranked by real market
        demand.
        {ctx && (
          <>
            {" "}
            <span className="text-foreground/80">
              {ctx.field}: {ctx.postingCount.toLocaleString()} live postings
              {salary ? ` · ${salary}` : ""}
            </span>
          </>
        )}
      </p>

      {gaps.gaps.length === 0 ? (
        <div className="mt-5 flex items-start gap-3">
          <CheckCircle2 className="text-clover mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            You already cover the most in-demand skills for your field — no major
            market gaps.
          </p>
        </div>
      ) : (
        <>
          <ul
            className={cn(
              "mt-4 space-y-2.5",
              scroll && "min-h-0 flex-1 overflow-y-auto pr-1",
            )}
          >
            {gaps.gaps.map((g) => (
              <li
                key={g.skill}
                className="border-border/15 bg-foreground/2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3"
              >
                <Chip tone="clover" className="shrink-0 capitalize">
                  {g.skill}
                </Chip>
                <div className="flex min-w-40 flex-1 items-center gap-2">
                  <span className="bg-foreground/8 h-1.5 min-w-16 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-clover block h-full rounded-full"
                      style={{ width: `${g.demandScore}%` }}
                    />
                  </span>
                  <span className="text-clover shrink-0 font-mono text-[10px] font-semibold tabular-nums">
                    {g.demandScore}/100
                  </span>
                </div>
                <Link
                  href={`/candidate/skills?focus=${encodeURIComponent(g.skill)}`}
                  className="text-luminous shrink-0 text-xs font-medium hover:underline"
                >
                  Add skill →
                </Link>
              </li>
            ))}
          </ul>
          {gaps.nextStep && (
            <p className="border-clover/30 bg-clover/5 text-muted-foreground mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
              <TrendingUp className="text-clover mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{gaps.nextStep}</span>
            </p>
          )}
        </>
      )}
    </section>
  );
}
