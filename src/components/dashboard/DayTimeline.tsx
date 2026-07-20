"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRIORITY_META, type Priority } from "@/lib/chapters/data";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  name: string;
  priority: Priority;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h) — may be ""
}

const HOUR_START = 5;
const HOUR_END = 24;
const HOURS = HOUR_END - HOUR_START; // 14 rows
const ROW_PX = 34;

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Minutes since HOUR_START, clamped into the visible range. */
function offsetMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const mins = (Number.isFinite(h) ? h : HOUR_START) * 60 + (Number.isFinite(m) ? m : 0);
  return Math.min(HOURS * 60 - 60, Math.max(0, mins - HOUR_START * 60));
}

function hourLabel(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${ampm}`;
}

/**
 * Single-day chronological timeline (mentor wireframe): a vertical hourly
 * grid the eye scans top-to-bottom, ‹ TODAY › day paging, a red "now" line,
 * and event blocks positioned by their start time. Overlapping events split
 * the width into lanes so every block stays legible.
 * ponytail: ChapterEvent has no duration — blocks are fixed 60-minute;
 * add a duration column when scheduling fidelity matters.
 */
export function DayTimeline({ events }: { events: TimelineEvent[] }) {
  const [day, setDay] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayIso = toISODate(day);
  const todayIso = toISODate(new Date());
  const isToday = dayIso === todayIso;

  // Lay the day's events into lanes: greedy first-free-lane per overlap
  // cluster; every block in a cluster shares the cluster's lane count.
  const laid = useMemo(() => {
    const sorted = events
      .filter((e) => e.date === dayIso)
      .sort((a, b) => a.time.localeCompare(b.time));
    const out: { e: TimelineEvent; top: number; lane: number; lanes: number }[] = [];
    let laneEnds: number[] = []; // per-lane end offset (minutes)
    let cluster: { e: TimelineEvent; top: number; lane: number }[] = [];
    const flush = () => {
      const lanes = laneEnds.length || 1;
      for (const c of cluster) out.push({ ...c, lanes });
      cluster = [];
      laneEnds = [];
    };
    for (const e of sorted) {
      const start = offsetMinutes(e.time);
      if (cluster.length && laneEnds.every((end) => end <= start)) flush();
      let lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(start + 60);
      } else {
        laneEnds[lane] = start + 60;
      }
      cluster.push({ e, top: (start / 60) * ROW_PX, lane });
    }
    flush();
    return out;
  }, [events, dayIso]);

  // Red "now" line position (only meaningful when viewing today).
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowVisible =
    isToday && nowMins >= HOUR_START * 60 && nowMins <= HOUR_END * 60;
  const nowTop = ((nowMins - HOUR_START * 60) / 60) * ROW_PX;

  // Start the scroll viewport near "now" (or the first event) once per day view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = nowVisible ? nowTop : laid[0]?.top ?? 0;
    el.scrollTop = Math.max(0, target - ROW_PX * 1.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- position once per viewed day
  }, [dayIso]);

  const shift = (days: number) =>
    setDay((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });

  return (
    <div className="border-border/15 bg-background/50 flex h-full min-h-0 flex-col rounded-xl border">
      {/* ‹ TODAY › day pager */}
      <div className="flex shrink-0 items-center justify-center gap-3 px-2 py-1.5">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => shift(-1)}
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p
          className="min-w-24 text-center font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em]"
          title={day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        >
          {isToday
            ? "Today"
            : day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => shift(1)}
          className="text-muted-foreground hover:text-luminous transition-colors"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Hourly grid — scans vertically, scrolls inside the card */}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="relative" style={{ height: HOURS * ROW_PX }}>
          {Array.from({ length: HOURS + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 flex items-center gap-2"
              style={{ top: i * ROW_PX }}
            >
              <span className="text-muted-foreground/70 w-9 shrink-0 text-right font-mono text-[0.5625rem] uppercase leading-none">
                {hourLabel(HOUR_START + i)}
              </span>
              <span className="border-border/20 h-px flex-1 border-t" aria-hidden />
            </div>
          ))}

          {/* Event blocks — inset past the hour-label gutter */}
          <div className="absolute inset-y-0 left-12 right-1">
            {laid.map(({ e, top, lane, lanes }) => (
              <div
                key={e.id}
                title={`${e.name}${e.time ? ` · ${e.time}` : ""}`}
                className="border-luminous/30 bg-luminous/10 absolute overflow-hidden rounded-lg border px-2 py-1"
                style={{
                  top,
                  height: ROW_PX - 3,
                  left: `${(lane / lanes) * 100}%`,
                  width: `calc(${100 / lanes}% - 3px)`,
                }}
              >
                <p className="flex items-center gap-1.5 text-[0.625rem] leading-tight">
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      PRIORITY_META[e.priority]?.dot ?? "bg-luminous",
                    )}
                  />
                  <span className="truncate font-medium">{e.name}</span>
                </p>
                {lanes === 1 && e.time && (
                  <p className="text-muted-foreground pl-3 font-mono text-[0.5625rem]">{e.time}</p>
                )}
              </div>
            ))}
            {laid.length === 0 && (
              <p className="text-muted-foreground absolute inset-x-0 top-6 text-center text-[0.6875rem]">
                Nothing planned {isToday ? "today" : "this day"}.
              </p>
            )}
          </div>

          {/* Red "now" line */}
          {nowVisible && (
            <div
              aria-hidden
              className="absolute inset-x-0 z-10 flex items-center"
              style={{ top: nowTop }}
            >
              <span className="bg-destructive ml-9 size-2 shrink-0 rounded-full" />
              <span className="bg-destructive h-px flex-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
