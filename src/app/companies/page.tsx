"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Loader2, MapPin } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { CompanyMetrics } from "@/lib/services/companies.service";

/**
 * Company leaderboard — ranked most candidate-friendly first. Real
 * responsiveness metrics when applications exist; deterministic seeded
 * scores otherwise, always labelled "Demo data". Size/type/location are
 * surfaced for the mid-career better-fit comparison (local vs MNC vs
 * smaller-company-more-leadership).
 */
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyMetrics[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/companies", { cache: "no-store" });
      const json = await res.json();
      setCompanies(json.ok ? json.data.companies : []);
    })();
  }, []);

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
          Who treats candidates well
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
          <Building2 className="text-luminous size-6" />
          Companies
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ranked by responsiveness to applicants. Scores become real as
          applications flow; seeded entries are labelled demo.
        </p>

        {!companies ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {companies.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/companies/${c.id}`}
                  className="glass-3 border-border/40 hover:border-luminous/40 flex flex-col gap-3 rounded-2xl border p-5 transition-colors sm:flex-row sm:items-center"
                >
                  <span className="text-luminous w-8 shrink-0 text-lg font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{c.name}</h2>
                      {c.demoMetrics && (
                        <Badge variant="outline" className="text-[10px]">
                          Demo data
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {c.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {c.location}
                        </span>
                      )}
                      <span>
                        {c.jobCount} open role{c.jobCount === 1 ? "" : "s"}
                      </span>
                      {c.respondedShare !== null && (
                        <span>
                          {Math.round(c.respondedShare * 100)}% of applicants answered
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.size && <Chip>{c.size}</Chip>}
                      {c.type && <Chip tone="luminous">{c.type}</Chip>}
                    </div>
                  </div>
                  <div className="w-full shrink-0 sm:w-48">
                    <ScoreBar
                      label="Candidate-friendly"
                      value={c.responseScore}
                      size="sm"
                      accent="clover"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </AppShell>
  );
}
