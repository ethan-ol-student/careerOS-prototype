"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarPlus,
  Check,
  Loader2,
  Search,
  Sparkles,
  Telescope,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FutureAvatar, themeForField } from "@/components/future/FutureAvatar";
import { emitCarrie } from "@/components/carrie/carrieBus";
import { getFutureSelf, setFutureSelf } from "@/lib/futureSelf";
import { marketRowFor } from "@/lib/market/marketData";
import { normalizeSkill, type TargetJob } from "@/lib/jobs/data";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";
import { cn } from "@/lib/utils";
import { InfoHint } from "@/components/ui/InfoHint";

interface JobRow extends TargetJob {
  match: number;
  matched: string[];
  isDemo: boolean;
}
interface ClaimRow {
  name: string;
  tier: number;
}

const LATE = new Set(["mid-career", "senior-career", "executive"]);

// Global salary bounds for normalizing the income bar (RM, from marketData).
const INCOME_CEIL = 216000;

/** Deterministic 45–90 work-life score per field — no data source yet. */
const wlbScore = (field: string) =>
  45 + ([...field].reduce((s, c) => s + c.charCodeAt(0), 0) % 46);

/**
 * Future Self (students / young adults / early career): pick a target
 * career on the left, meet your future self in the spotlight, read the
 * gamified career stats on the right, then follow the actionable steps —
 * each schedulable into the Life Chapter Designer. Selecting a path makes
 * the dashboard + Skill Radar compare against it.
 */
export default function FutureSelfPage() {
  return (
    <AppShell>
      <FutureSelfContent />
    </AppShell>
  );
}

