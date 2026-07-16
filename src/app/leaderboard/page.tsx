"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2, ExternalLink } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { cn } from "@/lib/utils";

interface UniversityRow {
  id: string;
  name: string;
  country: string;
  score: number;
  sourceUrl: string | null;
  isDemo: boolean;
}

/** Curated global "best employers" list (parallel to the university table).
 *  Static demo data — one consumer, so it lives with the page (no DB/API). */
const COMPANY_SOURCE = "https://www.forbes.com/lists/worlds-best-employers/";
const COMPANY_RANKINGS: { name: string; country: string; score: number; sourceUrl: string }[] = [
  { name: "Microsoft", country: "United States", score: 95, sourceUrl: COMPANY_SOURCE },
  { name: "Alphabet (Google)", country: "United States", score: 93, sourceUrl: COMPANY_SOURCE },
  { name: "Samsung Electronics", country: "South Korea", score: 91, sourceUrl: COMPANY_SOURCE },
  { name: "Apple", country: "United States", score: 90, sourceUrl: COMPANY_SOURCE },
  { name: "Delta Air Lines", country: "United States", score: 88, sourceUrl: COMPANY_SOURCE },
  { name: "BMW Group", country: "Germany", score: 87, sourceUrl: COMPANY_SOURCE },
  { name: "Petronas", country: "Malaysia", score: 85, sourceUrl: COMPANY_SOURCE },
  { name: "Adobe", country: "United States", score: 84, sourceUrl: COMPANY_SOURCE },
  { name: "Singapore Airlines", country: "Singapore", score: 83, sourceUrl: COMPANY_SOURCE },
  { name: "Maybank", country: "Malaysia", score: 81, sourceUrl: COMPANY_SOURCE },
];

interface Row {
  key: string;
  name: string;
  sub: string;
  score: number;
  sourceUrl: string | null;
  isDemo: boolean;
}

/**
 * Leaderboards — curated, cited demo data (never ranks real users). Two tabs:
 * Malaysian university employability + global best-employer companies. Fixed
 * viewport: header/tabs stay anchored, only the ranked list scrolls.
 */
export default function LeaderboardPage() {
  const [tab, setTab] = useState<"university" | "company">("university");
  const [universities, setUniversities] = useState<UniversityRow[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const json = await res.json();
      setUniversities(json.ok ? json.data.universities : []);
    })();
  }, []);

  const rows: Row[] | null =
    tab === "company"
      ? COMPANY_RANKINGS.map((c) => ({
          key: c.name,
          name: c.name,
          sub: c.country,
          score: c.score,
          sourceUrl: c.sourceUrl,
          isDemo: true,
        }))
      : universities?.map((u) => ({
          key: u.id,
          name: u.name,
          sub: u.country,
          score: u.score,
          sourceUrl: u.sourceUrl,
          isDemo: u.isDemo,
        })) ?? null;

  const scoreLabel = tab === "company" ? "Employer score" : "Employability";

  return (
    <AppShell>
      <main className="mx-auto flex h-full w-full flex-col px-4 pt-6 lg:min-h-0">
        {/* Anchored header + tabs */}
        <div className="shrink-0">
          <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
            Signals
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
              <Trophy className="text-luminous size-6" />
              Leaderboards
            </h1>
            <div
              role="group"
              aria-label="Leaderboard type"
              className="border-border/15 bg-foreground/2 flex rounded-full border p-0.5"
            >
              {(
                [
                  { id: "university", label: "University" },
                  { id: "company", label: "Company" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "min-h-8 rounded-full px-4 text-xs font-medium transition-colors",
                    tab === t.id
                      ? "bg-luminous/15 text-luminous-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {tab === "university"
              ? "Curated employability scores for Malaysian universities — context for where skills get built, not a judgment of individuals."
              : "Curated global “best employer” scores with citations — where talent most wants to work."}
          </p>
        </div>

        {/* Scroll zone: only the ranked list moves */}
        {!rows ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <ol className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-6 pr-1">
            {rows.map((r, i) => (
              <li
                key={r.key}
                className="glass-3 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center"
              >
                <span className="text-luminous w-8 shrink-0 text-lg font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{r.name}</h2>
                    {r.isDemo && (
                      <Badge variant="outline" className="text-[10px]">
                        Demo data
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {r.sub}
                    {r.sourceUrl && (
                      <>
                        {" · "}
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-luminous inline-flex items-center gap-0.5 hover:underline"
                        >
                          source <ExternalLink className="size-3" />
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="w-full shrink-0 sm:w-44">
                  <ScoreBar label={scoreLabel} value={r.score} size="sm" accent="clover" />
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </AppShell>
  );
}
