"use client";

import { useState } from "react";
import {
  AlertCircle,
  CirclePlus,
  Loader2,
  Sparkles,
  Hexagon,
  Paperclip,
  FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { validateSkill } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { LoopState } from "./LoopPanels";

interface SkillEvolutionCardProps {
  state: LoopState;
  isRunning: boolean;
  onAddSkill: (skill: string) => void;
  className?: string;
}

const SUGGESTIONS = [
  "Product analytics",
  "Storytelling",
  "Systems design",
  "FEA",
];

export function SkillEvolutionCard({
  state,
  isRunning,
  onAddSkill,
  className,
}: SkillEvolutionCardProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    const result = validateSkill(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAddSkill(result.value);
    setValue("");
    setError(null);
  };

  const handleAttachClick = () => {
    // Visual-only — file upload comes later.
    // The dashed "Upload evidence" affordance below also signals this.
  };

  return (
    <div
      className={cn(
        "glass-4 ring-luminous/20 relative flex flex-col overflow-hidden rounded-2xl p-6 ring-1",
        className,
      )}
    >
      <div
        aria-hidden
        className="from-luminous/20 pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-radial to-transparent"
      />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
            Skill evolution
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            Track what you&apos;re learning
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            New skills enter at Level 1 and level up as you build evidence —
            every addition ripples through your trajectory.
          </p>
        </div>
        <span className="bg-luminous/15 text-luminous hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex">
          <Sparkles className="size-3" />
          {state.skills.length} tracked
        </span>
      </div>

      {/* Your Stack + empty-state text — surfaced ABOVE the prompt/input
          area so the user sees their current stack (or guidance when
          empty) before deciding what to add next. */}
      <div className="relative grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-5">
          <SkillAccumulator skills={state.skills} />
        </div>
        <div className="col-span-12 sm:col-span-7">
          <SkillList skills={state.skills} />
        </div>
      </div>

      <div className="border-border/40 relative mt-6 border-t pt-5">
        <p className="text-muted-foreground mb-2 text-[11px] font-medium uppercase tracking-wider">
          Try a prompt
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isRunning}
              onClick={() => setValue(s)}
              aria-label={`Use suggestion: ${s}`}
              className="border-border/60 hover:border-luminous hover:text-luminous text-muted-foreground inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-xs transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative mt-3 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            disabled={isRunning}
            placeholder="Add a new skill — e.g. CAD, Mandarin, FEA"
            aria-label="New skill name"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "skill-input-error" : undefined}
            maxLength={60}
            className={cn(
              "bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 min-h-11 w-full rounded-md border py-2.5 pl-4 pr-12 text-sm outline-none transition-colors focus:ring-2 disabled:opacity-60",
              error && "border-destructive/60 focus:ring-destructive/30",
            )}
          />
          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isRunning}
            aria-label="Attach evidence (coming soon)"
            title="Upload evidence — coming soon"
            className="text-muted-foreground hover:text-luminous absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 transition-colors disabled:opacity-40"
          >
            <Paperclip className="size-4" />
          </button>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!value.trim() || isRunning}
          className="from-luminous to-luminous border-t-luminous-soft hover:from-luminous hover:to-luminous-soft"
        >
          {isRunning ? (
            <>
              <Loader2 className="animate-spin" />
              Cascading
            </>
          ) : (
            <>
              <CirclePlus />
              Add skill
            </>
          )}
        </Button>
      </form>

      {error ? (
        <p
          id="skill-input-error"
          role="alert"
          className="text-destructive relative mt-2 inline-flex items-center gap-1.5 text-[11px]"
        >
          <AlertCircle className="size-3" aria-hidden />
          {error}
        </p>
      ) : null}

      <p className="text-muted-foreground relative mt-2 text-[11px]">
        Tip: attach evidence (a project link, certificate, screenshot) to
        accelerate your level-ups.{" "}
        <span className="text-luminous">Upload — coming soon.</span>
      </p>
    </div>
  );
}

