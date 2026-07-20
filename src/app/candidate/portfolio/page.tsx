"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Download,
  Eye,
  History,
  Lock,
  PencilLine,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { InfoHint } from "@/components/ui/InfoHint";
import { emitCarrie } from "@/components/carrie/carrieBus";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MeterRow } from "@/components/dashboard/PhaseWidgetGrid";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { PortfolioBuilder, type Section } from "@/components/portfolio/PortfolioBuilder";
import { CareerTimeline } from "@/components/portfolio/CareerTimeline";
import { CVPreview } from "@/components/portfolio/CVPreview";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { resumeCompleteness, type CompletenessKey } from "@/lib/resume/completeness";
import { cn } from "@/lib/utils";

interface VersionRow {
  id: string;
  label: string;
  createdAt: string;
}

/**
 * Living Portfolio — the ONE place a candidate builds their profile and
 * exports it. Wireframe layout: zero-scroll frame (like the cockpit) —
 * input on the left (builder + problems solved, internally scrolling),
 * live CV preview on the right. Auxiliary data (completeness checklist,
 * saved versions, career timeline) collapses into expand-in-place
 * overlays so it never pushes the main layout around.
 */
export default function PortfolioPage() {
  return (
    <AppShell>
      <PortfolioContent />
    </AppShell>
  );
}

/** Backdrop + anchored panel for expand-in-place overlays. */
function ExpandOverlay({
  open,
  onClose,
  side,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Which way the panel opens relative to its anchor bar. */
  side: "up" | "down";
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default"
      />
      <div
        className={cn(
          "border-border/20 bg-background/95 absolute left-0 right-0 z-40 rounded-2xl border p-5 shadow-2xl backdrop-blur-xl",
          side === "down" ? "top-full mt-2" : "bottom-full mb-2",
        )}
      >
        {children}
      </div>
    </>
  );
}

