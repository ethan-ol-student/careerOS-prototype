"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, TriangleAlert, FlaskConical } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { EmployerPersonalizationSummary } from "@/components/marketplace/EmployerPersonalizationSummary";
import {
  MarketplaceFilters,
  type CategoryFilter,
} from "@/components/marketplace/MarketplaceFilters";
import { CandidateCard } from "@/components/marketplace/CandidateCard";
import { CandidateDetailModal } from "@/components/marketplace/CandidateDetailModal";
import { Button } from "@/components/ui/Button";
import { getApiAdapter } from "@/lib/api";
import { isTestModeEnabled } from "@/lib/dev/testMode";
import { CANDIDATES } from "@/lib/candidates/data";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import type { ContextStatus } from "@/lib/types/contextStatus";
import type { Candidate } from "@/lib/candidates/types";

export default function EmployerMarketplacePage() {
  const { isSaved, toggleSaved } = useSavedCandidates();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("Recommended");
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  // The candidate pool now comes from the API/adapter (DB-backed) — the
  // static `CANDIDATES` import is only used as a dev-only demo fallback.
  const [pool, setPool] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<ContextStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time fetch transition to loading.
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        const api = await getApiAdapter();
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

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto flex flex-col gap-8">
          {usingDemo ? (
            <div className="flex items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-2.5 text-xs text-yellow-200">
              <FlaskConical className="size-4 shrink-0 text-yellow-400" />
              Showing local demo candidates — the marketplace API was
              unavailable. (Dev only.)
            </div>
          ) : null}

          <EmployerPersonalizationSummary pool={pool} />

          <MarketplaceFilters
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
          />

          <section aria-label="Candidate results">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
                {category === "Recommended"
                  ? "Recommended candidates"
                  : `${category} candidates`}
              </p>
              {status === "ready" ? (
                <p className="text-muted-foreground text-xs">
                  {candidates.length} match
                  {candidates.length === 1 ? "" : "es"}
                </p>
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
            ) : candidates.length === 0 ? (
              <div className="glass-3 rounded-2xl p-10 text-center">
                <p className="text-foreground text-sm font-medium">
                  No candidates match those filters.
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Try a different category or clear the search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    isSaved={isSaved(c.id)}
                    onSaveToggle={() => toggleSaved(c.id)}
                    onOpenDetails={() => setActiveCandidate(c)}
                  />
                ))}
              </div>
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
    </EmployerAppShell>
  );
}
