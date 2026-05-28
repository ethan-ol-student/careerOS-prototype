"use client";

import { Search } from "lucide-react";
import { CANDIDATE_CATEGORIES } from "@/lib/candidates/data";
import type { CandidateCategory } from "@/lib/candidates/types";
import { cn } from "@/lib/utils";

export type CategoryFilter = "Recommended" | CandidateCategory;

export const ALL_CATEGORIES: CategoryFilter[] = [
  "Recommended",
  ...CANDIDATE_CATEGORIES,
];

interface MarketplaceFiltersProps {
  query: string;
  onQueryChange: (v: string) => void;
  category: CategoryFilter;
  onCategoryChange: (c: CategoryFilter) => void;
}

export function MarketplaceFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: MarketplaceFiltersProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="glass-3 relative flex items-center gap-2 rounded-xl px-4 py-2">
        <Search className="text-muted-foreground size-4 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by role, skill, or career direction…"
          aria-label="Search candidates"
          className="placeholder:text-muted-foreground w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>

      <div
        role="tablist"
        aria-label="Candidate categories"
        className="flex flex-wrap gap-2"
      >
        {ALL_CATEGORIES.map((c) => {
          const isActive = c === category;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "border-clover bg-clover/10 text-clover ring-2 ring-clover/20"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-clover/60 hover:text-foreground",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </section>
  );
}
