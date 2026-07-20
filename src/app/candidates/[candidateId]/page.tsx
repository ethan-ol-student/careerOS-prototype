"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Compass,
  MapPin,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { LayoutLines } from "@/components/ui/LayoutLines";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ScoringInfo } from "@/components/ui/ScoringInfo";
import { DemoDataBanner } from "@/components/employer/DemoDataBanner";
import { useMarketplaceCandidate } from "@/lib/marketplace/useCandidate";
import { explainReadiness } from "@/lib/candidates/readiness";

interface PageProps {
  params: Promise<{ candidateId: string }>;
}

/**
 * Read-only public candidate profile — a shareable Living Portfolio
 * view. Resolves the candidate from the DB-backed marketplace API so it
 * works for real candidates (projected mirror rows) as well as seeded
 * demo candidates. No employer shell so the URL works as a public link.
 */
export default function CandidateProfilePage({ params }: PageProps) {
  const { candidateId } = use(params);
  const { candidate, status, notFound: missing } =
    useMarketplaceCandidate(candidateId);

  if (missing) notFound();

  if (status === "loading" || !candidate) {
    return (
      <div className="bg-background text-foreground relative flex min-h-screen w-full items-center justify-center">
        <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
          <Loader2 className="text-luminous size-4 animate-spin" />
          Loading profile…
        </span>
      </div>
    );
  }

  // Explainable readiness — the number shown is the sum of the factors.
  const readiness = explainReadiness(candidate);

  return (
    <div className="bg-background text-foreground relative min-h-screen w-full">
      <LayoutLines />
      <DemoDataBanner />
      <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <div className="max-w-container relative mx-auto">
          <nav className="flex items-center justify-between py-4">
            {/* Public profile pages are entered from the employer
                marketplace, so the brand link stays inside the
                employer shell — back to the marketplace, not the
                landing page — and uses the same clover Compass as
                the rest of the employer surfaces. */}
            <Link
              href="/employers/marketplace"
              className="flex items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-clover" />
              Career OS
              <span className="text-muted-foreground ml-1 text-[0.625rem] font-mono font-medium uppercase tracking-wider">
                · Employer
              </span>
            </Link>
            <Link
              href="/employers/marketplace"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to marketplace
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto grid grid-cols-12 gap-6">
          {/* Hero */}
          <section className="glass-4 ring-luminous/20 col-span-12 overflow-hidden rounded-2xl p-6 ring-1 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-semibold ring-2">
                {candidate.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="mb-2">
                  <span className="text-muted-foreground">
                    {candidate.source === "real"
                      ? "Living Portfolio profile"
                      : "Demo candidate profile"}
                  </span>
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {candidate.name}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {candidate.targetRole} · {candidate.industry} ·{" "}
                  {candidate.stage}
                </p>
                <p className="text-foreground/85 mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
                  {candidate.headline}
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {candidate.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="size-3" />
                    {candidate.availability}
                  </span>
                  <span className="text-clover inline-flex items-center gap-1 font-medium">
                    <TrendingUp className="size-3" />
                    {candidate.growthSignal}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <Link href={`/employers/contact/${candidate.id}`}>
                  <Button className="w-full sm:w-auto">
                    <Send className="size-4" />
                    Invite to opportunity
                  </Button>
                </Link>
                <p className="text-muted-foreground text-[0.6875rem]">
                  {candidate.source === "real"
                    ? "Built from the candidate's Living Portfolio"
                    : "Profile rendered from prototype demo data"}
                </p>
              </div>
            </div>
          </section>

          {/* Career direction + scores */}
          <section className="glass-3 col-span-12 rounded-2xl p-6 lg:col-span-7">
            <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Career direction
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {candidate.careerDirection}
            </h2>
            <p className="text-foreground/80 mt-3 text-sm leading-relaxed">
              {candidate.whyRecommended}
            </p>
          </section>

          <section className="glass-3 col-span-12 rounded-2xl p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
                Signal
              </p>
              <ScoringInfo />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <ScoreBar
                label="Match"
                value={candidate.matchScore}
                accent="luminous"
                surfaceClassName="glass-4"
              />
              <ScoreBar
                label="Readiness"
                value={readiness.score}
                accent="clover"
                surfaceClassName="glass-4"
              />
            </div>
            <ul className="mt-3 flex flex-col gap-1">
              {readiness.factors.map((f) => (
                <li
                  key={f.label}
                  className="text-muted-foreground flex items-center justify-between gap-2 text-[0.6875rem]"
                >
                  <span>{f.label}</span>
                  <span className="text-clover font-mono">
                    +{f.earned}/{f.max}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground/80 mt-2 text-[0.625rem] italic leading-snug">
              Readiness is computed from self-reported profile signals, not
              verified assessments.
            </p>
          </section>

          {/* Skills */}
          <section className="glass-3 col-span-12 rounded-2xl p-6">
            <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Top skills
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.topSkills.map((skill) => (
                <Chip
                  key={skill}
                  tone="luminous"
                  className="px-3 py-1 text-xs"
                >
                  {skill}
                </Chip>
              ))}
            </div>
          </section>

          {/* Portfolio */}
          <section className="glass-3 col-span-12 rounded-2xl p-6">
            <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Portfolio projects
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {candidate.portfolioProjects.map((project) => (
                <li
                  key={project}
                  className="glass-4 flex items-center gap-2 rounded-lg p-3 text-sm"
                >
                  <Sparkles className="text-luminous size-4 shrink-0" />
                  <span className="truncate">{project}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}