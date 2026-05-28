"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { SavedCandidateCard } from "@/components/marketplace/SavedCandidateCard";
import { Button } from "@/components/ui/Button";
import { findCandidateById } from "@/lib/candidates/data";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";

export default function SavedCandidatesPage() {
  const { savedIds, toggleSaved } = useSavedCandidates();

  const savedCandidates = savedIds
    .map((id) => findCandidateById(id))
    .filter((c): c is NonNullable<typeof c> => c != null);

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

          {savedCandidates.length === 0 ? (
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
              {savedCandidates.map((c) => (
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
