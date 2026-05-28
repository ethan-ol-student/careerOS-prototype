"use client";

import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Candidate } from "@/lib/candidates/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoringInfo } from "@/components/ui/ScoringInfo";

interface CandidateDetailModalProps {
  candidate: Candidate;
  isSaved: boolean;
  onSaveToggle: () => void;
  onClose: () => void;
}

export function CandidateDetailModal({
  candidate,
  isSaved,
  onSaveToggle,
  onClose,
}: CandidateDetailModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={candidate.name}
      size="lg"
      hideVisibleTitle
      footer={
        <div className="border-border/40 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant={isSaved ? "secondary" : "outline"}
            onClick={onSaveToggle}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="size-4" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="size-4" />
                Save
              </>
            )}
          </Button>
          <Link href={`/candidates/${candidate.id}`}>
            <Button type="button" variant="outline" className="w-full">
              <ExternalLink className="size-4" />
              View Profile
            </Button>
          </Link>
          <Link href={`/employers/contact/${candidate.id}`}>
            <Button type="button" className="w-full">
              <Send className="size-4" />
              Invite
            </Button>
          </Link>
        </div>
      }
    >
      {/* Header */}
      <header className="mb-6 flex items-start gap-4">
        <div className="bg-luminous/15 ring-luminous/30 text-luminous flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ring-2">
          {candidate.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {candidate.name}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {candidate.targetRole} · {candidate.industry}
          </p>
          <p className="text-foreground/80 mt-2 text-sm leading-relaxed">
            {candidate.headline}
          </p>
        </div>
      </header>

      {/* Career direction */}
      <Section label="Career direction">
        <p className="text-sm leading-relaxed">{candidate.careerDirection}</p>
      </Section>

      {/* Scores */}
      <Section
        label="Signal"
        trailing={<ScoringInfo />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ScoreBar label="Match" value={candidate.matchScore} accent="luminous" />
          <ScoreBar
            label="Readiness"
            value={candidate.readinessScore}
            accent="clover"
          />
          <div className="glass-3 flex flex-col gap-1 rounded-lg p-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
              Growth signal
            </p>
            <span className="text-clover inline-flex items-center gap-1.5 text-sm font-semibold">
              <TrendingUp className="size-3.5" />
              {candidate.growthSignal}
            </span>
            <span className="text-muted-foreground text-[10px]">
              {candidate.availability}
            </span>
          </div>
        </div>
      </Section>

      {/* Skills */}
      <Section label="Top skills">
        <div className="flex flex-wrap gap-1.5">
          {candidate.topSkills.map((skill) => (
            <Chip key={skill} tone="luminous" className="text-xs px-2.5">
              {skill}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Portfolio */}
      <Section label="Portfolio projects">
        <ul className="flex flex-col gap-2">
          {candidate.portfolioProjects.map((project) => (
            <li
              key={project}
              className="glass-3 flex items-center gap-2 rounded-lg p-3 text-sm"
            >
              <Sparkles className="text-luminous size-4 shrink-0" />
              <span className="truncate">{project}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Why recommended */}
      <Section label="Why we recommend them">
        <p className="text-sm leading-relaxed">{candidate.whyRecommended}</p>
        <p className="text-muted-foreground mt-2 inline-flex items-center gap-1 text-xs">
          <MapPin className="size-3" />
          {candidate.location}
        </p>
      </Section>
    </Modal>
  );
}

function Section({
  label,
  children,
  trailing,
}: {
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-luminous text-[10px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
        {trailing}
      </div>
      {children}
    </section>
  );
}
