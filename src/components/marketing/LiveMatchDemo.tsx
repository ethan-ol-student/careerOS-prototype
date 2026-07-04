"use client";

import { useMemo, useState } from "react";
import { Wrench } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { scoreSkillBridge } from "@/lib/intelligence/skillBridgeEngine";
import type { TargetJob } from "@/lib/jobs/data";
import { cn } from "@/lib/utils";

/**
 * Wildcard module: a no-login taste of the real skill-bridge engine.
 * Visitor toggles skills; the ACTUAL deterministic engine (same code the
 * dashboard runs) scores them against a sample role and explains why —
 * pure client-side math, no API, no data stored.
 */
const SKILLS = [
  "Team Leadership",
  "Project Management",
  "Python",
  "Systems Design",
  "Machine Learning",
  "Stakeholder Comms",
  "Data Analysis",
  "Mentoring",
];

const SAMPLE_JOB: TargetJob = {
  id: "demo-eng-manager",
  title: "Engineering Manager",
  company: "a growing product company",
  location: "Remote",
  duration: "Full-time",
  field: "Technology and software",
  requiredSkills: [
    "team leadership",
    "project management",
    "systems design",
    "mentoring",
  ],
  baseMatch: 70,
};

export function LiveMatchDemo() {
  const [picked, setPicked] = useState<string[]>([
    "Team Leadership",
    "Data Analysis",
  ]);

  const bridge = useMemo(() => scoreSkillBridge(SAMPLE_JOB, picked), [picked]);

  function toggle(skill: string) {
    setPicked((p) =>
      p.includes(skill) ? p.filter((s) => s !== skill) : [...p, skill],
    );
  }

  return (
    <div className="glass-3 rounded-3xl p-6">
      <p className="text-luminous flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
        <Wrench className="size-3.5" />
        Try the real engine
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        Tap the skills you already have — the same deterministic engine
        behind the dashboard scores your bridge to{" "}
        <span className="text-foreground font-medium">{SAMPLE_JOB.title}</span>.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {SKILLS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={picked.includes(s)}
            onClick={() => toggle(s)}
            className={cn(
              "rounded-full transition-transform active:scale-95",
              !picked.includes(s) && "opacity-60",
            )}
          >
            <Chip tone={picked.includes(s) ? "luminous" : "neutral"}>{s}</Chip>
          </button>
        ))}
      </div>

      <ScoreBar
        label={`Bridge to ${SAMPLE_JOB.title}`}
        value={bridge.score}
        size="sm"
        className="mt-5"
      />

      <div className="mt-3 space-y-1">
        {bridge.reasons.map((r) => (
          <p key={r} className="text-muted-foreground text-xs">
            • {r}
          </p>
        ))}
      </div>
      <p className="text-muted-foreground/70 mt-3 text-[11px] italic">
        Deterministic and explainable — the score is never a black box.
      </p>
    </div>
  );
}
