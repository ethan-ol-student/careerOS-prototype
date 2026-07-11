"use client";

import { CalendarDays, Clock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useChapters } from "@/lib/context/ChaptersContext";
import { PRIORITY_META, type ChapterEvent, type Timeframe } from "@/lib/chapters/data";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

// ─── date helpers ──────────────────────────────────────────────
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── shared header ─────────────────────────────────────────────
export function TimetableHeader({
  view, onViewChange, anchor, onAnchorChange, label,
}: {
  view: Timeframe;
  onViewChange: (t: Timeframe) => void;
  anchor: Date;
  onAnchorChange: (d: Date) => void;
  label: string;
}) {
  const shift = (n: number) => {
    const d = new Date(anchor);
    if (view === "week") d.setDate(d.getDate() + 7 * n);
    if (view === "month") d.setMonth(d.getMonth() + n);
    if (view === "year") d.setFullYear(d.getFullYear() + n);
    onAnchorChange(d);
  };
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex overflow-hidden rounded-lg border border-border/15 bg-foreground/2">
        {(["week","month","year"] as Timeframe[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onViewChange(t)}
            className={cn(
              "min-h-9 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
              view === t ? "bg-luminous text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "week" ? "Weekly" : t === "month" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous"
          className="border-border/15 bg-foreground/2 hover:text-luminous text-muted-foreground flex size-9 items-center justify-center rounded-lg border"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium tabular-nums">{label}</p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next"
          className="border-border/15 bg-foreground/2 hover:text-luminous text-muted-foreground flex size-9 items-center justify-center rounded-lg border"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onAnchorChange(new Date())}
          className="border-border/15 bg-foreground/2 hover:text-luminous text-muted-foreground min-h-9 rounded-lg border px-3 text-xs"
        >
          Today
        </button>
      </div>
    </div>
  );
}

// ─── weekly ────────────────────────────────────────────────────
export function WeeklyView({ anchor }: { anchor: Date }) {
  const { events } = useChapters();
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const byDate = useMemo(() => {
    const m = new Map<string, ChapterEvent[]>();
    for (const e of events) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.time.localeCompare(b.time));
    return m;
  }, [events]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((d, i) => {
        const iso = toISO(d);
        const today = toISO(new Date()) === iso;
        const list = byDate.get(iso) ?? [];
        return (
          <div
            key={iso}
            className={cn(
              "glass-3 flex min-h-[180px] flex-col rounded-xl p-3",
              today && "ring-luminous/40 ring-2",
            )}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-muted-foreground text-[10px] font-mono font-semibold uppercase tracking-wider">
                {DOW[i]}
              </p>
              <p className={cn("font-mono text-sm", today && "text-luminous font-semibold")}>
                {d.getDate()}
              </p>
            </div>
            {list.length === 0 ? (
              <p className="text-muted-foreground/60 mt-2 text-[11px] italic">No events</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {list.map((e) => <EventChip key={e.id} event={e} />)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── monthly ───────────────────────────────────────────────────
export function MonthlyView({ anchor }: { anchor: Date }) {
  const { events } = useChapters();
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const byDate = useMemo(() => {
    const m = new Map<string, ChapterEvent[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);

  return (
    <div className="glass-3 rounded-2xl p-4">
      <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase tracking-wider">
        {DOW.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const iso = toISO(d);
          const list = byDate.get(iso) ?? [];
          const inMonth = sameMonth(d, anchor);
          const today = toISO(new Date()) === iso;
          return (
            <div
              key={iso}
              className={cn(
                "min-h-[88px] rounded-lg border p-2 text-left transition-colors",
                inMonth ? "border-border/15 bg-foreground/2" : "border-border/20 bg-card/10 opacity-60",
                today && "ring-luminous/40 border-luminous/50 ring-2",
              )}
            >
              <p className={cn("text-[11px] font-mono", today && "text-luminous font-semibold")}>
                {d.getDate()}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {list.slice(0, 2).map((e) => {
                  const meta = PRIORITY_META[e.priority];
                  return (
                    <li
                      key={e.id}
                      title={`${e.time} · ${e.name}`}
                      className={cn("truncate rounded px-1 py-0.5 text-[10px] border", meta.tone)}
                    >
                      {e.time} {e.name}
                    </li>
                  );
                })}
                {list.length > 2 && (
                  <li className="text-muted-foreground text-[10px]">+{list.length - 2} more</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── yearly ────────────────────────────────────────────────────
export function YearlyView({ anchor }: { anchor: Date }) {
  const { events } = useChapters();
  const year = anchor.getFullYear();
  const counts = useMemo(() => {
    const c = new Array(12).fill(0);
    for (const e of events) {
      const d = parseISO(e.date);
      if (d.getFullYear() === year) c[d.getMonth()] += 1;
    }
    return c;
  }, [events, year]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {MONTHS.map((m, i) => (
        <div key={m} className="glass-3 flex flex-col gap-2 rounded-xl p-4">
          <p className="text-muted-foreground text-[10px] font-mono font-semibold uppercase tracking-wider">
            {m} {String(year).slice(2)}
          </p>
          <p className="font-mono text-2xl">{counts[i]}</p>
          <p className="text-muted-foreground text-[11px]">
            {counts[i] === 0 ? "no events" : counts[i] === 1 ? "event" : "events"}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── event chip with sub-tasks ─────────────────────────────────
function EventChip({ event }: { event: ChapterEvent }) {
  const { removeEvent, toggleSubtask } = useChapters();
  const [open, setOpen] = useState(false);
  const meta = PRIORITY_META[event.priority];
  const done = event.subtasks.filter((s) => s.done).length;
  return (
    <li className={cn("rounded-lg border p-2", meta.tone.replace("text-", "border-"), "bg-card/40")}>
      {/* <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            <p className="truncate text-xs font-medium">{event.name}</p>
          </div>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
            <Clock className="size-2.5" /> {event.time}
            {event.subtasks.length > 0 && (
              <span className="ml-1">· {done}/{event.subtasks.length} done</span>
            )}
          </p>
        </div>
        <button
          type="button"
          aria-label="Delete event"
          onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="size-3" />
        </button>
      </button> */}

      {/* Better Change for the buttons to present hydration error */}
      <div className="flex w-full items-start justify-between gap-2 text-left">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            <p className="truncate text-xs font-medium">{event.name}</p>
          </div>

          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
            <Clock className="size-2.5" /> {event.time}
            {event.subtasks.length > 0 && (
              <span className="ml-1">
                · {done}/{event.subtasks.length} done
              </span>
            )}
          </p>
        </button>

        <button
          type="button"
          aria-label="Delete event"
          onClick={() => removeEvent(event.id)}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {open && event.subtasks.length > 0 && (
        <ul className="border-border/15 mt-2 flex flex-col gap-1 border-t pt-2">
          {event.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => toggleSubtask(event.id, s.id)}
                aria-pressed={s.done}
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                  s.done ? "bg-clover border-clover text-white" : "border-border/20",
                )}
              >
                {s.done && <CalendarDays className="size-2.5" />}
              </button>
              <span className={cn("flex-1 truncate", s.done && "line-through text-muted-foreground")}>
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── label helpers exposed for page ────────────────────────────
export function timeframeLabel(view: Timeframe, anchor: Date) {
  if (view === "week") {
    const s = startOfWeek(anchor);
    const e = addDays(s, 6);
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }
  if (view === "month") return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  return `${anchor.getFullYear()}`;
}
