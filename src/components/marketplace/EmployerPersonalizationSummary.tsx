"use client";

import Link from "next/link";
import { Briefcase, Compass, Sparkles, Target, Users } from "lucide-react";
import { useEmployersAI } from "@/lib/hooks/useEmployersAI";
import { explainMatch, matchScore } from "@/lib/marketplace/match";
import type { Candidate } from "@/lib/candidates/types";

const MAX_RECOMMENDED = 25;
const TOP_MATCH_COUNT = 5;

// Ranking AND explanation both come from the shared, transparent matcher
// (`lib/marketplace/match.ts`), so the score shown can never drift from
// the reasons shown. Every weight is named in the reason text — no
// hidden algorithm (principle #3).

export function EmployerPersonalizationSummary({
  pool,
}: {
  /** Candidate pool sourced from the marketplace API (DB-backed). */
  pool: Candidate[];
}) {
  const { data: ai, status } = useEmployersAI();

  // Empty-state fallback while loading or before any onboarding answers.
  const hasAnswers =
    !!ai &&
    (ai.targetRoles.length > 0 ||
      ai.requiredSkills.length > 0 ||
      ai.industries.length > 0);

  const prefs = ai
    ? {
        targetRoles: ai.targetRoles,
        requiredSkills: ai.requiredSkills,
        industries: ai.industries,
        candidateGreenFlags: ai.candidateGreenFlags,
      }
    : null;

  const ranked = hasAnswers && prefs
    ? [...pool]
        .map((c) => ({ candidate: c, score: matchScore(c, prefs) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
    : [];

  const recommended = ranked.slice(0, MAX_RECOMMENDED);
  const topMatches = recommended.slice(0, TOP_MATCH_COUNT);

  // The honest "why + uncertainty" for the single strongest match.
  const topExplanation =
    prefs && recommended[0]
      ? explainMatch(recommended[0].candidate, prefs)
      : null;

  const hiringIntent =
    ai?.hiringIntentSummary ||
    (ai?.targetRoles[0]
      ? `Hiring Intent: ${ai.targetRoles[0]}`
      : "Hiring Intent: tell us who you're looking for");
  const futurePath =
    ai?.futurePathSummary ||
    (ai?.futureRoleDirections[0]
      ? `Future Path: ${ai.futureRoleDirections.slice(0, 2).join(" and ")}`
      : "Future Path: complete onboarding to personalize");
  const bestCandidateType =
    ai?.bestCandidateTypeSummary ||
    "Best Candidate Type: complete onboarding to personalize matches.";

  return (
    <section className="glass-4 ring-clover/20 relative overflow-hidden rounded-2xl p-6 ring-1 sm:p-8">
      <div
        aria-hidden
        className="from-clover/15 pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-radial to-transparent blur-2xl"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Your hiring snapshot
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {hiringIntent}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">{futurePath}</p>
          </div>
          {status === "loading" ? (
            <span className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-wider">
              Loading…
            </span>
          ) : null}
        </div>

        <p className="text-foreground/85 text-sm leading-relaxed">
          {bestCandidateType}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            icon={<Target className="text-clover size-4" />}
            label="Primary target"
            value={ai?.targetRoles[0] || "—"}
          />
          <Stat
            icon={<Compass className="text-clover size-4" />}
            label="Work arrangement"
            value={ai?.workArrangement || "—"}
          />
          <Stat
            icon={<Briefcase className="text-clover size-4" />}
            label="Location"
            value={ai?.hiringLocation || "—"}
          />
        </div>

        <div className="border-border/15 mt-2 flex items-baseline justify-between border-t pt-4">
          <p className="text-muted-foreground text-xs">
            <Users className="mr-1 inline size-3.5" />
            Recommended Talent:{" "}
            <span className="text-clover font-semibold">
              {recommended.length}
            </span>{" "}
            {recommended.length === 1 ? "candidate" : "candidates"} found
            {recommended.length === MAX_RECOMMENDED ? " (showing top 25)" : ""}
          </p>
          {!hasAnswers ? (
            <span className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-wider">
              Complete onboarding to personalize
            </span>
          ) : null}
        </div>

        {topMatches.length > 0 ? (
          <div className="bg-foreground/2 border-border/15 flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-clover inline-flex items-center gap-1.5 text-[0.6875rem] font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              Top Match
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {topMatches.map(({ candidate, score }) => (
                <li key={candidate.id}>
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="bg-clover/10 text-clover-soft hover:bg-clover/20 inline-flex items-center gap-1.5 rounded-full border border-clover/30 px-2.5 py-1 text-xs font-medium transition-colors"
                  >
                    {candidate.name}
                    <span className="text-clover/70 font-mono text-[0.625rem]">
                      · {score}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {topExplanation && recommended[0] ? (
              <div className="border-border/15 mt-1 border-t pt-2">
                <p className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-wider">
                  Why {recommended[0].candidate.name.split(" ")[0]} ranks first
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {topExplanation.reasons.slice(0, 3).map((r) => (
                    <li
                      key={r}
                      className="text-foreground/80 text-[0.6875rem] leading-snug"
                    >
                      • {r}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground/80 mt-1.5 text-[0.625rem] italic leading-snug">
                  {topExplanation.uncertainty}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-3 flex flex-col gap-1 rounded-lg p-3">
      <p className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-wider">
        {icon}
        {label}
      </p>
      <p className="text-foreground/90 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}
