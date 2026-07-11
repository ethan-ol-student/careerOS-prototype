"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HeartPulse,
  ShieldCheck,
  TriangleAlert,
  Scale,
  Compass,
  GitBranch,
  Map as MapIcon,
  Wrench,
  Lightbulb,
  Signpost,
  Lock,
} from "lucide-react";
import { Col } from "@/components/app/Grid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
  MeterRow,
  EmptyHint,
  MockBadge,
} from "@/components/dashboard/PhaseWidgetGrid";
import type { CandidateDashboardData } from "@/lib/dashboard/types";
import type { ScoreResult } from "@/lib/intelligence/scoringConfig";
import { scoreCareerHealth } from "@/lib/intelligence/careerHealthEngine";
import { scoreTransferableSkills } from "@/lib/intelligence/transferableSkillEngine";
import { scoreLifeImpact, type BenchmarkRow } from "@/lib/intelligence/fairPayEngine";
import { analyzeCareerStory, type StoryExperience } from "@/lib/intelligence/careerStoryEngine";
import { simulateNextMoves } from "@/lib/intelligence/nextMoveSimulator";
import { UpgradeModal } from "@/components/billing/UpgradeModal";

/** Extras fetched once from /api/me/mid-career (candidate-scoped). */
interface MidCareerExtras {
  /** Freemium: false = Fair Pay + Skill Bridge detail are server-redacted. */
  entitled: boolean;
  midCareer: {
    problemsSolved: string[];
    careerPattern: string;
    salaryPrivate: number | null;
    salaryCurrency: string;
    lifeFactors: string[];
  } | null;
  experiences: StoryExperience[];
  benchmark: BenchmarkRow | null;
  topJobs: {
    id: string;
    title: string;
    company: string;
    requiredSkills: string[];
    score: number;
    matched: string[];
    missing: string[];
    reasons: string[];
    gapCount: number;
  }[];
}

/** Locked-teaser body for Pro-gated cards (server redacts the data too). */
function LockedTeaser({
  copy,
  onUnlock,
}: {
  copy: string;
  onUnlock: () => void;
}) {
  return (
    <div className="border-border/15 bg-foreground/2 rounded-xl border border-dashed p-4">
      <p className="text-muted-foreground flex items-start gap-2 text-sm">
        <Lock className="text-luminous mt-0.5 size-4 shrink-0" aria-hidden />
        {copy}
      </p>
      <Button size="sm" className="mt-3" onClick={onUnlock}>
        Unlock with Pro
      </Button>
    </div>
  );
}

