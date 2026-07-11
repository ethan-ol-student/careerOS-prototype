"use client";

import { useState } from "react";
import { Plus, Wand2, RotateCcw } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { EventEditor } from "@/components/chapters/EventEditor";
import {
  TimetableHeader, WeeklyView, MonthlyView, YearlyView, timeframeLabel,
} from "@/components/chapters/TimetableViews";
import { useChapters } from "@/lib/context/ChaptersContext";
import type { Timeframe } from "@/lib/chapters/data";
import { cn } from "@/lib/utils";

export default function ChaptersPage() {
  return (
    <AppShell>
      <ChaptersContent />
    </AppShell>
  );
}

function ChaptersContent() {
  const { events, resetEvents } = useChapters();
  const [view, setView] = useState<Timeframe>("week");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [designMode, setDesignMode] = useState(false);
  const [showReset, setShowReset] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Life Chapter Designer"
        title="Your timetable — fluid by design"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={designMode ? "default" : "outline"}
              size="sm"
              onClick={() => setDesignMode((v) => !v)}
              className={cn(designMode && "from-luminous to-luminous border-t-luminous-soft")}
              aria-pressed={designMode}
            >
              {designMode ? <Wand2 /> : <Plus />}
              {designMode ? "Design mode" : "Design mode"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReset(true)}
              disabled={events.length === 0}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        }
      />

      <section className="max-w-container mx-auto px-4 py-8 sm:py-12">
        {/* At-a-glance strip — cockpit language */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          const upcoming = events
            .filter((e) => new Date(`${e.date}T00:00`) >= today)
            .sort((a, b) => a.date.localeCompare(b.date));
          const thisWeek = upcoming.filter(
            (e) => new Date(`${e.date}T00:00`) < weekEnd,
          ).length;
          const next = upcoming[0];
          const stats = [
            { cap: "Total events", val: String(events.length) },
            { cap: "Next 7 days", val: String(thisWeek) },
            {
              cap: "Up next",
              val: next
                ? new Date(`${next.date}T00:00`).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "—",
            },
          ];
          return (
            <div className="mb-6 grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.cap} className="glass-4 rounded-xl p-3 sm:p-4">
                  <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-wider">
                    {s.cap}
                  </p>
                  <p className="text-luminous mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}
        <Grid12>
          {designMode && (
            <Col span={12} lg={4}>
              <div className="lg:sticky lg:top-24">
                <EventEditor />
              </div>
            </Col>
          )}
          <Col span={12} lg={designMode ? 8 : 12}>
            <TimetableHeader
              view={view}
              onViewChange={setView}
              anchor={anchor}
              onAnchorChange={setAnchor}
              label={timeframeLabel(view, anchor)}
            />
            {view === "week" && <WeeklyView anchor={anchor} />}
            {view === "month" && <MonthlyView anchor={anchor} />}
            {view === "year" && <YearlyView anchor={anchor} />}
            {events.length === 0 && !designMode && (
              <div className="glass-3 mt-4 rounded-2xl p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No events yet. Flip{" "}
                  <button
                    type="button"
                    onClick={() => setDesignMode(true)}
                    className="text-luminous underline"
                  >
                    Design mode
                  </button>{" "}
                  on to add your first one.
                </p>
              </div>
            )}
          </Col>
        </Grid12>
      </section>

      <ConfirmDialog
        isOpen={showReset}
        title="Reset your timetable?"
        description={`This will permanently delete all ${events.length} event${events.length === 1 ? "" : "s"}. This cannot be undone.`}
        confirmLabel="Yes, reset"
        cancelLabel="Keep my events"
        onConfirm={() => { resetEvents(); setShowReset(false); }}
        onCancel={() => setShowReset(false)}
      />
    </>
  );
}
