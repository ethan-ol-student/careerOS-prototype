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
  /** Optional action rendered beside the search box (e.g. Quick Post). */
  action?: React.ReactNode;
}

export function MarketplaceFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  action,
}: MarketplaceFiltersProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="glass-3 relative flex min-w-0 flex-1 items-center gap-2 rounded-xl px-4 py-2">
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
        {action}
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
                  ? "border-clover/40 bg-clover/12 text-clover-soft"
                  : "border-border/15 bg-foreground/2 text-muted-foreground hover:border-clover/60 hover:text-foreground",
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
