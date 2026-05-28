import Image from "next/image";
import {
  ArrowRight,
  ArrowRightIcon,
  Compass,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Search,
  Handshake,
  Activity,
  ShieldCheck,
  Telescope,
  Layers,
  Eye,
  Target,
} from "lucide-react";

import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { Glow } from "@/components/ui/Glow";
import { LayoutLines } from "@/components/ui/LayoutLines";
import { Mockup, MockupFrame } from "@/components/ui/Mockup";
import { Navbar } from "@/components/marketing/Navbar";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { FeaturesCarousel } from "@/components/marketing/FeaturesCarousel";
import { Parallax } from "@/components/marketing/Parallax";
import { cn } from "@/lib/utils";

const CANDIDATE_BENEFITS = [
  {
    icon: Telescope,
    title: "See your trajectory, not just your CV",
    body: "Career OS continuously reads your skills, learning, and goals to surface where you stand and where you're heading.",
  },
  {
    icon: Sparkles,
    title: "Grow with guidance, not guesswork",
    body: "Every skill you add ripples through your profile, opportunities, and recommendations — no black-box scoring.",
  },
  {
    icon: Eye,
    title: "Be seen by the right employers",
    body: "As your readiness rises, your Living Portfolio reaches employers who actually match your direction.",
  },
];

const EMPLOYER_VALUE = [
  {
    icon: Search,
    title: "Discover talent on trajectory",
    body: "Find candidates by where they're going — not only where they've been. Filter by compounding skills and readiness signals.",
  },
  {
    icon: Activity,
    title: "Real-time readiness signals",
    body: "Every Living Portfolio updates as candidates learn and ship. You see momentum, not a frozen snapshot.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent matches, no black boxes",
    body: "Every match is explainable — see the exact skills, evidence, and chapters behind a candidate's readiness score.",
  },
];