function FutureSelfContent() {
  const router = useRouter();
  const { data: ai, status: aiStatus } = useCandidatesAI();
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);

  // Later phases don't get this module — bounce once the phase is confirmed.
  const deny = aiStatus === "ready" && LATE.has(ai?.careerStage ?? "");
  useEffect(() => {
    if (deny) router.replace("/candidate/dashboard");
  }, [deny, router]);

  useEffect(() => {
    void (async () => {
      const [r1, r2] = await Promise.all([
        fetch("/api/jobs", { cache: "no-store" }),
        fetch("/api/me/skills", { cache: "no-store" }),
      ]);
      const [j1, j2] = await Promise.all([
        r1.json().catch(() => null),
        r2.json().catch(() => null),
      ]);
      const rows: JobRow[] = j1?.ok ? j1.data.jobs : [];
      setJobs(rows);
      setClaims(j2?.ok ? j2.data.claims : []);
      // Restore the saved path, else preselect the strongest match.
      const saved = getFutureSelf();
      const initial =
        (saved && rows.find((j) => j.id === saved.jobId)) || rows[0] || null;
      setSelectedId(initial?.id ?? null);
      if (saved && rows.some((j) => j.id === saved.jobId)) setChosenId(saved.jobId);
    })();
  }, []);

  const industries = useMemo(
    () => [...new Set((jobs ?? []).map((j) => j.field).filter(Boolean))].sort(),
    [jobs],
  );
  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (jobs ?? []).filter(
      (j) =>
        (!industry || j.field === industry) &&
        (!query || j.title.toLowerCase().includes(query)),
    );
  }, [jobs, q, industry]);

  const selected = (jobs ?? []).find((j) => j.id === selectedId) ?? null;
  const have = useMemo(
    () => new Set(claims.map((c) => normalizeSkill(c.name))),
    [claims],
  );

  const selectPath = () => {
    if (!selected) return;
    setFutureSelf({ jobId: selected.id, title: selected.title, field: selected.field });
    setChosenId(selected.id);
    emitCarrie(
      "success",
      `Path locked: ${selected.title}! Your dashboard and Skill Radar now aim at this future self.`,
    );
  };

  if (deny || jobs === null) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading Future
        Self…
      </div>
    );
  }

  return (
    <main className="max-w-container mx-auto flex w-full flex-col gap-4 px-4 pb-8 pt-3">
      <div className="shrink-0">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.18em]">
          <Telescope className="size-3.5" aria-hidden /> Future Self
        </p>
        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight sm:text-2xl">
          Meet who you&apos;re <span className="text-luminous">becoming</span>.
        </h1>
        <InfoHint>  
          <p className="text-muted-foreground mt-0.5 text-sm">
            Pick a destination career — see your future profile, the stats of the
            role, and the exact steps that close the gap.
          </p>
        </InfoHint>
      </div>

      {/* ── 3-column synchronous layout ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left — search, industry filters, career grid */}
        <section className="glass-3 flex flex-col rounded-2xl p-4 lg:col-span-4">
          <label className="border-border/15 bg-foreground/2 focus-within:border-luminous/60 flex min-h-10 items-center gap-2 rounded-xl border px-3">
            <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search careers…"
              className="w-full bg-transparent py-1.5 text-sm outline-none"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setIndustry("")}>
              <Chip tone={industry === "" ? "luminous" : "neutral"}>All</Chip>
            </button>
            {industries.map((f) => (
              <button key={f} type="button" onClick={() => setIndustry(f === industry ? "" : f)}>
                <Chip tone={industry === f ? "luminous" : "neutral"}>{f}</Chip>
              </button>
            ))}
          </div>

          <div className="mt-3 grid max-h-105 min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {visible.map((j) => {
              const active = j.id === selectedId;
              const isChosen = j.id === chosenId;
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => setSelectedId(j.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left backdrop-blur transition-all",
                    active
                      ? "border-luminous bg-luminous/10 shadow-[0_0_18px_rgba(77,122,255,0.25)]"
                      : "border-border/15 bg-foreground/2 hover:border-luminous/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-luminous/12 text-luminous-soft flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Briefcase className="size-4" aria-hidden />
                    </span>
                    {isChosen && (
                      <span className="text-clover inline-flex items-center gap-1 text-[0.625rem] font-semibold">
                        <BadgeCheck className="size-3.5" aria-hidden /> Your path
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-tight">{j.title}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-[0.6875rem]">{j.company}</p>
                  <span className="border-border/20 bg-foreground/4 text-muted-foreground mt-2 inline-block rounded-full border px-2 py-0.5 text-[0.5625rem] font-medium uppercase tracking-wide">
                    {j.field}
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && (
              <p className="text-muted-foreground col-span-full py-6 text-center text-sm">
                No careers match that search.
              </p>
            )}
          </div>

          {/* Footer controls */}
          <div className="border-border/10 mt-3 flex items-center gap-2 border-t pt-3">
            <Button
              type="button"
              onClick={selectPath}
              disabled={!selected || chosenId === selectedId}
            >
              <Check className="size-4" />
              {chosenId === selectedId ? "Path selected" : "Select path"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
        </section>

        {/* Center — future-self avatar spotlight */}
        <section className="glass-3 relative flex flex-col overflow-hidden rounded-2xl p-4 lg:col-span-4">
          {selected ? (
            <FutureAvatar key={selected.id} field={selected.field} title={selected.title} />
          ) : (
            <p className="text-muted-foreground m-auto text-sm">Pick a career to meet your future self.</p>
          )}
        </section>

        {/* Right — career stats & data panel */}
        <section className="glass-3 flex flex-col gap-4 rounded-2xl p-5 lg:col-span-4">
          {selected ? (
            <StatsPanel job={selected} have={have} />
          ) : (
            <p className="text-muted-foreground m-auto text-sm">Stats appear here.</p>
          )}
        </section>
      </div>

      {/* Bottom — actionable steps */}
      {selected && <StepsGrid job={selected} have={have} />}
    </main>
  );
}

// ── Right column: gamified career stats ─────────────────────────────

function StatBar({
  label,
  value,
  note,
  accent = "bg-luminous",
}: {
  label: string;
  value: number;
  note: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-muted-foreground text-[0.6875rem]">{note}</p>
      </div>
      <div className="bg-foreground/8 mt-1.5 h-2 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", accent)}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function StatsPanel({ job, have }: { job: JobRow; have: Set<string> }) {
  const row = marketRowFor(job.field);
  const income = Math.round((row.salaryMax / INCOME_CEIL) * 100);
  const demand = row.demandTrend === "up" ? 85 : row.demandTrend === "stable" ? 60 : 35;
  const wlb = wlbScore(job.field);
  const haveCount = job.requiredSkills.filter((s) => have.has(normalizeSkill(s))).length;
  const total = job.requiredSkills.length;
  const theme = themeForField(job.field, job.title);
  const tagline: Record<string, string> = {
    tech: "Build what the world runs on",
    engineering: "Make real things work",
    business: "Move markets, lead people",
    creative: "Shape how it looks & feels",
    science: "Discover what's next",
    default: "Chart your own course",
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{job.title}</h2>
        <p className="text-luminous-soft mt-0.5 text-sm font-medium">{tagline[theme]}</p>
        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
          <span>{job.company}</span>·<span>{job.location}</span>·
          <span className="text-luminous font-semibold">{job.match}% match today</span>
        </p>
      </div>

      <div className="space-y-4">
        <StatBar
          label="Income range"
          value={income}
          note={`${row.currency} ${Math.round(row.salaryMin / 1000)}k–${Math.round(row.salaryMax / 1000)}k/yr`}
        />
        <StatBar
          label="Market demand"
          value={demand}
          note={row.demandTrend === "up" ? "Hot right now" : row.demandTrend === "stable" ? "Steady" : "Cooling"}
          accent="bg-clover"
        />
        <StatBar label="Work-life balance" value={wlb} note={`${wlb}/100`} accent="bg-yellow-400" />
        {/* Split scale: skills you already have vs still needed */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
              Skills needed
            </p>
            <p className="text-muted-foreground text-[0.6875rem]">
              <span className="text-clover font-semibold">{haveCount}</span>/{total} on your radar
            </p>
          </div>
          <div className="bg-foreground/8 mt-1.5 flex h-2 overflow-hidden rounded-full">
            <div className="bg-clover h-full transition-[width] duration-700" style={{ width: `${(haveCount / Math.max(1, total)) * 100}%` }} />
            <div className="bg-luminous/40 h-full flex-1" />
          </div>
        </div>
      </div>

      {/* Projected future stack — required skills as your future trust tiers */}
      <div>
        <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
          Your future skill stack
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.requiredSkills.map((s) => (
            <Chip key={s} tone={have.has(normalizeSkill(s)) ? "clover" : "neutral"}>
              {have.has(normalizeSkill(s)) && <Check className="size-3" aria-hidden />}
              <span className="capitalize">{s}</span>
            </Chip>
          ))}
        </div>
        <p className="text-muted-foreground/70 mt-2 text-[0.6875rem]">
          Green = already on your radar. The rest become endorsed strengths as
          you follow the steps below.
        </p>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        {job.isDemo && <Badge variant="outline" className="text-[0.625rem]">Demo data</Badge>}
        <Link href={`/jobs/${job.id}`} className="text-luminous text-xs font-medium hover:underline">
          See the live role →
        </Link>
      </div>
    </>
  );
}

// ── Bottom: actionable steps grid ───────────────────────────────────

function StepsGrid({ job, have }: { job: JobRow; have: Set<string> }) {
  const missing = job.requiredSkills.filter((s) => !have.has(normalizeSkill(s)));
  const steps: { title: string; body: string; href: string; cta: string; calendar?: string }[] = [
    ...missing.slice(0, 2).map((s) => ({
      title: `Learn ${s}`,
      body: `A required skill for ${job.title} you haven't claimed yet — start small and log it.`,
      href: `/candidate/skills?focus=${encodeURIComponent(s)}`,
      cta: "Add the skill",
      calendar: `Learn ${s}`,
    })),
    {
      title: "Prove it with evidence",
      body: "Back one claimed skill with a project link or a concrete result — trust tier 2.",
      href: "/candidate/skills",
      cta: "Add evidence",
      calendar: "Add skill evidence",
    },
    {
      title: "Ship a portfolio piece",
      body: `One ${job.field.toLowerCase()} project in your Living Portfolio moves every score.`,
      href: "/candidate/portfolio",
      cta: "Open portfolio",
      calendar: `Build a ${job.title} project`,
    },
  ].slice(0, 4);

  return (
    <section className="glass-3 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          <Sparkles className="size-3.5" aria-hidden /> Steps toward this future
        </p>
        <p className="text-muted-foreground text-xs">
          Each step raises your real readiness — schedule it, do it, watch the gap close.
        </p>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.title} className="border-border/15 bg-foreground/2 flex flex-col rounded-xl border p-3.5 backdrop-blur">
            <p className="text-sm font-semibold capitalize leading-tight">{s.title}</p>
            <p className="text-muted-foreground mt-1 flex-1 text-xs">{s.body}</p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={s.href}
                className="bg-luminous/12 text-luminous-soft hover:bg-luminous/20 inline-flex items-center rounded-lg px-2.5 py-1.5 text-[0.6875rem] font-medium transition-colors"
              >
                {s.cta}
              </Link>
              {s.calendar && (
                <Link
                  href={`/candidate/chapters?add=${encodeURIComponent(s.calendar)}`}
                  title="Add to calendar"
                  className="border-border/20 text-muted-foreground hover:border-luminous/40 hover:text-luminous inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[0.6875rem] transition-colors"
                >
                  <CalendarPlus className="size-3.5" aria-hidden /> Calendar
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
