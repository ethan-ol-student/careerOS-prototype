"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  Lock,
  Plus,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { MeterRow } from "@/components/dashboard/PhaseWidgetGrid";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { PortfolioBuilder, type Section } from "@/components/portfolio/PortfolioBuilder";
import { CareerTimeline } from "@/components/portfolio/CareerTimeline";
import { CVPreview } from "@/components/portfolio/CVPreview";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { resumeCompleteness } from "@/lib/resume/completeness";
import { cn } from "@/lib/utils";

interface VersionRow {
  id: string;
  label: string;
  createdAt: string;
}

/**
 * Living Portfolio — the ONE place a candidate builds their profile and
 * exports it. The former standalone Resume page lives here now: the
 * completeness checklist (clickable, deep-links into the builder), the
 * problems-solved editor, saved versions, and the gated PDF download.
 */
export default function PortfolioPage() {
  return (
    <AppShell>
      <PortfolioContent />
    </AppShell>
  );
}

function PortfolioContent() {
  const { portfolio, resetPortfolio } = usePortfolio();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [section, setSection] = useState<Section>("identity");

  // Resume tooling state (formerly /candidate/resume).
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [problemsSolved, setProblemsSolved] = useState<string[]>([]);
  const [newProblem, setNewProblem] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

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

  // Live meter: same pure function the server/PDF gate uses, fed by the
  // portfolio state — ticks update as the candidate fills sections in.
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
  function goToTask(key: Section | "problems") {
    if (key === "problems") {
      document
        .getElementById("problems-editor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSection(key);
    document
      .getElementById("portfolio-builder")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <PageHeader
        backHref="/candidate/dashboard"
        backLabel="Back to dashboard"
        eyebrow="Living Portfolio"
        title="Build your CV — in real time"
        description="Edit any section on the left and watch your CV update on the right. Complete the checklist to unlock your PDF resume export."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {complete && (
              <span className="text-clover inline-flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="size-4" />
                Ready to export
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              disabled={!hasContent}
            >
              <RotateCcw className="size-3.5" />
              Reset portfolio
            </Button>
            <Button variant="outline" size="sm" onClick={saveVersion} disabled={busy !== null}>
              <Save className="size-3.5" />
              {busy === "version" ? "Saving…" : "Save version"}
            </Button>
            {!complete ? (
              /* Locked until every checklist item is done. */
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
              /* Career Report is Pro-gated (server enforces too). */
              <Button size="sm" disabled={busy !== null} onClick={() => setUpgradeOpen(true)}>
                <Download className="size-3.5" />
                Download PDF — Pro
              </Button>
            )}
          </div>
        }
      />

      <section className="px-4 py-8 sm:py-12">
        {note && <p className="text-clover mb-4 text-sm">{note}</p>}
        <Grid12>
          <Col span={12} lg={6}>
            <PortfolioBuilder section={section} onSectionChange={setSection} />

            {/* Problems solved — proof of capability, leads the PDF. */}
            <section
              id="problems-editor"
              className="glass-3 mt-4 scroll-mt-24 rounded-2xl p-6"
            >
              <h2 className="text-luminous font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                Problems solved
              </h2>
              <p className="text-muted-foreground mt-2 text-xs">
                Notable problems you solved and their impact — these lead your
                PDF, before job titles.
              </p>
              {problemsSolved.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {problemsSolved.map((p) => (
                    <li
                      key={p}
                      className="border-border/15 bg-foreground/2 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1">{p}</span>
                      <button
                        type="button"
                        aria-label={`Remove "${p}"`}
                        onClick={() =>
                          void saveProblems(problemsSolved.filter((x) => x !== p))
                        }
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = newProblem.trim();
                  if (!v || problemsSolved.includes(v)) return;
                  void saveProblems([...problemsSolved, v]);
                  setNewProblem("");
                }}
              >
                <input
                  type="text"
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  maxLength={240}
                  placeholder="e.g. Cut deployment time from 2 days to 20 minutes"
                  className="bg-foreground/2 border-border/15 focus:border-luminous/60 focus:ring-luminous/30 min-h-11 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                />
                <Button type="submit" size="sm" className="min-h-11 shrink-0">
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </form>
            </section>

            {/* Saved versions (formerly on the Resume page). */}
            <section className="glass-3 mt-4 rounded-2xl p-6">
              <h2 className="text-luminous font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                Saved versions
              </h2>
              {versions.length ? (
                <ul className="mt-3 space-y-2">
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
            </section>
          </Col>

          <Col span={12} lg={6}>
            {/* Interactive completeness checklist — every task deep-links
                to the section where it gets done. */}
            <section className="glass-3 rounded-2xl p-6">
              <h2 className="text-luminous font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                Completeness
              </h2>
              <MeterRow
                label="Resume completeness"
                value={completeness.pct}
                accent="clover"
                className="mt-3"
              />
              <ul className="mt-4 space-y-1">
                {completeness.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => goToTask(item.key)}
                      className={cn(
                        "hover:bg-accent focus-visible:ring-luminous/40 group flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2",
                      )}
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
                <p className="text-muted-foreground mt-3 text-xs">
                  Click any item to jump to where it gets done. Finish all of
                  them to unlock the PDF export.
                </p>
              )}
            </section>

            <div className="mt-4 lg:sticky lg:top-24">
              <CVPreview />
            </div>
          </Col>
        </Grid12>

        {/* Timeline / Living Portfolio (Phase 2) — chronological milestones
            derived from the sections above; fully scrollable, full width. */}
        <CareerTimeline className="mt-4" />
      </section>

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
    </>
  );
}
