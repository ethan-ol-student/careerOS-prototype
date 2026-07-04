import Image from "next/image";
import {
  ArrowRight,
  ArrowRightIcon,
  Compass,
  Sparkles,
  Users,
  Briefcase,
  Search,
  Handshake,
  Activity,
  ShieldCheck,
  Telescope,
  Eye,
} from "lucide-react";

import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { Glow } from "@/components/ui/Glow";
import { Mockup, MockupFrame } from "@/components/ui/Mockup";
import { Navbar } from "@/components/marketing/Navbar";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { FeaturesCarousel } from "@/components/marketing/FeaturesCarousel";
import { LiveMatchDemo } from "@/components/marketing/LiveMatchDemo";
import { Parallax } from "@/components/marketing/Parallax";
import { isJudgeDemoEnabled } from "@/lib/dev/testMode";
import { cn } from "@/lib/utils";

const CANDIDATE_BENEFITS = [
  {
    icon: Telescope,
    title: "A live view of your trajectory",
    body: "Career OS reads your skills, learning, and goals to show where you stand and where you could go next.",
  },
  {
    icon: Sparkles,
    title: "Clear next steps as you grow",
    body: "Every skill you add updates your profile, your readiness, and your recommendations. No black-box scoring.",
  },
  {
    icon: Eye,
    title: "Found by the right employers",
    body: "As your readiness rises, your Living Portfolio reaches employers who match your direction.",
  },
];

const MID_CAREER_VALUE = [
  {
    icon: Activity,
    title: "A Career Health Score, not a job board",
    body: "Skill relevance, fair pay, and your best next move — one calm monthly check-up instead of daily noise.",
  },
  {
    icon: Compass,
    title: "Same skill, different door",
    body: "The Transferable Skill Map shows how much of each nearby role you already cover — and the Skill Bridge names the exact few skills to close.",
  },
  {
    icon: ShieldCheck,
    title: "Every recommendation explains itself",
    body: 'Safe, growth, and bold pathways each carry a "Why this recommendation?" — reasons and trade-offs, never a verdict from a black box.',
  },
];

const EMPLOYER_VALUE = [
  {
    icon: Search,
    title: "Talent on trajectory",
    body: "Find candidates by where they're heading, not only where they've been. Filter by compounding skills and readiness signals.",
  },
  {
    icon: Activity,
    title: "Live readiness signals",
    body: "Every Living Portfolio updates as candidates learn and ship, so you see current momentum instead of a frozen snapshot.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent matches",
    body: "Every match is explainable: the exact skills, evidence, and chapters behind a candidate's readiness score.",
  },
];

// Trust = methodology, not vanity metrics: every claim here is verifiable
// in-product (this is a research preview — we don't invent user counts).
const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Deterministic scoring",
    body: "Same inputs, same score, every time. Eleven engines, assertion-checked on every release.",
  },
  {
    icon: Eye,
    title: "Explainable by contract",
    body: 'Every score ships with its reasons — the "Why this recommendation?" button is never paywalled.',
  },
  {
    icon: Handshake,
    title: "Honest demo data",
    body: "Seeded content is curated, cited, and always labelled — and your salary input stays private to you.",
  },
];

const CONNECTION_STEPS = [
  {
    side: "Candidate",
    tint: "luminous" as const,
    icon: Users,
    title: "Growth signals in",
    body: "Skills, projects, learning chapters, and goals flow into the Living Portfolio as the candidate grows.",
  },
  {
    side: "CareerOS",
    tint: "brand" as const,
    icon: Handshake,
    title: "The bridge",
    body: "CareerOS reads trajectory, compounding skills, and readiness, turning personal growth into a discoverable shape.",
  },
  {
    side: "Employer",
    tint: "clover" as const,
    icon: Briefcase,
    title: "Discovery out",
    body: "Employers surface candidates whose direction matches the role, then reach out with full context.",
  },
];

