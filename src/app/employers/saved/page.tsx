"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Loader2 } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { SavedCandidateCard } from "@/components/marketplace/SavedCandidateCard";
import { Button } from "@/components/ui/Button";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import type { Candidate } from "@/lib/candidates/types";
import type { ContextStatus } from "@/lib/types/contextStatus";

/**
 * Employer shortlist. Resolves each saved candidate id against the
 * DB-backed marketplace API so the shortlist renders BOTH seeded demo
 * candidates and real candidates (projected mirror rows) — the old
 * mock-only `findCandidateById` lookup silently dropped real people.
 * Fetch-by-id works even if a real candidate later turned discovery
 * off, so an employer never loses someone they already shortlisted.
 */
export default function SavedCandidatesPage() {
  const { savedIds, toggleSaved } = useSavedCandidates();
  const [saved, setSaved] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<ContextStatus>("loading");

  // Stable dependency: re-resolve only when the set of ids changes.
  const idKey = savedIds.join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = idKey ? idKey.split(",") : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset to loading before the async resolve.
    setStatus("loading");
    if (ids.length === 0) {
      setSaved([]);
      setStatus("ready");
      return;
    }
    (async () => {
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(`/api/marketplace/${encodeURIComponent(id)}`, {
                cache: "no-store",
              });
              const body = (await res.json().catch(() => null)) as
                | { ok?: boolean; data?: Candidate }
                | null;
              return body?.ok && body.data ? body.data : null;
            } catch {
              return null;
            }
          }),
        );
        if (cancelled) return;
        setSaved(results.filter((c): c is Candidate => c != null));
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idKey]);

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
              Saved candidates
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your shortlist
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
              Candidates you&apos;ve bookmarked from the marketplace. Reach out
              when you&apos;re ready.
            </p>
          </header>

          {status === "loading" ? (
            <div className="glass-3 flex items-center justify-center gap-2 rounded-2xl p-10 text-sm">
              <Loader2 className="text-luminous size-4 animate-spin" />
              <span className="text-muted-foreground">Loading your shortlist…</span>
            </div>
          ) : saved.length === 0 ? (
            <div className="glass-3 ring-luminous/20 flex flex-col items-center gap-4 rounded-2xl p-10 text-center ring-1">
              <div className="bg-luminous/15 text-luminous flex size-14 items-center justify-center rounded-2xl">
                <Bookmark className="size-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                You have not saved any candidates yet.
              </h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Tap the bookmark icon on any candidate card in the marketplace
                and they&apos;ll show up here.
              </p>
              <Link href="/employers/marketplace">
                <Button>Browse marketplace</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {saved.map((c) => (
                <SavedCandidateCard
                  key={c.id}
                  candidate={c}
                  onRemove={() => toggleSaved(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </EmployerAppShell>
  );
}