function SkillAccumulator({ skills }: { skills: string[] }) {
  const visible = skills.slice(0, 12);
  const overflow = skills.length - visible.length;

  const POS: { x: number; y: number; size: number }[] = [
    { x: 50, y: 75, size: 28 },
    { x: 35, y: 60, size: 24 },
    { x: 66, y: 60, size: 24 },
    { x: 50, y: 45, size: 20 },
    { x: 25, y: 80, size: 18 },
    { x: 75, y: 80, size: 18 },
    { x: 40, y: 35, size: 16 },
    { x: 60, y: 35, size: 16 },
    { x: 30, y: 25, size: 14 },
    { x: 70, y: 25, size: 14 },
    { x: 50, y: 15, size: 14 },
    { x: 20, y: 50, size: 12 },
  ];

  const ariaSummary =
    skills.length === 0
      ? "Skill stack visualization: empty. Add a skill to begin."
      : `Skill stack visualization with ${skills.length} stacked hexagons, latest skill highlighted.`;

  return (
    <div
      role="img"
      aria-label={ariaSummary}
      className="bg-card/40 border-border/40 relative aspect-square w-full overflow-hidden rounded-xl border"
    >
      <div
        aria-hidden
        className="from-luminous/15 absolute inset-0 bg-radial to-transparent opacity-80"
      />
      <p className="text-luminous absolute left-3 top-3 z-10 text-[10px] font-medium uppercase tracking-wider">
        Your stack
      </p>
      <p className="text-muted-foreground absolute right-3 top-3 z-10 font-mono text-[10px]">
        +{skills.length}
      </p>

      {visible.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <Hexagon className="text-muted-foreground/40 size-10" />
          <p className="text-muted-foreground px-4 text-[11px]">
            Add a skill to start the stack
          </p>
        </div>
      ) : (
        visible.map((skill, i) => {
          const pos = POS[i];
          const isLatest = i === visible.length - 1;
          return (
            <div
              key={`${skill}-${i}`}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                animation: `appear-zoom 0.55s ease-out`,
              }}
              aria-label={skill}
              title={skill}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-md border transition-shadow",
                  isLatest
                    ? "bg-luminous border-luminous text-white shadow-[0_0_18px_var(--luminous)]"
                    : "bg-luminous/15 text-luminous border-luminous/40",
                )}
                style={{ width: pos.size, height: pos.size }}
              >
                <Hexagon
                  aria-hidden
                  style={{
                    width: pos.size * 0.55,
                    height: pos.size * 0.55,
                  }}
                />
              </span>
            </div>
          );
        })
      )}

      {overflow > 0 && (
        <div className="bg-luminous absolute bottom-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
          +{overflow}
        </div>
      )}
    </div>
  );
}

function LevelBar({ level }: { level: number }) {
  return (
    <div className="mt-1 flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i < level ? "bg-clover" : "bg-muted/60",
          )}
        />
      ))}
    </div>
  );
}

function SkillList({ skills }: { skills: string[] }) {
  const ordered = [...skills].reverse();
  const total = skills.length;

  if (total === 0) {
    return (
      <div className="border-border/40 text-muted-foreground flex h-full items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs">
        Your skills will appear here as you add them.
        <br />
        Each starts at Level 1.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {ordered.map((skill, idx) => {
        const distance = idx;
        const level = Math.min(1 + Math.floor(distance / 2), 5);
        const isLatest = idx === 0;
        return (
          <li
            key={`${skill}-${idx}`}
            className={cn(
              "border-border/40 bg-card/40 flex items-center gap-3 rounded-md border px-3 py-2 transition-colors",
              isLatest && "border-luminous/50 bg-luminous/10",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md",
                isLatest
                  ? "bg-luminous text-white"
                  : "bg-luminous/15 text-luminous",
              )}
            >
              <Hexagon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {skill}
                {isLatest && (
                  <span className="text-clover ml-2 text-[10px] uppercase tracking-wider">
                    new
                  </span>
                )}
              </p>
              <LevelBar level={level} />
            </div>
            <button
              type="button"
              title="Upload evidence — coming soon"
              aria-label={`Upload evidence for ${skill} (coming soon)`}
              className="text-muted-foreground hover:text-luminous border-border/60 hover:border-luminous flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors"
            >
              <FileUp className="size-3" />
              Evidence
            </button>
            <span
              className="text-muted-foreground shrink-0 font-mono text-[10px]"
              aria-label={`Level ${level} of 5`}
            >
              Lv {level}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

