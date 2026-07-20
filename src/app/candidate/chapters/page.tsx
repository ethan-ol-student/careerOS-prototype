"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { EventEditor } from "@/components/chapters/EventEditor";
import { ReflectionStats, EventDetail } from "@/components/chapters/ReflectionPanel";
import {
  TimetableHeader, WeeklyView, MonthlyView, YearlyView, timeframeLabel,
} from "@/components/chapters/TimetableViews";
import { useChapters } from "@/lib/context/ChaptersContext";
import type { Timeframe } from "@/lib/chapters/data";

export default function ChaptersPage() {
  return (
    <AppShell>
      <ChaptersContent />
    </AppShell>
  );
}

function ChaptersContent() {
  const { events, resetEvents, setMeaningful } = useChapters();
  const [view, setView] = useState<Timeframe>("week");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [showReset, setShowReset] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Dashboard "AI recommendation" chips deep-link here as ?add=<skill> —
  // open the Add-event modal pre-filled so the user just picks a date.
  const [prefillName, setPrefillName] = useState("");
  useEffect(() => {
    const add = new URLSearchParams(window.location.search).get("add");
    if (!add) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time URL-param init
    setPrefillName(`Learn ${add}`.slice(0, 80));
    setAddOpen(true);
  }, []);

  // Selected event (explicit pick, else the soonest-dated one).
  const selected = useMemo(() => {
    const ordered = [...events].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );
    return ordered.find((e) => e.id === selectedId) ?? ordered[0] ?? null;
  }, [events, selectedId]);

  // Stats strip: total events + high-priority count + up next.
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = events
      .filter((e) => new Date(`${e.date}T00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    const next = upcoming[0];
    return [
      { cap: "Total events", val: String(events.length) },
      { cap: "High priority", val: String(events.filter((e) => e.priority === "high").length) },
      {
        cap: "Up next",
        val: next
          ? new Date(`${next.date}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—",
      },
    ];
  }, [events]);

  return (
    <>
      <PageHeader
        eyebrow="Life Chapter Designer"
        title="Your timetable — fluid by design"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => { setPrefillName(""); setAddOpen(true); }}>
              <Plus className="size-3.5" />
              Add event
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
        {/* At-a-glance strip */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.cap} className="glass-4 rounded-xl p-3 sm:p-4">
              <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
                {s.cap}
              </p>
              <p className="text-luminous mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                {s.val}
              </p>
            </div>
          ))}
        </div>

        {/* Wireframe: calendar left, selected-event + reflection right */}
        <Grid12>
          <Col span={12} lg={8}>
            <TimetableHeader
              view={view}
              onViewChange={setView}
              anchor={anchor}
              onAnchorChange={setAnchor}
              label={timeframeLabel(view, anchor)}
            />
            {view === "week" && <WeeklyView anchor={anchor} onSelect={setSelectedId} />}
            {view === "month" && <MonthlyView anchor={anchor} onSelect={setSelectedId} />}
            {view === "year" && <YearlyView anchor={anchor} />}
            {events.length === 0 && (
              <div className="glass-3 mt-4 rounded-2xl p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No events yet.{" "}
                  <button
                    type="button"
                    onClick={() => { setPrefillName(""); setAddOpen(true); }}
                    className="text-luminous underline"
                  >
                    Add your first one
                  </button>
                  .
                </p>
              </div>
            )}
          </Col>

          <Col span={12} lg={4}>
            <div className="glass-3 flex flex-col gap-4 rounded-2xl p-5 lg:sticky lg:top-24">
              <ReflectionStats events={events} />
              {selected ? (
                <EventDetail event={selected} onRate={setMeaningful} />
              ) : (
                <p className="text-muted-foreground border-border/15 rounded-xl border border-dashed p-4 text-center text-xs">
                  Click an event on the calendar to see its details and rate it.
                </p>
              )}
            </div>
          </Col>
        </Grid12>
      </section>

      {/* Add-event modal (wireframe) — same editor, hosted in a dialog */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add an event"
        size="lg"
        hideVisibleTitle
      >
        <EventEditor
          key={prefillName}
          initialName={prefillName}
          onSaved={() => setAddOpen(false)}
        />
      </Modal>

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