/** "Why this recommendation?" expander — one contract for every card. */
function WhyExpander({ result }: { result: ScoreResult }) {
  return (
    <details className="border-border/15 mt-3 rounded-lg border">
      <summary className="text-luminous cursor-pointer px-3 py-2 text-xs font-semibold">
        Why this recommendation?
      </summary>
      <div className="px-3 pb-3">
        <ul className="text-muted-foreground space-y-1 text-xs">
          {result.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
        {result.uncertainty && (
          <p className="text-muted-foreground/70 mt-2 text-[11px] italic">
            {result.uncertainty}
          </p>
        )}
      </div>
    </details>
  );
}

/**
 * The mid-career "Career Health" dashboard home. Every number comes from a
 * deterministic engine over real profile data — no black boxes; each card
 * carries a "Why this recommendation?" expander. Registered for the
 * mid-career, senior-career, and executive phases.
 */
export function CareerHealthHome({ data }: { data: CandidateDashboardData }) {
  const [extras, setExtras] = useState<MidCareerExtras | null>(null);
  const [salaryDraft, setSalaryDraft] = useState("");
  const [savingSalary, setSavingSalary] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/mid-career", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setExtras(json.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  async function saveSalary() {
    const value = salaryDraft.trim() === "" ? null : Number(salaryDraft);
    if (value !== null && (!Number.isFinite(value) || value < 0)) return;
    setSavingSalary(true);
    await fetch("/api/me/mid-career", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryPrivate: value }),
    });
    await load();
    setSavingSalary(false);
    setSalaryDraft("");
  }

  // ── Engines (pure, deterministic) ────────────────────────────────
  const health = scoreCareerHealth({
    currentSkills: data.currentSkills,
    skillsToImprove: data.skillsToImprove,
    targetRoles: data.targetRoles,
    desiredNextMove: data.desiredNextMove,
  });

  // Fair Pay & Life Impact: fairness band + take-home delta + life
  // factors + a smart/balanced/risky move verdict.
  const lifeImpact = scoreLifeImpact(
    extras?.midCareer?.salaryPrivate ?? null,
    extras?.benchmark ?? null,
    extras?.midCareer?.lifeFactors ?? [],
  );
  const fairPay = lifeImpact.fairPay;

  const story = analyzeCareerStory({
    experiences: extras?.experiences ?? [],
    careerPattern: extras?.midCareer?.careerPattern ?? "",
    problemsSolved: extras?.midCareer?.problemsSolved ?? [],
  });

  const bestJob = extras?.topJobs[0] ?? null;
  const skillGaps = bestJob?.missing.slice(0, 3) ?? [];
  // Freemium: server already redacted the gated fields; `locked` only
  // switches the UI to honest teasers instead of empty-looking cards.
  const locked = !!extras && !extras.entitled;
  const gapCount = bestJob?.gapCount ?? 0;

  // Transferable map: current skills vs each top job's requirements.
  const doors = (extras?.topJobs ?? []).map((job) => ({
    job,
    transfer: scoreTransferableSkills({
      currentSkills: data.currentSkills,
      targetSkills: job.requiredSkills,
      targetLabel: job.title,
    }),
  }));

  // Next Move Navigator: three explainable pathways (safe/growth/bold).
  const pathways = simulateNextMoves({
    currentSkills: data.currentSkills,
    desiredNextMove: data.desiredNextMove,
    topJobs: extras?.topJobs ?? [],
    salary: extras?.midCareer?.salaryPrivate ?? null,
    benchmark: extras?.benchmark ?? null,
  });

  // Recommended action this month — first weak point wins (deterministic).
  const action =
    health.atRisk.length > health.maintained.length && health.atRisk[0]
      ? `Refresh one at-risk skill this month: start with "${health.atRisk[0]}".`
      : skillGaps[0]
        ? `Close one bridge skill toward ${bestJob?.title}: "${skillGaps[0]}".`
        : locked && gapCount > 0
          ? `${gapCount} skill${gapCount === 1 ? "" : "s"} stand between you and ${bestJob?.title} — unlock your Skill Bridge plan to see them.`
          : extras?.midCareer?.salaryPrivate == null
            ? "Add your salary (optional, private) to unlock the fair-pay check."
            : "Document one more problem you solved — proof compounds.";

  return (
    <>
      {/* ── Row 1: Career Health Score home ── */}
      <PhaseWidgetGrid>
        <Col span={12} lg={5}>
          <DashboardCard glow="luminous" className="h-full">
            <WidgetHeader
              icon={HeartPulse}
              eyebrow="Career health"
              title="Your Career Health Score"
              description="Skill maintenance + specialization + direction."
            />
            <MeterRow
              label="Career health"
              value={health.score}
              accent="luminous"
              className="mb-3"
            />
            {(health.factors ?? []).map((f) => (
              <MeterRow
                key={f.label}
                label={f.label}
                value={f.max ? Math.round((f.points / f.max) * 100) : f.points}
                accent="clover"
                className="mb-2"
              />
            ))}
            <WhyExpander result={health} />
          </DashboardCard>
        </Col>

        {/* Skill relevance */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={ShieldCheck}
              eyebrow="Skill relevance"
              title="Maintained vs. at risk"
              action={<MockBadge label="Heuristic" />}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-clover mb-2 text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Maintained ({health.maintained.length})
                </p>
                {health.maintained.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {health.maintained.map((s) => (
                      <li key={s}>
                        <Chip tone="clover">{s}</Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyHint>Mark skills you&apos;re improving to track upkeep.</EmptyHint>
                )}
              </div>
              <div>
                <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-yellow-400">
                  <TriangleAlert className="size-3.5" />
                  Watch for decay ({health.atRisk.length})
                </p>
                {health.atRisk.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {health.atRisk.map((s) => (
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
            <MeterRow
              label="Decay exposure"
              value={health.decayRisk}
              accent="luminous"
              caption={`${health.atRisk.length} of ${data.currentSkills.length || 0} skills not actively maintained`}
              className="mt-4"
            />
          </DashboardCard>
        </Col>

        {/* Fair Pay & Life Impact calculator */}
        <Col span={12} md={6} lg={4}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Scale}
              eyebrow="Fair pay & life impact"
              title="Is a move smart or risky?"
              action={fairPay.benchmark?.isDemo ? <MockBadge label="Demo data" /> : undefined}
            />
            {locked ? (
              <LockedTeaser
                copy="Compare your (private) salary against curated market benchmarks — percentile band, take-home delta, and a smart/balanced/risky verdict with its reasoning."
                onUnlock={() => setUpgradeFor("Fair Pay & Salary Benchmark report")}
              />
            ) : (
              <>
            {lifeImpact.verdict !== "unknown" && (
              <p
                className={
                  "mb-3 rounded-lg border px-3 py-2 text-sm " +
                  (lifeImpact.verdict === "smart"
                    ? "border-clover/30 bg-clover/10"
                    : lifeImpact.verdict === "risky"
                      ? "border-yellow-400/30 bg-yellow-400/10"
                      : "border-border/15 bg-foreground/2")
                }
              >
                <span className="font-semibold uppercase">{lifeImpact.verdict}</span>
                {" — "}
                {lifeImpact.takeHomeDeltaPct !== null &&
                  `market median is ${lifeImpact.takeHomeDeltaPct >= 0 ? "+" : ""}${lifeImpact.takeHomeDeltaPct}% vs your pay.`}
              </p>
            )}
            {fairPay.band === "unknown" ? (
              <EmptyHint className="mb-3">{lifeImpact.reasons[0]}</EmptyHint>
            ) : (
              <MeterRow
                label={`vs. ${fairPay.benchmark?.role ?? "market"}`}
                value={fairPay.score}
                accent={fairPay.score >= 60 ? "clover" : "luminous"}
                caption={fairPay.reasons[0]}
                className="mb-3"
              />
            )}
            {lifeImpact.lifeNotes.length > 0 && (
              <ul className="text-muted-foreground mb-3 space-y-1 text-xs">
                {lifeImpact.lifeNotes.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            )}
            {/* Optional, PRIVATE salary input — never shown to employers. */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={salaryDraft}
                onChange={(e) => setSalaryDraft(e.target.value)}
                placeholder={
                  extras?.midCareer?.salaryPrivate != null
                    ? `Current: ${extras.midCareer.salaryPrivate.toLocaleString("en-US")}`
                    : "Your salary (optional, private)"
                }
                className="border-border/15 bg-foreground/2 focus:border-luminous/60 min-h-9 w-full rounded-lg border px-2 text-xs outline-none"
              />
              <Button
                size="xs"
                variant="outline"
                onClick={saveSalary}
                disabled={savingSalary || salaryDraft.trim() === ""}
              >
                {savingSalary ? "…" : "Update"}
              </Button>
            </div>
            <WhyExpander result={lifeImpact} />
              </>
            )}
          </DashboardCard>
        </Col>

        {/* Best next move */}
        <Col span={12} md={6} lg={4}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={Compass}
              eyebrow="Best next move"
              title={bestJob ? bestJob.title : "Your chosen track"}
            />
            {data.desiredNextMove && (
              <p className="border-border/15 bg-foreground/2 mb-3 rounded-lg border px-3 py-2 text-sm">
                {data.desiredNextMove}
              </p>
            )}
            {bestJob ? (
              <>
                <MeterRow
                  label={`${bestJob.title} · ${bestJob.company}`}
                  value={bestJob.score}
                  accent="luminous"
                  caption={`${bestJob.matched.length}/${bestJob.requiredSkills.length} required skills already met`}
                />
                <WhyExpander
                  result={{ score: bestJob.score, reasons: bestJob.reasons }}
                />
              </>
            ) : (
              <EmptyHint>Loading your best-matching role…</EmptyHint>
            )}
          </DashboardCard>
        </Col>

        {/* Top-3 skill gaps + recommended action */}
        <Col span={12} lg={4}>
          <DashboardCard glow="clover" className="h-full">
            <WidgetHeader
              icon={Lightbulb}
              eyebrow="This month"
              title="Top skill gaps & one action"
            />
            {locked && gapCount > 0 ? (
              <p className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
                <Lock className="text-luminous size-4 shrink-0" aria-hidden />
                {gapCount} gap{gapCount === 1 ? "" : "s"} found — the exact
                skills are part of your Pro Skill Bridge plan.
              </p>
            ) : skillGaps.length ? (
              <ul className="mb-3 flex flex-wrap gap-1.5">
                {skillGaps.map((s) => (
                  <li key={s}>
                    <Chip tone="warning">{s}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint className="mb-3">
                No gaps against your best-matching role.
              </EmptyHint>
            )}
            <p className="border-clover/30 bg-clover/10 rounded-lg border px-3 py-2 text-sm">
              <span className="text-clover font-semibold">Recommended: </span>
              {action}
            </p>
          </DashboardCard>
        </Col>
      </PhaseWidgetGrid>

      {/* ── Row 2: Story map + transferable map + bridge plan ── */}
      <PhaseWidgetGrid topLine>
        {/* Career Story Map */}
        <Col span={12} lg={5}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={MapIcon}
              eyebrow="Career story map"
              title={`Pattern: ${story.pattern}`}
              description="Your history is proof of capability — not just titles."
            />
            <ol className="border-border/15 space-y-3 border-l pl-4">
              {(extras?.experiences ?? []).map((e, i) => (
                <li key={i} className="relative">
                  <span className="bg-luminous absolute -left-5.25 top-1.5 size-2 rounded-full" />
                  <p className="text-sm font-medium">{e.role}</p>
                  <p className="text-muted-foreground text-xs">
                    {e.company} · {e.period}
                  </p>
                </li>
              ))}
              {(extras?.experiences ?? []).length === 0 && (
                <EmptyHint>Add experiences in your portfolio to map your story.</EmptyHint>
              )}
            </ol>
            {story.hiddenStrengths.length > 0 && (
              <>
                <p className="text-clover mt-4 text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Hidden strengths
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {story.hiddenStrengths.map((s) => (
                    <li key={s} className="text-sm">
                      • {s}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <WhyExpander result={story} />
          </DashboardCard>
        </Col>

        {/* Transferable Skill Map */}
        <Col span={12} lg={7}>
          <DashboardCard className="h-full">
            <WidgetHeader
              icon={GitBranch}
              eyebrow="Transferable skill map"
              title="Same skill, different door"
              description="How much of each nearby role you already cover."
            />
            {doors.length === 0 ? (
              <EmptyHint>Loading nearby roles…</EmptyHint>
            ) : (
              <div className="space-y-4">
                {doors.map(({ job, transfer }) => (
                  <div key={job.id}>
                    <MeterRow
                      label={`${job.title} · ${job.company}`}
                      value={transfer.score}
                      accent="luminous"
                      caption={
                        transfer.transferable.length
                          ? `Transfers: ${transfer.transferable.slice(0, 4).join(", ")}`
                          : "No direct transfers detected yet"
                      }
                    />
                  </div>
                ))}
                <WhyExpander result={doors[0].transfer} />
              </div>
            )}
          </DashboardCard>
        </Col>

        {/* Next Move Navigator — three explainable pathways */}
        <Col span={12}>
          <DashboardCard>
            <WidgetHeader
              icon={Signpost}
              eyebrow="Next move navigator"
              title="Three ways forward — safe, growth, bold"
              description="Compare the trade-offs before you commit energy to one."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {pathways.map((p) => (
                <div
                  key={p.id}
                  className="border-border/15 bg-foreground/2 flex flex-col rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{p.label}</p>
                    <Chip
                      tone={
                        p.flavor === "safe"
                          ? "clover"
                          : p.flavor === "growth"
                            ? "luminous"
                            : "warning"
                      }
                    >
                      {p.flavor}
                    </Chip>
                  </div>
                  <MeterRow
                    label="Confidence"
                    value={p.score}
                    accent={p.flavor === "safe" ? "clover" : "luminous"}
                    className="mt-3"
                  />
                  <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
                    <li>• Difficulty: {p.difficulty}</li>
                    <li>
                      • Salary impact:{" "}
                      {p.salaryImpactPct !== null
                        ? `${p.salaryImpactPct >= 0 ? "+" : ""}${p.salaryImpactPct}%`
                        : "add your salary to estimate"}
                    </li>
                    <li>• Time to land: ~{p.timeMonths} months</li>
                    <li>
                      • Skill gap:{" "}
                      {p.skillGap.length ? p.skillGap.join(", ") : "none detected"}
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <WhyExpander result={p} />
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </Col>

        {/* Skill Bridge Plan */}
        <Col span={12}>
          <DashboardCard glow="luminous">
            <WidgetHeader
              icon={Wrench}
              eyebrow="Skill bridge plan"
              title="Minimum skill upgrade"
              description={
                bestJob
                  ? `The shortest path to "${bestJob.title}" — close ${locked ? gapCount : skillGaps.length || 0} skill${(locked ? gapCount : skillGaps.length) === 1 ? "" : "s"}, keep everything you already have.`
                  : "Your shortest path to the next role."
              }
            />
            {locked && bestJob ? (
              <LockedTeaser
                copy={`You already cover ${bestJob.matched.length}/${bestJob.requiredSkills.length} of "${bestJob.title}"'s requirements. Pro names the exact ${gapCount} skill${gapCount === 1 ? "" : "s"} to close — the minimum upgrade, nothing more.`}
                onUnlock={() => setUpgradeFor("Skill Bridge plan")}
              />
            ) : bestJob ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-clover mb-2 text-[11px] font-mono font-semibold uppercase tracking-wider">
                    Already in place ({bestJob.matched.length})
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {bestJob.matched.map((s) => (
                      <li key={s}>
                        <Chip tone="clover">{s}</Chip>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-yellow-400">
                    The bridge ({skillGaps.length})
                  </p>
                  {skillGaps.length ? (
                    <ol className="space-y-1.5">
                      {skillGaps.map((s, i) => (
                        <li key={s} className="text-sm">
                          {i + 1}. <span className="font-medium">{s}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <EmptyHint>Bridge closed — you meet every requirement.</EmptyHint>
                  )}
                </div>
              </div>
            ) : (
              <EmptyHint>Loading your bridge plan…</EmptyHint>
            )}
          </DashboardCard>
        </Col>
      </PhaseWidgetGrid>

      <UpgradeModal
        isOpen={upgradeFor !== null}
        onClose={() => setUpgradeFor(null)}
        onUpgraded={load}
        feature={upgradeFor ?? undefined}
      />
    </>
  );
}
