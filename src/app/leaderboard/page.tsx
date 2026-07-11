"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2, ExternalLink } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";

interface UniversityRow {
  id: string;
  name: string;
  country: string;
  score: number;
  sourceUrl: string | null;
  isDemo: boolean;
}

/**
 * University employability leaderboard — curated, cited demo data.
 * No user data is ranked or exposed here (salary/leaderboard sensitivity
 * backup: never expose other users' real numbers).
 */
export default function LeaderboardPage() {
  const [rows, setRows] = useState<UniversityRow[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const json = await res.json();
      setRows(json.ok ? json.data.universities : []);
    })();
  }, []);

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Signals
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
          <Trophy className="text-luminous size-6" />
          University employability
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Curated employability scores with citations — context for where
          skills get built, not a judgment of individuals.
        </p>

        {!rows ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {rows.map((u, i) => (
              <li
                key={u.id}
                className="glass-3 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center"
              >
                <span className="text-luminous w-8 shrink-0 text-lg font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{u.name}</h2>
                    {u.isDemo && (
                      <Badge variant="outline" className="text-[10px]">
                        Demo data
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {u.country}
                    {u.sourceUrl && (
                      <>
                        {" · "}
                        <a
                          href={u.sourceUrl}
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
                  <ScoreBar label="Employability" value={u.score} size="sm" accent="clover" />
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </AppShell>
  );
}
