"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SkillRadar } from "@/components/skills/SkillRadar";
import {
  claimStrength,
  type RadarAxis,
  type SkillClaimInput,
} from "@/lib/intelligence/skillTruthEngine";
import { skillCategory, type SkillCategory } from "@/lib/skills/taxonomy";
import { normalizeSkill, type TargetJob } from "@/lib/jobs/data";

const VIEWS = ["all", "soft", "hard"] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABEL: Record<View, string> = {
  all: "All skills",
  soft: "Soft skills",
  hard: "Hard skills",
};

/**
 * Category-paged skill radar (mentor wireframe): the adaptive N-gon with
 * ‹ › arrows cycling All / Soft / Hard skills — you (luminous) vs the
 * role requirement (dashed). Axes derive page-side from the claims + the
 * selected role; scoreSkillTruth itself stays whole-job and untouched.
 */
export function CategoryRadar({
  claims,
  job,
}: {
  claims: SkillClaimInput[];
  job: TargetJob;
}) {
  const [view, setView] = useState<View>("all");

  const axes = useMemo<RadarAxis[]>(() => {
    const inView = (name: string) =>
      view === "all" || skillCategory(name) === (view as SkillCategory);
    const byName = new Map(claims.map((c) => [normalizeSkill(c.name), c]));
    // Required skills in this category first (the bar to clear)…
    const required: RadarAxis[] = job.requiredSkills
      .filter(inView)
      .slice(0, 12)
      .map((skill) => {
        const c = byName.get(normalizeSkill(skill));
        return {
          skill,
          you: c ? claimStrength(c) : 0,
          required: 100,
          tier: c ? c.tier : null,
        };
      });
    // …then the user's strongest other claims in the category (context spokes).
    const requiredSet = new Set(required.map((a) => normalizeSkill(a.skill)));
    const extras: RadarAxis[] = claims
      .filter((c) => inView(c.name) && !requiredSet.has(normalizeSkill(c.name)))
      .map((c) => ({
        skill: c.name,
        you: claimStrength(c),
        required: 0,
        tier: c.tier,
      }))
      .sort((a, b) => b.you - a.you)
      .slice(0, Math.max(0, 12 - required.length));
    return [...required, ...extras];
  }, [claims, job, view]);

  const shift = (dir: -1 | 1) =>
    setView((v) => VIEWS[(VIEWS.indexOf(v) + dir + VIEWS.length) % VIEWS.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        {axes.length > 0 ? (
          <SkillRadar axes={axes} />
        ) : (
          <p className="text-muted-foreground px-2 py-6 text-center text-xs">
            No {VIEW_LABEL[view].toLowerCase()} claimed yet — and{" "}
            {job.title} doesn&apos;t require any. Try the arrows.
          </p>
        )}
      </div>
      {/* Wireframe: ‹ CATEGORY › switcher under the chart */}
      <div className="flex shrink-0 items-center justify-center gap-3 pt-1">
        <button
          type="button"
          aria-label="Previous skill category"
          onClick={() => shift(-1)}
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="w-28 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
          {VIEW_LABEL[view]}
        </p>
        <button
          type="button"
          aria-label="Next skill category"
          onClick={() => shift(1)}
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
