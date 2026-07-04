"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Landmark,
  Briefcase,
  Users,
  Waves,
  Clock,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";

/**
 * Career Second Act Lab (Feature 14 stretch) — a STATIC explorer for the
 * senior/executive phases: four honest second-act pathways plus the
 * "Never Too Late Map". Deliberately engine-free curated content (the
 * deep, engine-driven Second Act simulator is post-deploy scope).
 */
const PATHWAYS = [
  {
    icon: Landmark,
    title: "Advisory & board seats",
    body: "Convert operating experience into governance influence. Usually part-time, reputation-led, and compounding.",
    fit: "Deep domain credibility · strong network",
    tradeoff: "Slow to land the first seat — warm intros matter more than applications.",
  },
  {
    icon: Briefcase,
    title: "Consulting & fractional roles",
    body: "Sell the problems you've already solved — fractional leadership, project engagements, retainers.",
    fit: "A nameable specialty · comfort with variable income",
    tradeoff: "You become the pipeline: selling is now part of the job.",
  },
  {
    icon: Users,
    title: "Mentorship-first chapter",
    body: "Multiply through people — coaching, teaching, structured mentorship inside or outside your industry.",
    fit: "Energy from others' growth · patience for slower feedback loops",
    tradeoff: "Lower ceiling on income; the reward compounds in others.",
  },
  {
    icon: Waves,
    title: "Lower-stress downshift",
    body: "Same craft, smaller blast radius: an IC role, a smaller company, or reduced hours — on purpose.",
    fit: "Life factors first · identity not tied to title",
    tradeoff: "Requires renegotiating self-worth away from scope and headcount.",
  },
];

const NEVER_TOO_LATE = [
  { age: "40s", note: "Most second acts start here — transferable skills at their peak, runway still long." },
  { age: "50s", note: "Advisory, consulting, and teaching paths open widest: credibility is the asset." },
  { age: "60s+", note: "Portfolio careers — a seat, a class, a project — beat a single role for most." },
];

export default function SecondActPage() {
  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <Link
          href="/candidate/dashboard"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <p className="text-luminous mt-6 text-xs font-semibold uppercase tracking-[0.18em]">
          Career Second Act Lab
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Four honest ways to spend your experience
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          A second act is a reallocation, not a restart. Each pathway below
          names who it fits and what it costs — pick by trade-off, not by
          fear.
        </p>

        <Grid12 className="mt-8">
          {PATHWAYS.map((p) => (
            <Col key={p.title} span={12} md={6}>
              <section className="glass-3 h-full rounded-2xl p-6">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="bg-luminous/15 text-luminous flex size-9 items-center justify-center rounded-lg">
                    <p.icon className="size-4" />
                  </span>
                  {p.title}
                </p>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {p.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Chip tone="clover">Fits: {p.fit}</Chip>
                </div>
                <p className="text-muted-foreground mt-3 text-xs italic">
                  Trade-off: {p.tradeoff}
                </p>
              </section>
            </Col>
          ))}

          {/* Never Too Late Map */}
          <Col span={12}>
            <section className="glass-3 rounded-2xl p-6">
              <p className="flex items-center gap-2 font-semibold">
                <Clock className="text-clover size-5" />
                The Never Too Late Map
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {NEVER_TOO_LATE.map((s) => (
                  <div
                    key={s.age}
                    className="border-border/40 bg-card/40 rounded-xl border p-4"
                  >
                    <p className="text-clover text-lg font-semibold">{s.age}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {s.note}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground/70 mt-4 text-xs italic">
                Curated guidance, not a promise — your Career Health home has
                the numbers for your specific situation.
              </p>
            </section>
          </Col>
        </Grid12>
      </main>
    </AppShell>
  );
}
