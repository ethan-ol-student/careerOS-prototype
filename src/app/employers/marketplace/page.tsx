"use client";

import { useMemo, useState } from "react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { HiringGoalSummary } from "@/components/marketplace/HiringGoalSummary";
import {
  MarketplaceFilters,
  type CategoryFilter,
} from "@/components/marketplace/MarketplaceFilters";
import { CandidateCard } from "@/components/marketplace/CandidateCard";
import { CandidateDetailModal } from "@/components/marketplace/CandidateDetailModal";
import { CANDIDATES } from "@/lib/candidates/data";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import type { Candidate } from "@/lib/candidates/types";

export default function EmployerMarketplacePage() {
  const { isSaved, toggleSaved } = useSavedCandidates();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("Recommended");
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CANDIDATES.filter((c) => {
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
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [query, category]);

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto flex flex-col gap-8">
          <HiringGoalSummary />

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
              <p className="text-muted-foreground text-xs">
                {candidates.length} match{candidates.length === 1 ? "" : "es"}
              </p>
            </div>

            {candidates.length === 0 ? (
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
