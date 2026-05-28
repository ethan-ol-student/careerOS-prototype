"use client";

import {
  Briefcase,
  Eye,
  Sparkles,
  TrendingUp,
  UserCog,
  Layers,
  Activity,
  Gauge,
  Target,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoopStep } from "./GrowthLoop";
import { targetJobs } from "@/components/intent-form/data";
import { coverage, countMatches } from "@/lib/jobs/destinations";

// ───────────────────────────────────────────────────────────────
// Shared types & helpers
// ───────────────────────────────────────────────────────────────

export interface LoopState {
  /** Skills the user has added so far (latest last). */
  skills: string[];
  /** Overall readiness — 0..100. */
  progress: number;
  /** Active loop step. */
  step: LoopStep;
  /** Steps that have completed during the current loop iteration. */
  reached: Set<LoopStep>;
  /** How many loops have completed (for opportunities/visibility scaling). */
  loops: number;
}

/**
 * Sub-panel header — intentionally muted. Section-level heads
 * (Skill Evolution, Monthly tasks, Career trajectory) use the
 * Luminous eyebrow; everything else stays in muted-foreground
 * so hierarchy doesn't collapse.
 */
function PanelHeader({
  icon: Icon,
  title,
  hint,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  active?: boolean;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn(
            "size-3.5 transition-colors",
            active ? "text-luminous" : "text-muted-foreground/80",
          )}
        />
        <p
          className={cn(
            "text-[11px] font-medium uppercase tracking-[0.12em] transition-colors",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </p>
      </div>
      {hint && (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-all",
            active
              ? "border-luminous/40 bg-luminous/10 text-luminous"
              : "border-border/40 text-muted-foreground",
          )}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 2. Profile evolves
// ───────────────────────────────────────────────────────────────

export function ProfilePanel({
  state,
  firstName,
  field,
  className,
}: {
  state: LoopState;
  firstName: string;
  field: string;
  className?: string;
}) {
  const active = state.step === "profile";
  const totalSkills = state.skills.length;
  const justAddedSkill = state.skills.at(-1);
  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6 transition-shadow",
        active && "ring-luminous/40 shadow-[0_0_0_2px_var(--luminous)] ring-2",
        className,
      )}
    >
      <PanelHeader
        icon={UserCog}
        title="Profile · evolving"
        hint={active ? "Updating" : "Synced"}
        active={active}
      />
      <div className="flex items-start gap-4">
        <div className="bg-luminous/15 flex size-14 shrink-0 items-center justify-center rounded-2xl">
          <span className="text-luminous text-xl font-semibold">
            {firstName.charAt(0).toUpperCase() || "C"}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{firstName}</p>
          <p className="text-muted-foreground truncate text-sm">
            {field || "Career OS member"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            <span className="text-foreground font-mono">{totalSkills}</span>{" "}
            tracked {totalSkills === 1 ? "skill" : "skills"} ·{" "}
            <span className="text-clover">+{state.loops}</span> compounded
          </p>
        </div>
      </div>

      <div className="border-border/40 mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-xs">
        <Stat label="Momentum" value={`+${10 + state.loops * 4}%`} accent="clover" />
        <Stat label="Depth" value={`${Math.min(totalSkills, 12)}/12`} />
        <Stat
          label="Readiness"
          value={
            state.progress < 40
              ? "Early"
              : state.progress < 70
                ? "Mid"
                : "Strong"
          }
        />
      </div>

      {justAddedSkill && active && (
        <div className="bg-luminous/10 border-luminous/30 mt-4 rounded-lg border px-3 py-2 text-xs">
          Adding{" "}
          <span className="text-luminous font-medium">{justAddedSkill}</span>{" "}
          to your living portfolio…
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "clover";
}) {
  return (
    <div>
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-base",
          accent === "clover" ? "text-clover" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 4. Opportunities
// ───────────────────────────────────────────────────────────────

const BASE_OPPS = [
  { title: "Junior Mechanical Engineer", company: "Honda Manufacturing", location: "Kuala Lumpur", baseMatch: 82, duration: "Full-time" },
  { title: "Design Engineer Intern", company: "Tesla", location: "Singapore", baseMatch: 78, duration: "6 months" },
  { title: "Robotics Engineer", company: "Universal Robots", location: "Remote", baseMatch: 74, duration: "Full-time" },
  { title: "Product Engineer", company: "Dyson", location: "Singapore", baseMatch: 70, duration: "Full-time" },
];

export function OpportunitiesPanel({
  state,
  className,
}: {
  state: LoopState;
  className?: string;
}) {
  const active = state.step === "opportunities";
  const bonusCount = Math.min(state.loops * 2, 6);
  const matchBump = Math.min(state.loops * 3, 18);
  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6 transition-shadow",
        active && "ring-luminous/40 shadow-[0_0_0_2px_var(--luminous)] ring-2",
        className,
      )}
    >
      <PanelHeader
        icon={Briefcase}
        title="Opportunities · live match"
        hint={active ? "Refreshing" : `${BASE_OPPS.length + bonusCount} open`}
        active={active}
      />
      <ul className="divide-border/30 flex flex-col divide-y">
        {BASE_OPPS.map((opp) => (
          <li
            key={opp.title}
            className="flex items-start justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{opp.title}</p>
              <p className="text-muted-foreground truncate text-xs">
                {opp.company}
              </p>
              <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {opp.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="size-3" />
                  {opp.duration}
                </span>
              </div>
            </div>
            <span className="bg-luminous/15 text-luminous shrink-0 rounded-md px-2 py-0.5 text-xs font-medium">
              {Math.min(opp.baseMatch + matchBump, 99)}%
            </span>
          </li>
        ))}
        {active && (
          <li className="border-luminous/40 bg-luminous/5 text-luminous mt-2 flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-xs">
            <span>+ Surfacing new matches from your new skill…</span>
            <ArrowUpRight className="size-3.5" />
          </li>
        )}
      </ul>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 5. Employer visibility
// ───────────────────────────────────────────────────────────────

export function VisibilityPanel({
  state,
  className,
}: {
  state: LoopState;
  className?: string;
}) {
  const active = state.step === "visibility";
  const lookups = 240 + state.loops * 78;
  const recruiters = 12 + state.loops * 4;
  const monthly = [
    20, 28, 36, 44,
    Math.min(60 + state.loops * 6, 96),
    Math.min(72 + state.loops * 5, 100),
  ];
  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6 transition-shadow",
        active && "ring-luminous/40 shadow-[0_0_0_2px_var(--luminous)] ring-2",
        className,
      )}
    >
      <PanelHeader
        icon={Eye}
        title="Employer visibility"
        hint={active ? "+ rising" : "this month"}
        active={active}
      />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-card/40 border-border/30 rounded-lg border p-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Profile lookups
          </p>
          <p className="mt-0.5 font-mono text-xl">{lookups}</p>
          <p className="text-clover mt-0.5 text-[11px]">
            ↑ {Math.round(state.loops * 22 + 6)}%
          </p>
        </div>
        <div className="bg-card/40 border-border/30 rounded-lg border p-3">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Recruiter saves
          </p>
          <p className="mt-0.5 font-mono text-xl">{recruiters}</p>
          <p className="text-clover mt-0.5 text-[11px]">
            ↑ {Math.round(state.loops * 14 + 4)}%
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">
          6-month visibility
        </p>
        <div className="flex h-16 items-end gap-1.5">
          {monthly.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-sm transition-all",
                i === monthly.length - 1
                  ? "bg-luminous"
                  : i === monthly.length - 2
                    ? "bg-luminous/60"
                    : "bg-luminous/25",
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="text-muted-foreground mt-1.5 flex justify-between text-[10px]">
          {["Dec", "Jan", "Feb", "Mar", "Apr", "Now"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// 6. AI recommendations
// ───────────────────────────────────────────────────────────────

export function AiRecommendationsPanel({
  state,
  className,
}: {
  state: LoopState;
  className?: string;
}) {
  const active = state.step === "ai";
  const latest = state.skills.at(-1);
  const recs = buildRecs(state.loops, latest);
  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6 transition-shadow",
        active && "ring-luminous/40 shadow-[0_0_0_2px_var(--luminous)] ring-2",
        className,
      )}
    >
      <PanelHeader
        icon={Sparkles}
        title="AI · next best moves"
        hint={active ? "Generating" : `${recs.length} active`}
        active={active}
      />
      <ul className="flex flex-col gap-3">
        {recs.map((rec, i) => (
          <li
            key={rec.title}
            className={cn(
              "border-border/40 bg-card/40 flex items-start gap-3 rounded-lg border p-3 transition-all",
              active && i === 0 && "border-luminous/50 bg-luminous/10",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                rec.tone === "bridge"
                  ? "bg-luminous/15 text-luminous"
                  : "bg-clover/15 text-clover",
              )}
            >
              <Layers className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{rec.title}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {rec.body}
              </p>
            </div>
            <ArrowUpRight className="text-muted-foreground size-3.5 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildRecs(loops: number, latest?: string) {
  const base = [
    {
      tone: "bridge" as const,
      title: latest
        ? `Pair "${latest}" with product analytics`
        : "Bridge skill · product analytics",
      body: "Unlocks 4 new pathways in tech and product roles.",
    },
    {
      tone: "growth" as const,
      title: "Portfolio gap · case study",
      body: "Adds depth to your Living Portfolio.",
    },
    {
      tone: "bridge" as const,
      title: "Compounding skill · storytelling",
      body: "Reused across 7 of your 8 trajectories.",
    },
  ];
  if (loops >= 2) {
    base.push({
      tone: "growth" as const,
      title: "Stretch chapter · 18-month pivot",
      body: "Try Bold Reinvention with your new skill set.",
    });
  }
  return base;
}

// ───────────────────────────────────────────────────────────────
// 7. Career Readiness — progress toward the user's target job
// ───────────────────────────────────────────────────────────────

export function ProgressPanel({
  state,
  targetJob,
  className,
}: {
  state: LoopState;
  /** The user's chosen target job from onboarding. */
  targetJob?: string;
  className?: string;
}) {
  const active = state.step === "progress";

  // Map the user's target-job label to a known preset (if any) so we
  // can pull its required skills. Custom targets get a generic
  // fallback that uses the user's loop progress.
  const preset = targetJobs.find((j) => j.label === targetJob);
  const required = preset?.requiredSkills ?? [];
  const matched = required.length
    ? countMatches(required, state.skills)
    : 0;
  const pct = required.length
    ? coverage(required, state.skills)
    : Math.min(state.progress, 100);

  const label = targetJob || "your next chapter";

  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6 transition-shadow",
        active && "ring-clover/40 shadow-[0_0_0_2px_var(--clover)] ring-2",
        className,
      )}
    >
      <PanelHeader
        icon={Gauge}
        title="Career readiness · toward your target"
        hint={active ? "+ growing" : "live"}
        active={active}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
            Aiming for
          </p>
          <p className="text-foreground truncate text-lg font-semibold">
            {label}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {required.length > 0 ? (
              <>
                <span className="text-foreground font-mono">{matched}</span> of{" "}
                <span className="text-foreground font-mono">
                  {required.length}
                </span>{" "}
                required skills covered
              </>
            ) : (
              <>
                Custom target — readiness compounds with every loop you
                complete.
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-4xl font-semibold leading-none">
            {pct}
            <span className="text-muted-foreground text-xl">%</span>
          </p>
          <span className="bg-clover/15 text-clover mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium">
            <Activity className="size-3" />+{state.loops * 7 || 0}% this month
          </span>
        </div>
      </div>
      <div className="bg-muted/50 mt-4 h-3 w-full overflow-hidden rounded-full">
        <div
          className="from-clover to-clover-soft h-full rounded-full bg-linear-to-r transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {required.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {required.map((req) => {
            const hit = countMatches([req], state.skills) > 0;
            return (
              <li
                key={req}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  hit
                    ? "bg-clover/15 text-clover border-clover/40"
                    : "border-border/60 text-muted-foreground bg-card/40",
                )}
              >
                {hit ? "✓ " : "+ "}
                {req}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        Every new skill matching a requirement nudges this bar. Reach 100% and
        we&apos;ll ping you to reach out to matching employers.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Skill ledger (legacy — kept for compatibility but no longer used
// on the dashboard. The active entry point is SkillEvolutionCard.)
// ───────────────────────────────────────────────────────────────

export function SkillLedger({
  state,
  className,
}: {
  state: LoopState;
  className?: string;
}) {
  const ordered = [...state.skills].reverse();
  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6",
        className,
      )}
    >
      <PanelHeader icon={Target} title="Skill ledger" hint="local · live" />
      {ordered.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed border-border/50 px-3 py-4 text-center text-xs">
          No skills yet. Add one above to start the loop.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {ordered.map((skill, i) => (
            <li
              key={`${skill}-${i}`}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                i === 0
                  ? "bg-clover/15 text-clover border-clover/40"
                  : "border-border/60 text-muted-foreground bg-card/40",
              )}
            >
              {skill}
              {i === 0 && (
                <span className="ml-1.5 text-[10px] uppercase tracking-wider">
                  new
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* The TrendingUp import is preserved for downstream consumers
   that might still reference it via re-exports. */
export type { LoopStep } from "./GrowthLoop";
export const _trendingUp = TrendingUp; // keep import live for tree-shaking sanity
