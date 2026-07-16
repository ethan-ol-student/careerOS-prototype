"use client";

import { Target, ThumbsUp, ThumbsDown, Sparkles, CalendarDays, Clock } from "lucide-react";
import { PRIORITY_META, type ChapterEvent } from "@/lib/chapters/data";
import { cn } from "@/lib/utils";

/**
 * Life Chapter reflection (mentor spec #4): every activity gets a
 * "does this move me toward my ideal self?" rating. The calendar is the
 * selector — pick an event, mark it Meaningful (+) or Not really (−), and the
 * analytics measure how much of your planned time actually points at your
 * ideal future self, the whole point of the timetable (not just scheduling).
 *
 * Split into two exports so the chapters page can compose them into its right
 * rail beside the calendar.
 */

/** Meaningful-time analytics — the "how am I spending my time" readout. */
export function ReflectionStats({ events }: { events: ChapterEvent[] }) {
  const meaningful = events.filter((e) => e.meaningful === true).length;
  const notMeaningful = events.filter((e) => e.meaningful === false).length;
  const unrated = events.length - meaningful - notMeaningful;
  const rated = meaningful + notMeaningful;
  const share = rated ? Math.round((meaningful / rated) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Target className="text-luminous size-4" aria-hidden />
        <div>
          <p className="text-luminous font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
            Am I moving toward my ideal self?
          </p>
          <h2 className="text-base font-semibold tracking-tight">Reflection &amp; meaning</h2>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Meaningful" value={meaningful} tone="clover" />
        <Stat label="Not really" value={notMeaningful} tone="muted" />
        <Stat label="Unrated" value={unrated} tone="muted" />
      </div>
      {rated > 0 && (
        <div className="mt-3">
          <div className="text-muted-foreground flex items-center justify-between text-[11px]">
            <span>Meaningful share of rated activities</span>
            <span className="text-clover font-semibold">{share}%</span>
          </div>
          <div className="bg-foreground/8 mt-1 h-1.5 w-full overflow-hidden rounded-full">
            <div className="bg-clover h-full rounded-full transition-all" style={{ width: `${share}%` }} />
          </div>
          <p className="text-muted-foreground mt-1.5 flex items-start gap-1.5 text-[11px]">
            <Sparkles className="text-luminous mt-0.5 size-3 shrink-0" aria-hidden />
            {share >= 60
              ? "Most of your planned time points at your ideal self — keep it up."
              : unrated > rated
                ? "Rate a few more activities to get a clearer read on your time."
                : "A lot of your time isn't moving you forward — worth a rethink."}
          </p>
        </div>
      )}
    </div>
  );
}

/** Selected-event detail + the ideal-self +/− rating (wireframe right rail). */
export function EventDetail({
  event,
  onRate,
}: {
  event: ChapterEvent;
  onRate: (id: string, value: boolean | null) => void;
}) {
  const meta = PRIORITY_META[event.priority];
  // Clicking the active choice again clears the rating (back to unrated).
  const rate = (value: boolean) =>
    onRate(event.id, event.meaningful === value ? null : value);
  return (
    <div className="border-border/15 rounded-xl border p-4">
      <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-wider">
        Selected event
      </p>
      <p className="mt-1 text-sm font-semibold">{event.name}</p>
      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" aria-hidden />
          {new Date(`${event.date}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        {event.time && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" aria-hidden /> {event.time}
          </span>
        )}
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", meta.tone)}>
          {meta.label} priority
        </span>
      </div>
      {event.subtasks.length > 0 && (
        <p className="text-muted-foreground mt-2 text-[11px]">
          {event.subtasks.filter((s) => s.done).length}/{event.subtasks.length} sub-tasks done
        </p>
      )}

      <p className="mt-4 text-xs font-medium">
        Does this move you toward your ideal self?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => rate(true)}
          aria-pressed={event.meaningful === true}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            event.meaningful === true
              ? "border-clover/50 bg-clover/15 text-clover"
              : "border-border/15 bg-foreground/2 text-muted-foreground hover:border-clover/40 hover:text-clover",
          )}
        >
          <ThumbsUp className="size-3.5" aria-hidden /> Yes, meaningful
        </button>
        <button
          type="button"
          onClick={() => rate(false)}
          aria-pressed={event.meaningful === false}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            event.meaningful === false
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-border/15 bg-foreground/2 text-muted-foreground hover:border-destructive/40 hover:text-destructive",
          )}
        >
          <ThumbsDown className="size-3.5" aria-hidden /> Not really
        </button>
      </div>
      <p className="text-muted-foreground/70 mt-2 text-[10px]">
        Private reflection — only you ever see this.
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "clover" | "muted" }) {
  return (
    <div className="border-border/15 bg-foreground/2 rounded-xl border p-2.5">
      <p className="text-muted-foreground font-mono text-[9px] font-semibold uppercase tracking-wider">{label}</p>
      <p className={cn("mt-0.5 text-xl font-bold tracking-tight", tone === "clover" ? "text-clover" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
