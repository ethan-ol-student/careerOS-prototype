"use client";

import { useState } from "react";
import { CirclePlus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AddSkillCardProps {
  onSubmit: (skill: string) => void;
  isRunning: boolean;
  className?: string;
}

const SUGGESTIONS = [
  "Python for engineering",
  "Product analytics",
  "Storytelling",
  "Systems design",
];

export function AddSkillCard({ onSubmit, isRunning, className }: AddSkillCardProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isRunning) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "glass-4 relative overflow-hidden rounded-2xl p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="from-luminous/15 pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-luminous text-xs font-medium uppercase tracking-[0.18em]">
              Start the loop
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">
              Just gained a new skill?
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Drop it in. Career OS will ripple it across your profile,
              trajectory, opportunities, and visibility in real time.
            </p>
          </div>
          <span className="bg-luminous/15 text-luminous hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider sm:inline-flex">
            <Sparkles className="size-3" />
            AI
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isRunning}
            placeholder="e.g. Product analytics, FEA, Mandarin"
            className="bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 flex-1 rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="lg"
            disabled={!value.trim() || isRunning}
            className="bg-luminous from-luminous to-luminous border-t-luminous-soft hover:from-luminous hover:to-luminous-soft"
          >
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" />
                Cascading…
              </>
            ) : (
              <>
                <CirclePlus />
                Add skill
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
            Try
          </span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isRunning}
              onClick={() => setValue(s)}
              className="border-border/60 hover:border-luminous hover:text-luminous text-muted-foreground rounded-full border px-2.5 py-0.5 text-[11px] transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