function PortfolioContent() {
  const { portfolio, resetPortfolio } = usePortfolio();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [section, setSection] = useState<Section>("identity");
  // Wireframe: one main column, toggled between the builder and the preview.
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  // Resume tooling state (versions, problems solved, PDF gate).
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [problemsSolved, setProblemsSolved] = useState<string[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Expand-in-place panels (overlay — never push the layout).
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const load = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch("/api/me/resume", { cache: "no-store" }),
      fetch("/api/me/resume/versions", { cache: "no-store" }),
      fetch("/api/me/subscription", { cache: "no-store" }),
    ]);
    const j1 = await r1.json().catch(() => null);
    const j2 = await r2.json().catch(() => null);
    const j3 = await r3.json().catch(() => null);
    if (j1?.ok) setProblemsSolved(j1.data.data.problemsSolved);
    if (j2?.ok) setVersions(j2.data.versions);
    if (j3?.ok) setIsPro(!!j3.data.isPro);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  // Live meter: same pure function the server/PDF gate uses.
  const completeness = useMemo(
    () =>
      resumeCompleteness({
        headline: portfolio.headline,
        summary: portfolio.summary,
        skills: portfolio.skills,
        experiences: portfolio.experiences,
        projects: portfolio.projects,
        certificates: portfolio.certificates,
        awards: portfolio.awards,
        problemsSolved,
      }),
    [portfolio, problemsSolved],
  );
  const complete = completeness.pct === 100;

  /** Checklist click → jump to the exact spot that completes the task. */
  function goToTask(key: CompletenessKey) {
    setChecklistOpen(false);
    setMode("edit"); // tasks are completed in the builder
    // Problems solved lives inside the Experience section now.
    setSection(key === "problems" ? "experience" : key);
    requestAnimationFrame(() =>
      document
        .getElementById(key === "problems" ? "problems-editor" : "portfolio-builder")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  async function saveProblems(next: string[]) {
    const prev = problemsSolved;
    setProblemsSolved(next); // optimistic — meter ticks immediately
    const res = await fetch("/api/me/mid-career", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemsSolved: next }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.ok) {
      setProblemsSolved(prev);
      setNote(json?.error?.message ?? "Could not save problems solved.");
    } else {
      emitCarrie("success", "Problems-solved updated — proof of capability logged!");
    }
  }

  async function saveVersion() {
    const label = window.prompt('Name this version (e.g. "Platform roles v2"):');
    if (!label?.trim()) return;
    setBusy("version");
    setNote(null);
    const res = await fetch("/api/me/resume/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    const json = await res.json();
    setBusy(null);
    setNote(
      json.ok
        ? `Saved version "${label.trim()}".`
        : json.error?.message ?? "Save failed.",
    );
    if (json.ok) void load();
  }

  const hasContent = portfolio.totalAdditions > 0;

  return (
    <>
      <div className="max-w-container mx-auto flex w-full flex-col px-4 pb-4 pt-2 lg:h-full lg:min-h-0">
        {/* ── Header row: title left, actions right ── */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-luminous font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
              Living Portfolio
            </p>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Your Living <span className="text-luminous">Portfolio</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {note && <p className="text-clover max-w-56 truncate text-xs">{note}</p>}
            {/* Wireframe: Edit CV | Preview CV segmented toggle */}
            <SegmentedControl
              aria-label="Portfolio mode"
              value={mode}
              onChange={setMode}
              options={[
                { id: "edit", label: "Edit CV", icon: PencilLine },
                { id: "preview", label: "Preview CV", icon: Eye },
              ]}
            />
            <Button variant="ghost" size="sm" onClick={() => setTimelineOpen(true)}>
              <History className="size-3.5" />
              Timeline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              disabled={!hasContent}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveVersion}
              disabled={busy !== null}
            >
              <Save className="size-3.5" />
              {busy === "version" ? "Saving…" : "Save version"}
            </Button>
            {!complete ? (
              <Button
                size="sm"
                disabled
                title="Complete every checklist item to unlock the PDF export"
              >
                <Lock className="size-3.5" />
                Download PDF — {completeness.pct}%
              </Button>
            ) : isPro ? (
              <a href="/api/me/resume/pdf" download>
                <Button size="sm" disabled={busy !== null}>
                  <Download className="size-3.5" />
                  Download PDF
                </Button>
              </a>
            ) : (
              <Button
                size="sm"
                disabled={busy !== null}
                onClick={() => setUpgradeOpen(true)}
              >
                <Download className="size-3.5" />
                Download PDF — Pro
              </Button>
            )}
          </div>
        </div>

        {/* ── Body: main column (Edit ↔ Preview) left, insight rail right ── */}
        <div className="mt-3 grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-12">
          {/* Main column — the mode toggle decides what fills it. */}
          <div className="flex min-h-0 flex-col gap-3 lg:col-span-7">
            <div className="min-h-0 flex-1 space-y-4 lg:overflow-y-auto lg:pr-1">
              {mode === "edit" ? (
                <PortfolioBuilder
                  section={section}
                  onSectionChange={setSection}
                  problemsSolved={problemsSolved}
                  onSaveProblems={(next) => void saveProblems(next)}
                />
              ) : (
                <CVPreview />
              )}
            </div>

            {/* Saved versions — collapsed bar, expands upward as an overlay */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setVersionsOpen((v) => !v)}
                aria-expanded={versionsOpen}
                className="glass-3 hover:border-luminous/40 border-border/15 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-colors"
              >
                <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em]">
                  Your saved versions
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
                  {versions.length} saved
                  <ChevronUp
                    className={cn(
                      "size-3.5 transition-transform",
                      versionsOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </span>
              </button>
              <ExpandOverlay
                open={versionsOpen}
                onClose={() => setVersionsOpen(false)}
                side="up"
              >
                <p className="text-luminous font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em]">
                  Saved versions
                </p>
                {versions.length ? (
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {versions.map((v) => (
                      <li
                        key={v.id}
                        className="border-border/15 bg-foreground/2 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <span className="truncate font-medium">{v.label}</span>
                        <span className="text-muted-foreground ml-2 shrink-0 font-mono text-xs">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-2 text-sm">
                    No versions yet — save one before big edits.
                  </p>
                )}
              </ExpandOverlay>
            </div>
          </div>

          {/* Right rail (both modes): completeness + auto skills summary */}
          <div className="flex min-h-0 flex-col gap-3 lg:col-span-5">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setChecklistOpen((v) => !v)}
                aria-expanded={checklistOpen}
                className="glass-3 hover:border-clover/40 border-border/15 flex w-full items-center gap-3 rounded-xl border px-3 py-2 transition-colors"
              >
                <ProgressRing
                  value={completeness.pct}
                  label="Resume completeness"
                  accent="clover"
                  size={40}
                  compact
                />
                <span className="min-w-0 flex-1 text-left font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em]">
                  Resume completeness
                </span>
                <ChevronDown
                  className={cn(
                    "text-muted-foreground size-4 shrink-0 transition-transform",
                    checklistOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <ExpandOverlay
                open={checklistOpen}
                onClose={() => setChecklistOpen(false)}
                side="down"
              >
                <MeterRow
                  label="Resume completeness"
                  value={completeness.pct}
                  accent="clover"
                />
                <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
                  {completeness.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => goToTask(item.key)}
                        className="hover:bg-accent focus-visible:ring-luminous/40 group flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2"
                      >
                        {item.done ? (
                          <CheckCircle2 className="text-clover size-4 shrink-0" />
                        ) : (
                          <Circle className="text-muted-foreground size-4 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "min-w-0 flex-1",
                            !item.done && "text-muted-foreground",
                          )}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          aria-hidden
                          className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
                {!complete && (
                  <InfoHint className="text-muted-foreground mt-3 block text-xs">
                    Click any item to jump to where it gets done. Finish all of
                    them to unlock the PDF export.
                  </InfoHint>
                )}
              </ExpandOverlay>
            </div>

            {/* Wireframe: auto summary of skills learnt or strengthened */}
            <div className="min-h-0 flex-1 lg:overflow-y-auto">
              <AutoSkillsPanel />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset your Living Portfolio?"
        description={`This will permanently delete all ${portfolio.totalAdditions} ${
          portfolio.totalAdditions === 1 ? "entry" : "entries"
        }. This cannot be undone.`}
        confirmLabel="Yes, reset portfolio"
        cancelLabel="Keep my portfolio"
        onConfirm={() => {
          resetPortfolio();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgraded={load}
        feature="Career Report (PDF export)"
      />

      {/* Career timeline — expand & focus, never part of the fixed frame */}
      <Modal
        isOpen={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        title="Career timeline"
        size="lg"
      >
        <CareerTimeline />
      </Modal>
    </>
  );
}

/**
 * Auto summary — skills learnt or strengthened (wireframe right rail).
 * Derived from the experiences' `skillsUsed` chips: "strengthened" when the
 * matching Skill Radar claim is validated (tier ≥ 2), "learnt" otherwise.
 */
function AutoSkillsPanel() {
  const { portfolio } = usePortfolio();
  const [tiers, setTiers] = useState<Record<string, number>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/skills", { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => null);
      if (json?.ok) {
        const map: Record<string, number> = {};
        for (const c of json.data.claims as { name: string; tier: number }[]) {
          map[c.name.toLowerCase()] = c.tier;
        }
        setTiers(map);
      }
    })();
  }, []);

  // Mention counts across all experiences' skillsUsed.
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of portfolio.experiences) {
      for (const s of e.skillsUsed ?? []) {
        const k = s.trim();
        if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([skill, count]) => ({
        skill,
        count,
        strengthened: (tiers[skill.toLowerCase()] ?? 1) >= 2,
      }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
  }, [portfolio.experiences, tiers]);

  return (
    <section className="glass-3 rounded-2xl p-5">
      <p className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em]">
        <Sparkles className="size-3" aria-hidden />
        Skills you&apos;ve learnt or strengthened
      </p>
      <InfoHint className="text-muted-foreground mt-2 block text-xs">
        Auto-summarized from your experience entries — each one lands on your
        Skill Radar automatically.
      </InfoHint>
      {rows.length ? (
        <ul className="mt-3 space-y-1.5">
          {rows.map((r) => (
            <li
              key={r.skill}
              className="border-border/15 bg-foreground/2 flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm capitalize">{r.skill}</span>
              <Chip tone={r.strengthened ? "clover" : "neutral"}>
                {r.strengthened ? "Strengthened" : "Learnt"}
              </Chip>
              <span className="text-muted-foreground shrink-0 font-mono text-[0.625rem] tabular-nums">
                ×{r.count}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground/70 mt-3 rounded-lg border border-dashed p-3 text-center text-xs">
          Add an experience with &quot;skills strengthened or learned&quot; to
          see your auto summary here.
        </p>
      )}
    </section>
  );
}
