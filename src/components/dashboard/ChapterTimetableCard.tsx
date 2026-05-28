"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChapters } from "@/lib/context/ChaptersContext";
import { PRIORITY_META, type ChapterEvent } from "@/lib/chapters/data";

interface ChapterTimetableCardProps {
  className?: string;
}

/**
 * Dashboard surface for the Life Chapter Designer timetable.
 * Reuses the existing `useChapters()` event store and `PRIORITY_META`
 * tokens. Shows the next few upcoming events with their date, time,
 * priority, and subtask progress. Replaces the old MonthlyProgressCard
 * notification panel — notifications now live exclusively in the
 * top-page NotificationBell.
 */
export function ChapterTimetableCard({ className }: ChapterTimetableCardProps) {
  const { events, isHydrated } = useChapters();

  const ordered = [...events].sort((a, b) => {
    const da = `${a.date}T${a.time || "00:00"}`;
    const db = `${b.date}T${b.time || "00:00"}`;
    return da.localeCompare(db);
  });

  const upcoming = ordered.slice(0, 4);
  const totalSub = events.reduce((acc, e) => acc + e.subtasks.length, 0);
  const doneSub = events.reduce(
    (acc, e) => acc + e.subtasks.filter((s) => s.done).length,
    0,
  );
  const progressPct =
    totalSub === 0 ? 0 : Math.round((doneSub / totalSub) * 100);

  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="from-luminous/15 pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent"
      />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
            Life Chapter Designer
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            Your timetable
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Upcoming to-dos pulled straight from your planner.
          </p>
        </div>
        <Link
          href="/candidate/chapters"
          className="border-border/60 bg-card/40 hover:border-luminous/60 hover:text-luminous text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors"
          aria-label="Open Life Chapter Designer"
        >
          Open
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {/* Overall subtask progress */}
      {totalSub > 0 && (
        <div className="relative mb-5">
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="size-3.5" aria-hidden />
              Subtask progress
            </span>
            <span className="font-mono">
              {doneSub}/{totalSub} · {progressPct}%
            </span>
          </div>
          <div className="bg-muted/40 h-2 w-full overflow-hidden rounded-full">
            <div
              className="from-luminous to-clover h-full rounded-full bg-linear-to-r transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Event list */}
      <ul
        className="relative flex flex-col gap-2"
        aria-label={`${upcoming.length} upcoming events`}
      >
        {!isHydrated ? (
          <EmptyState
            title="Loading your timetable…"
            body="One moment while we read your saved events."
          />
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="No events scheduled yet"
            body="Open the Life Chapter Designer to add your first to-do, date, and subtasks."
          />
        ) : (
          upcoming.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </ul>

      {events.length > upcoming.length && (
        <p className="text-muted-foreground relative mt-3 text-[11px]">
          +{events.length - upcoming.length} more in your timetable.
        </p>
      )}
    </div>
  );
}

function EventRow({ event }: { event: ChapterEvent }) {
  const meta = PRIORITY_META[event.priority];
  const total = event.subtasks.length;
  const done = event.subtasks.filter((s) => s.done).length;
  const allDone = total > 0 && done === total;

  return (
    <li className="border-border/40 bg-card/40 flex items-start gap-3 rounded-lg border p-3">
      <span
        aria-hidden
        className={cn(
          "mt-1 inline-flex size-2 shrink-0 rounded-full",
          meta.dot,
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{event.name}</p>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              meta.tone,
            )}
          >
            {meta.label}
          </span>
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" aria-hidden />
            {formatDate(event.date)}
          </span>
          {event.time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {event.time}
            </span>
          )}
          {total > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                allDone && "text-clover",
              )}
            >
              {allDone ? (
                <CheckCircle2 className="size-3" aria-hidden />
              ) : (
                <Circle className="size-3" aria-hidden />
              )}
              {done}/{total} subtasks
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <li className="border-border/40 text-muted-foreground rounded-lg border border-dashed px-3 py-5 text-center">
      <p className="text-sm">{title}</p>
      <p className="mt-1 text-[11px]">{body}</p>
    </li>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
