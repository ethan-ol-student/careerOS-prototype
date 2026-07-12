"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
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
import { PageHeader } from "@/components/app/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { LinkButton } from "@/components/ui/LinkButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { JobStyleCompass } from "@/components/market/JobStyleCompass";

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
      <PageHeader
        eyebrow="Career Intelligence"
        title={
          <>
            What your data <span className="text-luminous">reveals</span>
          </>
        }
      />
      <section className="max-w-container mx-auto px-4 py-8 sm:py-10">
        <InsightsContent />
      </section>
    </AppShell>
  );
}

function InsightsContent() {
  const [data, setData] = useState<Payload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/me/intelligence", { cache: "no-store" }).catch(
        () => null,
      );
      const json = await res?.json().catch(() => null);
      if (cancelled) return;
      if (json?.ok) {
        setData(json.data as Payload);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Reading across your modules…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="glass-3 rounded-2xl p-8 text-center">
        <TriangleAlert className="text-destructive mx-auto size-6" />
        <p className="mt-3 text-sm font-medium">Couldn&apos;t load your intelligence.</p>
      </div>
    );
  }

  const summary = data?.summary;
  const uv = data?.undervalued;

  // No profile data at all → point to the modules that feed this.
  if (!summary || !uv) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Signal summary strip — cockpit language */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { cap: "Skills tracked", val: summary.skillsTracked },
          { cap: "Backed by evidence", val: summary.evidenceBacked },
          { cap: "Hidden strengths", val: summary.undervaluedCount },
        ].map((s) => (
          <div key={s.cap} className="glass-4 rounded-xl p-3 sm:p-4">
            <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-wider">
              {s.cap}
            </p>
            <p className="text-luminous mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* Undervalued strengths — the first cross-feature insight */}
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

      {/* Narrative themes — what the Timeline Journal reveals over time */}
      {data?.narrative && <NarrativeCard n={data.narrative} />}

      {/* Working-style fit — archetype vs the field's O*NET work styles */}
      {data?.styleFit && <StyleFitCard fit={data.styleFit} />}

      {/* Market gaps — candidate skills vs real ingested JobStreet demand */}
      {data?.marketGaps && (
        <MarketGapsCard gaps={data.marketGaps} ctx={data.marketContext} />
      )}
    </div>
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

function StyleFitCard({ fit }: { fit: StyleFit }) {
  return (
    <section className="glass-3 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          <Sparkles aria-hidden />
          Working-style fit
        </Eyebrow>
        <Link
          href="/candidate/personality"
          aria-label="Open Working Style Quiz"
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        How <span className="text-foreground/80">{fit.archetypeName}</span> lines
        up with the typical role in {fit.field}.
      </p>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <JobStyleCompass axes={fit.axes} />
        <div className="flex flex-col items-center gap-3 sm:pr-2">
          <ProgressRing value={fit.fitPct} label="Style fit" size={104} />
          <ul className="text-muted-foreground max-w-56 space-y-1 text-xs">
            {fit.reasons.slice(1).map((r) => (
              <li key={r} className="flex gap-1.5">
                <span className="text-luminous">·</span>
                {r}
              </li>
            ))}
          </ul>
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
}: {
  gaps: MarketGapsResult;
  ctx: MarketContext | null;
}) {
  const salary = ctx ? fmtSalary(ctx) : null;
  return (
    <section className="glass-3 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
      <p className="text-muted-foreground mt-2 text-xs">
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
          <ul className="mt-4 space-y-2.5">
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
