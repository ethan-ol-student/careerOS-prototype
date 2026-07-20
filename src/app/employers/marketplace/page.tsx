"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Loader2,
  Send,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { EmployerPersonalizationSummary } from "@/components/marketplace/EmployerPersonalizationSummary";
import {
  MarketplaceFilters,
  type CategoryFilter,
} from "@/components/marketplace/MarketplaceFilters";
import { CandidateDetailModal } from "@/components/marketplace/CandidateDetailModal";
import { JobPostForm } from "@/components/employer/JobPostForm";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { httpAdapter as api } from "@/lib/api/httpAdapter";
import { isTestModeEnabled } from "@/lib/dev/testMode";
import { CANDIDATES } from "@/lib/candidates/data";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import type { ContextStatus } from "@/lib/types/contextStatus";
import type { Candidate } from "@/lib/candidates/types";
import { cn } from "@/lib/utils";

// Gmail-style pages: fixed size, prev/next, "1–10 of 43". No infinite scroll.
const PAGE_SIZE = 10;

export default function EmployerMarketplacePage() {
  const { isSaved, toggleSaved } = useSavedCandidates();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("Recommended");
  const [page, setPage] = useState(1);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [showQuickPost, setShowQuickPost] = useState(false);

  // The candidate pool now comes from the API/adapter (DB-backed) — the
  // static `CANDIDATES` import is only used as a dev-only demo fallback.
  const [pool, setPool] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<ContextStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Wireframe top row: the role being hired for + the expandable
  // "Ideal candidate" snapshot (the personalization summary, as an
  // overlay so it never pushes the results panel around).
  const [hiringRole, setHiringRole] = useState("");
  const [idealOpen, setIdealOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/employer/profile", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);
      if (!cancelled && res?.ok) setHiringRole(res.data.role ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time fetch transition to loading.
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        const result = await api.listCandidates({ limit: 100 });
        if (cancelled) return;
        if (!result.ok) {
          // Dev-only fallback so offline demos still render; never in prod.
          if (isTestModeEnabled()) {
            setPool(CANDIDATES);
            setUsingDemo(true);
            setStatus("ready");
            return;
          }
          setStatus("error");
          setError(result.error.message);
          return;
        }
        setPool(result.data.candidates);
        setUsingDemo(false);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (isTestModeEnabled()) {
          setPool(CANDIDATES);
          setUsingDemo(true);
          setStatus("ready");
          return;
        }
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load candidates.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Client-side filtering over the API-sourced pool (instant UX).
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool
      .filter((c) => {
        if (category !== "Recommended" && c.category !== category) return false;
        if (!q) return true;
        const haystack = [
          c.name,
          c.careerDirection,
          c.targetRole,
          c.category,
          c.industry,
          c.location,
          ...c.topSkills,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [pool, query, category]);

  // Pagination window (filters reset to page 1 via the handlers below).
  const total = candidates.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = candidates.slice(start, start + PAGE_SIZE);

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-5">
        <div className="max-w-container mx-auto flex flex-col gap-5">
          {usingDemo ? (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2.5 text-xs text-yellow-200">
              <FlaskConical className="size-4 shrink-0 text-yellow-400" />
              Showing local demo candidates — the marketplace API was
              unavailable. (Dev only.)
            </div>
          ) : null}

          {/* Wireframe top row: the role you're hiring for + the
              expandable "Ideal candidate" snapshot. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="border-border/15 bg-foreground/2 flex min-w-0 items-center gap-2 rounded-full border py-1.5 pl-4 pr-1.5">
              <span className="text-clover shrink-0 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em]">
                Looking for:
              </span>
              <span
                className="bg-clover/10 text-clover-soft truncate rounded-full px-3 py-1 text-sm font-semibold"
                title={hiringRole || undefined}
              >
                {hiringRole || "Set your target role in Settings"}
              </span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIdealOpen((v) => !v)}
                aria-expanded={idealOpen}
                className="border-clover/30 bg-clover/10 text-clover-soft hover:bg-clover/16 flex items-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] transition-colors"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Ideal candidate
                <ChevronDown
                  className={cn("size-3.5 transition-transform", idealOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {idealOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close ideal candidate panel"
                    onClick={() => setIdealOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="border-border/20 bg-background/95 absolute right-0 top-full z-40 mt-2 w-[min(92vw,680px)] rounded-2xl border p-2 shadow-2xl backdrop-blur-xl">
                    <EmployerPersonalizationSummary pool={pool} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* One panel: search + filters + results + pagination. */}
          <section
            aria-label="Candidate results"
            className="glass-3 rounded-2xl p-4 sm:p-5"
          >
            <MarketplaceFilters
              query={query}
              onQueryChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              category={category}
              onCategoryChange={(c) => {
                setCategory(c);
                setPage(1);
              }}
              action={
                <Button
                  onClick={() => setShowQuickPost(true)}
                  className="shrink-0"
                >
                  <FilePlus2 className="size-4" />
                  <span className="max-sm:hidden">Quick Post</span>
                </Button>
              }
            />

            <div className="mb-3 mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-clover font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                {category === "Recommended"
                  ? "Recommended candidates"
                  : `${category} candidates`}
              </p>
              {status === "ready" && total > 0 ? (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
                </span>
              ) : null}
            </div>

            {status === "loading" ? (
              <div className="glass-3 flex items-center justify-center gap-2 rounded-2xl p-10 text-sm">
                <Loader2 className="text-luminous size-4 animate-spin" />
                <span className="text-muted-foreground">
                  Loading candidates…
                </span>
              </div>
            ) : status === "error" ? (
              <div className="glass-3 rounded-2xl p-10 text-center">
                <TriangleAlert className="text-destructive mx-auto size-6" />
                <p className="text-foreground mt-3 text-sm font-medium">
                  Couldn&apos;t load candidates
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {error ?? "Please try again."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  Retry
                </Button>
              </div>
            ) : total === 0 ? (
              <div className="glass-3 rounded-2xl p-10 text-center">
                <p className="text-foreground text-sm font-medium">
                  No candidates match those filters.
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Try a different category or clear the search.
                </p>
              </div>
            ) : (
              // Reference §06: match-first rows — score box left, profile
              // center, readiness + actions right.
              <>
                <ul className="space-y-2.5">
                  {pageItems.map((c) => {
                    const saved = isSaved(c.id);
                    const initials = c.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <li
                        key={c.id}
                        className="border-border/15 bg-foreground/2 hover:border-clover/40 hover:bg-clover/4 flex flex-wrap items-stretch gap-4 rounded-xl border p-3.5 transition-colors"
                      >
                        {/* Match score box */}
                        <div className="border-clover/28 bg-linear-to-b from-clover/14 to-clover/4 flex w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3">
                          <p className="text-clover-soft font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
                            Match
                          </p>
                          <p className="text-clover text-3xl font-extrabold leading-none tracking-tight">
                            {c.matchScore}
                            <span className="text-clover-soft text-sm font-semibold">
                              %
                            </span>
                          </p>
                          <div className="bg-foreground/8 mt-0.5 h-1.25 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-clover h-full rounded-full"
                              style={{ width: `${c.matchScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Profile */}
                        <div className="flex min-w-56 flex-1 items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setActiveCandidate(c)}
                            aria-label={`Open ${c.name}'s details`}
                            className="bg-luminous/15 ring-luminous/30 text-luminous-soft focus-visible:ring-clover/40 flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2 focus:outline-none focus-visible:ring-2"
                          >
                            {initials}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveCandidate(c)}
                                className="truncate text-[0.9375rem] font-semibold tracking-tight hover:underline"
                              >
                                {c.name}
                              </button>
                              <Chip
                                tone="clover"
                                icon={<TrendingUp className="size-3" />}
                              >
                                {c.growthSignal}
                              </Chip>
                            </div>
                            <p className="text-muted-foreground mt-0.5 truncate text-xs">
                              {c.targetRole} · {c.stage} ·{" "}
                              <span className="text-muted-foreground/70">
                                {c.location}
                              </span>
                            </p>
                            <p className="text-foreground/85 mt-1.5 line-clamp-1 text-xs leading-relaxed">
                              {c.whyRecommended}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {c.topSkills.slice(0, 4).map((s) => (
                                <Chip key={s}>{s}</Chip>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Readiness + actions */}
                        <div className="flex w-44 shrink-0 flex-col items-end justify-center gap-2.5">
                          <div className="w-full">
                            <div className="mb-1 flex items-baseline justify-between">
                              <span className="text-muted-foreground font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.1em]">
                                Readiness
                              </span>
                              <span className="text-luminous-soft text-xs font-bold">
                                {c.readinessScore}
                              </span>
                            </div>
                            <div className="bg-foreground/8 h-1 w-full overflow-hidden rounded-full">
                              <div
                                className="bg-luminous h-full rounded-full"
                                style={{ width: `${c.readinessScore}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSaved(c.id)}
                              aria-label={
                                saved ? `Unsave ${c.name}` : `Save ${c.name}`
                              }
                              aria-pressed={saved}
                              className={cn(
                                "border-border/15 hover:text-clover focus-visible:ring-clover/40 flex size-8 items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2",
                                saved
                                  ? "text-clover"
                                  : "text-muted-foreground",
                              )}
                            >
                              <Bookmark
                                className={cn(
                                  "size-3.5",
                                  saved && "fill-current",
                                )}
                              />
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveCandidate(c)}
                            >
                              View
                            </Button>
                            <LinkButton
                              href={`/employers/contact/${c.id}`}
                              size="sm"
                              icon={<Send className="size-3.5" />}
                            >
                              Invite
                            </LinkButton>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Reference pagination: "Page N of M", clover next */}
                <div className="mt-5 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage <= 1}
                    aria-label="Previous page"
                    className="border-border/15 text-muted-foreground hover:bg-foreground/4 hover:text-foreground disabled:opacity-30 flex size-8 items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="font-mono text-xs font-semibold tracking-[0.08em]">
                    Page {safePage}{" "}
                    <span className="text-muted-foreground">
                      of {pageCount}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage >= pageCount}
                    aria-label="Next page"
                    className="border-clover/35 bg-clover/10 text-clover-soft hover:bg-clover/18 disabled:opacity-30 flex size-8 items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {activeCandidate && (
        <CandidateDetailModal
          candidate={activeCandidate}
          isSaved={isSaved(activeCandidate.id)}
          onSaveToggle={() => toggleSaved(activeCandidate.id)}
          onClose={() => setActiveCandidate(null)}
        />
      )}

      <Modal
        isOpen={showQuickPost}
        onClose={() => setShowQuickPost(false)}
        title="Quick job post"
        description="Title, description, requirements and the skill matrix — live in the candidate feed for 30 days."
        size="lg"
        footer={
          <p className="text-muted-foreground text-xs">
            Need budget, timeline or team-size fields?{" "}
            <Link
              href="/employers/post-job"
              className="text-clover hover:underline"
            >
              Use the full Post Job page →
            </Link>
          </p>
        }
      >
        <JobPostForm variant="quick" />
      </Modal>
    </EmployerAppShell>
  );
}
