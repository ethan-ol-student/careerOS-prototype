"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, MapPin, Send, TrendingUp } from "lucide-react";
import type { Candidate } from "@/lib/candidates/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoringInfo } from "@/components/ui/ScoringInfo";
import { cn } from "@/lib/utils";

interface CandidateCardProps {
  candidate: Candidate;
  isSaved: boolean;
  onSaveToggle: () => void;
  onOpenDetails: () => void;
}

/**
 * Compact candidate card surfaced in the marketplace grid. Match +
 * readiness are visually emphasized via the shared `ScoreBar`
 * primitive; skills surface as `Chip`s. The whole card is
 * clickable (opens detail modal) with the explicit "View Profile"
 * still routing to the dedicated profile route.
 */
export function CandidateCard({
  candidate,
  isSaved,
  onSaveToggle,
  onOpenDetails,
}: CandidateCardProps) {
  return (
    <article className="glass-3 flex h-full flex-col gap-4 rounded-2xl p-5 transition-colors hover:bg-card/50">
      {/* Header */}
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={onOpenDetails}
          className="bg-luminous/15 ring-luminous/30 text-luminous flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2 focus-visible:outline-none focus-visible:ring-luminous/60"
          aria-label={`Open ${candidate.name}'s details`}
        >
          {candidate.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-left"
          >
            <h3 className="truncate text-base font-semibold tracking-tight">
              {candidate.name}
            </h3>
            <p className="text-muted-foreground truncate text-xs">
              {candidate.targetRole} · {candidate.stage}
            </p>
          </button>
        </div>
        <button
          type="button"
          aria-label={isSaved ? "Unsave candidate" : "Save candidate"}
          onClick={onSaveToggle}
          className={cn(
            "text-muted-foreground hover:text-luminous shrink-0 rounded-md p-1.5 transition-colors",
            isSaved && "text-luminous",
          )}
        >
          {isSaved ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </button>
      </header>

      {/* Direction */}
      <p className="text-sm leading-snug">{candidate.careerDirection}</p>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-2">
        <ScoreBar
          label="Match"
          value={candidate.matchScore}
          accent="luminous"
          size="sm"
          trailing={<ScoringInfo />}
        />
        <ScoreBar
          label="Readiness"
          value={candidate.readinessScore}
          accent="clover"
          size="sm"
        />
      </div>

      {/* Growth signal */}
      <div className="flex items-center gap-2 text-xs">
        <Chip tone="clover" icon={<TrendingUp className="size-3" />}>
          {candidate.growthSignal}
        </Chip>
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {candidate.location}
        </span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {candidate.topSkills.slice(0, 4).map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
      </div>

      {/* Why match */}
      <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
        {candidate.whyRecommended}
      </p>

      {/* CTAs — pushed to bottom for consistent heights */}
      <div className="mt-auto grid grid-cols-3 gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenDetails}
          className="col-span-1"
        >
          View
        </Button>
        <Button
          type="button"
          variant={isSaved ? "secondary" : "outline"}
          size="sm"
          onClick={onSaveToggle}
          className="col-span-1"
        >
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Link
          href={`/employers/contact/${candidate.id}`}
          className="col-span-1 inline-flex"
        >
          <Button type="button" size="sm" className="w-full">
            <Send className="size-3.5" />
            Invite
          </Button>
        </Link>
      </div>
    </article>
  );
}