const CONNECTION_TINT: Record<
  "luminous" | "brand" | "clover",
  { ring: string; chip: string; sideText: string }
> = {
  luminous: {
    ring: "ring-luminous/30",
    chip: "bg-luminous/15 text-luminous",
    sideText: "text-luminous",
  },
  brand: {
    ring: "ring-brand/30",
    chip: "bg-brand/15 text-brand",
    sideText: "text-brand",
  },
  clover: {
    ring: "ring-clover/30",
    chip: "bg-clover/15 text-clover",
    sideText: "text-clover",
  },
};

export default function LandingPage() {
  return (
    <main className="bg-background text-foreground min-h-screen w-full">
      <Navbar />

      {/* ─────────────────────────────── HERO ─────────────────────────────── */}
      <Section className="fade-bottom relative overflow-hidden pb-0 sm:pb-0 md:pb-0">
        <div className="max-w-container mx-auto flex flex-col gap-12 pt-16 sm:gap-24">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-10">
            <Badge variant="outline" className="animate-appear">
              <span className="text-muted-foreground">
                A career operating system for Asia&apos;s next generation
              </span>
              <a
                href="#candidate-vp"
                className="text-foreground flex items-center gap-1"
              >
                See how it works
                <ArrowRightIcon className="size-3" />
              </a>
            </Badge>

            <h1
              className={cn(
                "animate-appear text-foreground relative z-10 text-balance",
                "text-4xl font-semibold leading-tight sm:text-6xl sm:leading-tight md:text-7xl md:leading-[1.05]",
              )}
            >
              See where your career is heading.
            </h1>

            <p className="animate-appear text-muted-foreground relative z-10 max-w-[680px] text-pretty text-base font-medium opacity-0 [animation-delay:0.1s] sm:text-xl">
              Career OS reads your skills, projects, and goals to show your
              trajectory and what to do next. As you grow, the right employers
              can find you.
            </p>

            <div className="animate-appear relative z-10 flex flex-wrap justify-center gap-4 opacity-0 [animation-delay:0.3s]">
              <LinkButton
                href="/auth?mode=signup&role=candidate"
                variant="default"
                iconRight={<ArrowRight />}
              >
                Start your journey
              </LinkButton>
              <LinkButton
                href="/auth?mode=signup&role=employer"
                variant="glow"
                icon={<Briefcase />}
              >
                Find talent
              </LinkButton>
              {isJudgeDemoEnabled() && (
                <LinkButton href="/judge" variant="outline" icon={<Sparkles />}>
                  Judge Demo
                </LinkButton>
              )}
            </div>

            <div className="relative w-full pt-12">
              <Parallax speed={-60}>
                <MockupFrame
                  className="animate-appear opacity-0 [animation-delay:0.7s]"
                  size="small"
                >
                  <Mockup
                    type="responsive"
                    className="bg-background/90 w-full rounded-xl border-0"
                  >
                    <DashboardPreview />
                  </Mockup>
                </MockupFrame>
              </Parallax>
              <Glow
                variant="top"
                className="animate-appear-zoom opacity-0 [animation-delay:1s]"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ───────────────────── CANDIDATE VALUE PROPOSITION ───────────────────── */}
      <Section id="candidate-vp" className="relative">
        <div className="max-w-container mx-auto grid items-center gap-12 md:grid-cols-12">
          {/* Image - diverging-path person */}
          <div className="md:col-span-5">
            <Parallax speed={90}>
              <div className="glass-3 ring-brand/20 relative aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1">
                <Image
                  src="/candidate_new.png"
                  alt="A candidate standing at a fork in the path, choosing their direction with Career OS"
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  priority
                  className="object-cover scale-x-[-1]"
                />
                <div
                  aria-hidden
                  className="from-background/40 absolute inset-0 bg-linear-to-t to-transparent"
                />
              </div>
            </Parallax>
          </div>

          {/* Content */}
          <div className="md:col-span-7">
            <Badge variant="outline" className="mb-4">
              <span className="text-muted-foreground">For candidates</span>
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
              Your career, navigated{" "}
              <span className="text-brand">with intent</span>.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl text-pretty text-base sm:text-lg">
              Career OS treats every step you take (a skill learned, a project
              shipped, a chapter completed) as a signal. Those signals compound
              into a living picture of where you are and where you could go
              next.
            </p>

            <ul className="mt-8 flex flex-col gap-5">
              {CANDIDATE_BENEFITS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="bg-brand/15 text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-pretty text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <LinkButton
                href="/auth?mode=signup&role=candidate"
                variant="default"
                iconRight={<ArrowRight />}
              >
                Start your journey
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>

      {/* ─────────────── EXPERIENCED PROFESSIONALS (35+) ─────────────── */}
      <Section id="second-career" className="relative">
        <div className="max-w-container mx-auto grid items-center gap-12 md:grid-cols-12">
          {/* Content */}
          <div className="md:col-span-7">
            <Badge variant="outline" className="mb-4">
              <span className="text-muted-foreground">
                For experienced professionals 35+
              </span>
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
              Your second career does{" "}
              <span className="text-luminous">not start from zero</span>.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl text-pretty text-base sm:text-lg">
              Two decades of solved problems is capital, not baggage. Career
              OS reads your history as proof of capability and shows — with
              reasons, never black boxes — where it transfers next.
            </p>

            <ul className="mt-8 flex flex-col gap-5">
              {MID_CAREER_VALUE.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="bg-luminous/15 text-luminous flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-pretty text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Wildcard: the real engine, live, no login */}
          <div className="md:col-span-5">
            <LiveMatchDemo />
          </div>
        </div>
      </Section>

      {/* ───────────────────── EMPLOYER VALUE PROPOSITION ───────────────────── */}
      <Section id="employer-vp" className="bg-card/40 relative overflow-hidden">
        <div className="max-w-container mx-auto grid items-center gap-12 md:grid-cols-12">
          {/* Content */}
          <div className="md:order-1 md:col-span-7">
            <Badge variant="outline" className="mb-4">
              <span className="text-muted-foreground">For employers</span>
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
              Find talent already{" "}
              <span className="text-brand">on trajectory</span>.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl text-pretty text-base sm:text-lg">
              Career OS turns every candidate into a living portfolio of skills,
              evidence, and direction, so you reach out when the match is real
              rather than when keywords line up.
            </p>

            <ul className="mt-8 flex flex-col gap-5">
              {EMPLOYER_VALUE.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="bg-brand/15 text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-pretty text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton
                href="/auth?mode=signup&role=employer"
                variant="default"
                iconRight={<ArrowRight />}
              >
                Find talent
              </LinkButton>
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Research preview
              </span>
            </div>
          </div>

          {/* Image slot - Employer */}
          <div className="md:order-2 md:col-span-5">
            <Parallax speed={-80}>
              <div className="border-border/60 relative flex aspect-[4/5] w-full overflow-hidden rounded-3xl border">
                <Image
                  src="/employer_new.png"
                  alt="A hiring team reviewing candidates by their growth trajectory"
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover scale-x-[-1]"
                />
              </div>
            </Parallax>
          </div>
        </div>
      </Section>

      {/* ───────────────────── HOW CAREEROS CONNECTS BOTH SIDES ───────────────────── */}
      <Section id="connection" className="relative">
        <div className="max-w-container mx-auto flex flex-col gap-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Growth signals in. <span className="text-brand">Discovery</span>{" "}
              out.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-pretty text-base sm:text-lg">
              Career OS sits between candidates and employers as the translation
              layer. As candidates grow, the right employers see them, and the
              path from intent to opportunity gets shorter.
            </p>
          </div>

          {/* Three-step bridge */}
          <ol className="relative grid gap-4 md:grid-cols-3">
            {/* Connector line on desktop */}
            <div
              aria-hidden
              className="from-luminous via-brand to-clover absolute left-[16.66%] right-[16.66%] top-12 hidden h-px bg-linear-to-r md:block"
            />
            {CONNECTION_STEPS.map(({ side, icon: Icon, title, body, tint }, i) => {
              const t = CONNECTION_TINT[tint];
              return (
                <li
                  key={title}
                  className={cn(
                    "glass-3 relative flex flex-col items-center gap-4 rounded-2xl p-6 text-center ring-1",
                    t.ring,
                  )}
                >
                  <div
                    className={cn(
                      "flex size-14 items-center justify-center rounded-2xl",
                      t.chip,
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <p
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.18em]",
                      t.sideText,
                    )}
                  >
                    {i + 1} · {side}
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
                    {body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </Section>

      {/* ───────────────────── TRUST — HONEST METHODOLOGY ───────────────────── */}
      <Section className="bg-card/40 relative py-10 sm:py-12">
        <div className="max-w-container mx-auto grid gap-6 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="bg-luminous/15 text-luminous flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                <p className="text-muted-foreground mt-1 text-pretty text-xs leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ───────────────────── FEATURES CAROUSEL ───────────────────── */}
      <Section id="features" className="relative overflow-hidden">
        <div className="max-w-container mx-auto flex flex-col gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              A guided tour, scroll by scroll.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-pretty text-base">
              Swipe, scroll, or tap to move through what Career OS does, one
              feature at a time.
            </p>
          </div>

          <FeaturesCarousel />
        </div>
      </Section>

      {/* ───────────────────── FINAL DUAL CTA ───────────────────── */}
      <Section className="relative overflow-hidden">
        <div className="max-w-container mx-auto flex flex-col items-center gap-6 text-center">
          <Badge variant="outline">
            <span className="text-muted-foreground">
              Free during research preview
            </span>
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Two sides. One operating system.
          </h2>
          <p className="text-muted-foreground max-w-xl text-pretty text-base sm:text-lg">
            Whether you&apos;re mapping your next chapter or sourcing the next
            generation of talent, Career OS meets you on your side of the
            bridge.
          </p>
          <div className="grid w-full max-w-2xl gap-4 pt-2 sm:grid-cols-2">
            <div className="glass-3 ring-brand/20 flex flex-col items-center gap-3 rounded-2xl p-6 text-center ring-1">
              <span className="bg-brand/15 text-brand flex size-12 items-center justify-center rounded-2xl">
                <Compass className="size-6" />
              </span>
              <p className="text-sm font-semibold uppercase tracking-wider">
                Candidate
              </p>
              <LinkButton
                href="/auth?mode=signup&role=candidate"
                variant="default"
                iconRight={<ArrowRight />}
                className="w-full sm:w-auto"
              >
                Start your journey
              </LinkButton>
            </div>
            <div className="glass-3 ring-brand/20 flex flex-col items-center gap-3 rounded-2xl p-6 text-center ring-1">
              <span className="bg-brand/15 text-brand flex size-12 items-center justify-center rounded-2xl">
                <Briefcase className="size-6" />
              </span>
              <p className="text-sm font-semibold uppercase tracking-wider">
                Employer
              </p>
              <LinkButton
                href="/auth?mode=signup&role=employer"
                variant="glow"
                iconRight={<ArrowRight />}
                className="w-full sm:w-auto"
              >
                Find talent
              </LinkButton>
            </div>
          </div>
        </div>
        <Glow variant="below" />
      </Section>

      {/* ─────────────────────────────── FOOTER ─────────────────────────────── */}
      <footer className="line-t relative">
        <div className="max-w-container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-6">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-brand" />
            <span className="text-muted-foreground text-sm">Career OS</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Made for the Talentbank Career OS challenge
          </p>
        </div>
      </footer>
    </main>
  );
}
