"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flame, CalendarCheck, Fingerprint, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ARCHETYPES } from "@/lib/intelligence/scoringConfig";
import { scoreCareer } from "@/lib/intelligence/careerScoreEngine";
import type { CandidateDashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

interface GamState {
  xpTotal: number;
  streak: { current: number; best: number; cadence: "daily" | "monthly" };
  badges: { key: string }[];
  checkedInThisPeriod: boolean;
}

/** Small self-fetching archetype chip for the dashboard header. */
export function ArchetypeBadge() {
  const [archetype, setArchetype] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/personality", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      setArchetype(json?.ok ? (json.data.result?.archetype ?? "") : "");
    })();
  }, []);
  if (archetype === null) return null; // loading — render nothing
  const a = archetype ? ARCHETYPES[archetype] : null;
  return (
    <Link href="/candidate/personality" title={a ? a.description : undefined}>
      <Chip tone={a ? "luminous" : "neutral"} className="cursor-pointer">
        <Fingerprint className="mr-1 inline size-3" />
        {a ? a.name : "Working style: take the quiz"}
      </Chip>
    </Link>
  );
}

/** SVG readiness ring — value 0–100. */
function ReadinessRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-border/40" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
        className="stroke-luminous"
      />
      <text x="32" y="36" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
        {value}
      </text>
    </svg>
  );
}

/**
 * Age-tuned engagement widget (Feature 4).
 * - Younger phases: readiness ring + daily check-in + streak + XP.
 * - Mid-career+ (cadence "monthly"): a QUIET Monthly Career Check-Up —
 *   no flame, no daily pressure, XP de-emphasised.
 * XP rewards the one deliberate action; streaks bridge a single missed
 * period (forgivable by design).
 */
export function GamificationWidget({ data }: { data: CandidateDashboardData }) {
  const [state, setState] = useState<GamState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/me/gamification", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (json?.ok) setState(json.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  async function checkIn() {
    setBusy(true);
    await fetch("/api/me/checkin", { method: "POST" });
    await load();
    setBusy(false);
  }

  if (!state) return null;
  const monthly = state.streak.cadence === "monthly";

  const readiness = scoreCareer({
    headline: data.portfolio.headline,
    careerDirection: data.field,
    topSkills: data.portfolio.skills,
    portfolioProjects: Array.from(
      { length: data.portfolio.projectCount },
      (_, i) => `p${i}`,
    ),
  }).score;

  if (monthly) {
    // Quiet Monthly Career Check-Up — calm copy, no streak flame.
    return (
      <section className="px-4 pt-4">
        <div className="max-w-container mx-auto">
          <div className="glass-2 line-t flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center">
            <CalendarCheck className="text-clover size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Monthly Career Check-Up</p>
              <p className="text-muted-foreground text-xs">
                {state.checkedInThisPeriod
                  ? `Done for this month — ${state.streak.current} consecutive month${state.streak.current === 1 ? "" : "s"}. See you next month.`
                  : "A five-minute look at your career health. Once a month is enough."}
              </p>
            </div>
            {!state.checkedInThisPeriod && (
              <Button size="sm" variant="outline" onClick={checkIn} disabled={busy}>
                {busy ? "Saving…" : "Check in"}
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Younger phases: ring + streak + XP + daily check-in.
  return (
    <section className="px-4 pt-4">
      <div className="max-w-container mx-auto">
        <div className="glass-2 line-t flex flex-col gap-4 rounded-2xl px-5 py-4 sm:flex-row sm:items-center">
          <ReadinessRing value={readiness} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Readiness {readiness} ·{" "}
              <span className="text-luminous">{state.xpTotal} XP</span>
            </p>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <Flame
                className={cn(
                  "size-3.5",
                  state.streak.current > 0 ? "text-clover" : "text-muted-foreground",
                )}
              />
              {state.streak.current}-day streak (best {state.streak.best}) —
              missing one day never resets it.
            </p>
            {state.badges.length > 0 && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                <Award className="text-luminous size-3.5" />
                {state.badges.map((b) => b.key).join(" · ")}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={checkIn}
            disabled={busy || state.checkedInThisPeriod}
          >
            {state.checkedInThisPeriod
              ? "Checked in today ✓"
              : busy
                ? "Saving…"
                : "Daily check-in"}
          </Button>
        </div>
      </div>
    </section>
  );
}