const CONNECTION_STEPS = [
  {
    side: "Candidate",
    tint: "luminous" as const,
    icon: Users,
    title: "Growth signals in",
    body: "Skills, projects, learning chapters and life goals flow into the Living Portfolio as the candidate grows.",
  },
  {
    side: "CareerOS",
    tint: "brand" as const,
    icon: Handshake,
    title: "The bridge",
    body: "CareerOS reads trajectory, compounding skills, and readiness — translating personal growth into discoverable shape.",
  },
  {
    side: "Employer",
    tint: "clover" as const,
    icon: Briefcase,
    title: "Discovery out",
    body: "Employers surface candidates whose direction matches the role — and reach out with full context, not just keywords.",
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
      <LayoutLines />
      <Navbar />

      {/* ─────────────────────────────── HERO ─────────────────────────────── */}
      <Section className="fade-bottom relative overflow-hidden pb-0 sm:pb-0 md:pb-0">
        <div className="max-w-container mx-auto flex flex-col gap-12 pt-16 sm:gap-24">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
            <Badge variant="outline" className="animate-appear">
              <span className="text-muted-foreground">
                A career operating system for Asia&apos;s next generation
              </span>
              <a
                href="#candidate-vp"
                className="flex items-center gap-1 text-foreground"
              >
                See how it works
                <ArrowRightIcon className="size-3" />
              </a>
            </Badge>

            <h1
              className={cn(
                "animate-appear relative z-10 inline-block bg-linear-to-r bg-clip-text text-transparent text-balance drop-shadow-2xl",
                "from-foreground to-foreground dark:to-muted-foreground",
                "text-4xl leading-tight font-semibold sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight",
              )}
            >
              Guiding you towards your future Career.
            </h1>

            <p className="animate-appear text-muted-foreground relative z-10 max-w-[740px] text-md font-medium text-balance opacity-0 [animation-delay:0.1s] sm:text-xl">
              Career OS is the candidate-centered intelligence platform that
              turns fragmented career decisions into a continuous, guided
              growth experience — and the bridge that lets the right employers
              find you as you grow.
            </p>

            <div className="animate-appear relative z-10 flex flex-wrap justify-center gap-4 opacity-0 [animation-delay:0.3s]">
              <LinkButton
                href="/onboarding"
                variant="default"
                iconRight={<ArrowRight />}
              >
                Start your journey
              </LinkButton>
              <LinkButton
                href="/employers/onboarding"
                variant="glow"
                icon={<Briefcase />}
              >
                Find Talent
              </LinkButton>
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
          {/* Image — diverging-path person */}
          <div className="md:col-span-5">
            <Parallax speed={90}>
              <div className="glass-3 ring-brand/20 relative aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1">
                <Image
                  src="/pathway.png"
                  alt="A candidate at a diverging path — Career OS helps them choose their direction"
                  fill
                  priority
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
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
            <p className="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
              Career OS treats every step you take — a skill learned, a project
              shipped, a chapter completed — as a signal. Those signals
              compound into a living picture of where you are and where you
              could go next.
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
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <LinkButton
                href="/onboarding"
                variant="default"
                iconRight={<ArrowRight />}
              >
                Start your journey
              </LinkButton>
            </div>
          </div>
        </div>
      </Section>

      {/* ───────────────────── EMPLOYER VALUE PROPOSITION ───────────────────── */}
      <Section id="employer-vp" className="relative overflow-hidden bg-card/40">
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
            <p className="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
              Career OS turns every candidate into a living portfolio of
              skills, evidence, and direction — so you reach out when the
              match is real, not when the keywords happen to align.
            </p>

            <ul className="mt-8 grid gap-5 sm:grid-cols-1">
              {EMPLOYER_VALUE.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="bg-brand/15 text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton
                href="/employers/onboarding"
                variant="default"
                iconRight={<ArrowRight />}
              >
                Find Talent
              </LinkButton>
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Employer workspace · research preview
              </span>
            </div>
          </div>

          {/* Image slot — placeholder until employer image is provided */}
          <div className="md:order-2 md:col-span-5">
            <Parallax speed={-80}>
            <div
              role="img"
              aria-label="Employer image placeholder"
              className="border-border/60 bg-background/40 relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed"
            >
              <div className="bg-brand/15 text-brand flex size-20 items-center justify-center rounded-3xl">
                <Briefcase className="size-9" />
              </div>
              <p className="text-foreground text-sm font-medium">
                Employer image
              </p>
              <p className="text-muted-foreground max-w-[220px] px-6 text-center text-[11px]">
                Drop the provided employer image into{" "}
                <code className="text-foreground/80 font-mono">
                  public/employer.png
                </code>{" "}
                and swap this placeholder.
              </p>
              <div
                aria-hidden
                className="from-brand/15 pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-radial to-transparent"
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
            <Badge variant="outline">
              <span className="text-muted-foreground">
                How CareerOS connects both sides
              </span>
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Growth signals in.{" "}
              <span className="text-brand">Discovery</span> out.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
              Career OS sits between candidates and employers as the
              translation layer. As candidates grow, the right employers see
              them — and the path between intent and opportunity gets
              shorter.
            </p>
          </div>

          {/* Three-step bridge */}
          <div className="relative grid gap-4 md:grid-cols-3">
            {/* Connector line on desktop */}
            <div
              aria-hidden
              className="from-luminous via-brand to-clover absolute left-[16.66%] right-[16.66%] top-12 hidden h-px bg-linear-to-r md:block"
            />
            {CONNECTION_STEPS.map(({ side, icon: Icon, title, body, tint }, i) => {
              const t = CONNECTION_TINT[tint];
              return (
                <article
                  key={title}
                  className={cn(
                    "glass-3 relative flex flex-col items-center gap-4 rounded-2xl p-6 text-center ring-1",
                    t.ring,
                  )}
                >
                  <span className="text-muted-foreground absolute left-4 top-3 font-mono text-[10px] uppercase tracking-wider">
                    Step {i + 1}
                  </span>
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
                    {side}
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {body}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Recap */}
          <div className="glass-3 mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-full px-6 py-3 text-sm">
            <span className="text-luminous flex items-center gap-1.5 font-medium">
              <Target className="size-4" />
              Candidate growth
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-brand flex items-center gap-1.5 font-medium">
              <Layers className="size-4" />
              CareerOS bridge
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-clover flex items-center gap-1.5 font-medium">
              <TrendingUp className="size-4" />
              Employer discovery
            </span>
          </div>
        </div>
      </Section>

      {/* ───────────────────── FEATURES CAROUSEL ───────────────────── */}
      <Section id="features" className="relative overflow-hidden">
        <div className="max-w-container mx-auto flex flex-col gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="outline">
              <span className="text-muted-foreground">Features</span>
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              A guided tour, scroll-by-scroll.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base">
              Swipe, scroll, or tap to move through what Career OS does — one
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
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
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
                href="/onboarding"
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
                href="/employers/onboarding"
                variant="glow"
                iconRight={<ArrowRight />}
                className="w-full sm:w-auto"
              >
                Find Talent
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
