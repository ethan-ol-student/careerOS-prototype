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
import { explainReadiness } from "@/lib/candidates/readiness";

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
  // Explainable readiness — the displayed number IS the sum of the
  // factors shown below, so the score is never a black box (principle #3).
  const readiness = explainReadiness(candidate);
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
            value={readiness.score}
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

      {/* Readiness breakdown — explainable, factor-by-factor */}
      <Section label="How readiness is computed">
        <ul className="flex flex-col gap-1.5">
          {readiness.factors.map((f) => (
            <li
              key={f.label}
              className="border-border/40 bg-card/40 flex items-start justify-between gap-3 rounded-lg border p-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-muted-foreground text-[11px] leading-snug">
                  {f.detail}
                </p>
              </div>
              <span className="text-clover shrink-0 font-mono text-xs">
                +{f.earned}/{f.max}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground/80 mt-2 text-[10px] italic leading-snug">
          Readiness = {readiness.score}/100, summed from the factors above —
          based on self-reported profile signals, not verified assessments.
        </p>
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
