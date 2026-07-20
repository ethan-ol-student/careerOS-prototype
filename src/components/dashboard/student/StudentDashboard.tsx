"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Fingerprint,
  Radar,
  Sparkles,
  Target,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { DiscoveryRadar } from "@/components/dashboard/student/DiscoveryRadar";
import type { CandidateDashboardData } from "@/lib/dashboard/types";
import type { TrustTier } from "@/lib/intelligence/skillTruthEngine";

interface ClaimRow {
  name: string;
  level: number;
  tier: TrustTier;
}

/**
 * Student-phase dashboard (wireframe): an asymmetric grid — the Discovery
 * Radar as a ~66% hero on the left, an action stack on the right with a
 * Micro-Quest (top) and a Who Are You? self-reflection card (bottom).
 * Exploration-first: no job section (students can't access it yet).
 */
export function StudentDashboard({
  data,
  claims,
}: {
  data: CandidateDashboardData;
  claims: ClaimRow[] | null;
}) {
  return (
    <div className="max-w-container mx-auto flex w-full flex-col gap-4 px-4 pb-8 pt-2 lg:h-full lg:min-h-0">
      <div className="shrink-0">
        <p className="text-luminous font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          Candidate · Student phase
        </p>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Good day, <span className="text-luminous">{data.firstName}.</span>
        </h1>
      </div>

      {/* Asymmetric grid: radar hero (2/3) + action stack (1/3) */}
      <div className="grid flex-1 grid-cols-1 items-stretch gap-4 lg:min-h-0 lg:grid-cols-3">
        <div className="lg:col-span-2 lg:min-h-0">
          <DiscoveryRadar />
        </div>
        <div className="flex flex-col gap-4 lg:min-h-0">
          <MicroQuest claims={claims} />
          <WhoAreYou />
        </div>
      </div>
    </div>
  );
}

// ── Micro-Quest — one quick, actionable student task ────────────────

function MicroQuest({ claims }: { claims: ClaimRow[] | null }) {
  const count = claims?.length ?? 0;
  // The next best small step, derived from real progress.
  const quest =
    count === 0
      ? {
          title: "Log your very first skill",
          body: "Add one thing you can already do — anything counts. It plants your foundation on the radar.",
          cta: "Open Skill Radar",
          href: "/candidate/skills",
          xp: 10,
        }
      : count < 5
        ? {
            title: `Grow to 5 skills — you have ${count}`,
            body: "Add a few more skills so your horizon has room to stretch in every direction.",
            cta: "Add another skill",
            href: "/candidate/skills",
            xp: 15,
          }
        : {
            title: "Turn a skill into proof",
            body: "Pick one skill and back it with evidence — that's what lifts it from a claim to a strength.",
            cta: "Validate a skill",
            href: "/candidate/skills",
            xp: 20,
          };

  return (
    <section className="border-luminous/25 from-luminous/10 to-luminous/2 flex flex-1 flex-col rounded-2xl border bg-linear-to-b p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          <Target className="size-3.5" aria-hidden /> Micro-Quest
        </p>
        <Chip tone="luminous">+{quest.xp} XP</Chip>
      </div>
      <h2 className="mt-3 text-base font-semibold tracking-tight">{quest.title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{quest.body}</p>
      <Link
        href={quest.href}
        className="border-luminous/30 bg-luminous/10 text-luminous-soft hover:bg-luminous/20 mt-4 inline-flex items-center gap-1.5 self-start rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
      >
        <Radar className="size-4" aria-hidden /> {quest.cta}
        <ArrowUpRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}

// ── Who Are You? — self-reflection / personality inputs ─────────────

const REFLECT = [
  { label: "Working style quiz", href: "/candidate/personality", icon: Fingerprint },
  { label: "Career reflection", href: "/candidate/chapters/journal", icon: Sparkles },
];

function WhoAreYou() {
  return (
    <section className="glass-3 flex flex-1 flex-col rounded-2xl p-5">
      <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
        <Fingerprint className="size-3.5" aria-hidden /> Who are you?
      </p>
      <h2 className="mt-3 text-base font-semibold tracking-tight">
        Discover your working style
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        A 2-minute quiz reveals your work-animal archetype — how you think,
        collaborate, and do your best work. It shapes your discovery, never
        your score.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {REFLECT.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="border-border/15 bg-foreground/2 hover:border-luminous/40 hover:text-foreground text-muted-foreground flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors"
          >
            <r.icon className="text-luminous size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
