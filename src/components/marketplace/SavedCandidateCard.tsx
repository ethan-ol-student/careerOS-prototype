"use client";

import Link from "next/link";
import { BookmarkX, MapPin, Send, TrendingUp } from "lucide-react";
import type { Candidate } from "@/lib/candidates/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScoringInfo } from "@/components/ui/ScoringInfo";

interface SavedCandidateCardProps {
  candidate: Candidate;
  onRemove: () => void;
}

export function SavedCandidateCard({
  candidate,
  onRemove,
}: SavedCandidateCardProps) {
  return (
    <article className="glass-3 flex h-full flex-col gap-4 rounded-2xl p-5">
      <header className="flex items-start gap-3">
        <div className="bg-luminous/15 ring-luminous/30 text-luminous flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2">
          {candidate.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {candidate.name}
          </h3>
          <p className="text-muted-foreground truncate text-xs">
            {candidate.careerDirection}
          </p>
        </div>
        <button
          type="button"
          aria-label="Remove from saved"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1.5 transition-colors"
        >
          <BookmarkX className="size-4" />
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Chip tone="luminous">Match {candidate.matchScore}</Chip>
        <Chip tone="clover" icon={<TrendingUp className="size-3" />}>
          {candidate.growthSignal}
        </Chip>
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {candidate.location}
        </span>
        <ScoringInfo />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {candidate.topSkills.slice(0, 4).map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
        <Link href={`/candidates/${candidate.id}`}>
          <Button type="button" variant="outline" size="sm" className="w-full">
            View Profile
          </Button>
        </Link>
        <Link href={`/employers/contact/${candidate.id}`}>
          <Button type="button" size="sm" className="w-full">
            <Send className="size-3.5" />
            Invite / Contact
          </Button>
        </Link>
      </div>
    </article>
  );
}
