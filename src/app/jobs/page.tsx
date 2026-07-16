"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  MapPin,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { marketRowFor, type DemandTrend } from "@/lib/market/marketData";
import { cn } from "@/lib/utils";

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  field: string;
  requiredSkills: string[];
  isDemo: boolean;
  match: number;
  personalized: boolean;
}
interface Demand {
  field: string;
  postingCount: number;
}

/**
 * Jobs catalogue: fixed-viewport frame (header/search/filters stay anchored,
 * the card grid scrolls in its own zone). Search + field filter over the DB,
 * an explainable match badge per job, and an industry-trend readout when a
 * field is selected ("is this field hot right now?").
 */
export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [demand, setDemand] = useState<Demand | null>(null);
  const [q, setQ] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(true);

  // Debounced fetch on search/filter change.
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (field) params.set("field", field);
      const res = await fetch(`/api/jobs?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setJobs(json.data.jobs);
        setDemand(json.data.demand ?? null);
        if (json.data.fields.length) setFields(json.data.fields);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, field]);

  const personalized = jobs.some((j) => j.personalized);

  return (
    <AppShell>
      <main className="max-w-container mx-auto flex h-full w-full flex-col gap-4 px-4 pb-3 pt-3 lg:min-h-0">
        {/* Anchored header + controls (never scroll) */}
        <div className="shrink-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
              <Briefcase className="text-luminous size-5" />
              Open <span className="text-luminous">roles</span>
            </h1>
            <p className="text-muted-foreground text-xs">
              {jobs.length} in the catalogue · click any role for the full match breakdown
            </p>
          </div>

          {/* 2-tile stat strip — self-explanatory captions, no redundant "top match" */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="glass-4 rounded-xl p-3 sm:p-4">
              <p className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
                <Briefcase className="text-luminous size-3" aria-hidden /> Open roles
              </p>
              <p className="text-luminous mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                {jobs.length || "–"}
              </p>
            </div>
            <div className="glass-4 rounded-xl p-3 sm:p-4">
              <p className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
                <Sparkles className="text-luminous size-3" aria-hidden /> Scoring
              </p>
              <p className="text-luminous mt-1 text-lg font-bold tracking-tight sm:text-xl">
                {personalized ? "Personalized" : "Curated baseline"}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {personalized
                  ? "from your validated skills"
                  : "sign in + add skills to personalize"}
              </p>
            </div>
          </div>

          {/* Search + field filter */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="border-border/15 bg-foreground/2 focus-within:border-luminous/60 flex min-h-11 flex-1 items-center gap-2 rounded-lg border px-3">
              <Search className="text-muted-foreground size-4 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search titles or companies…"
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setField("")}>
                <Chip tone={field === "" ? "luminous" : "neutral"}>All fields</Chip>
              </button>
              {fields.map((f) => (
                <button key={f} type="button" onClick={() => setField(f === field ? "" : f)}>
                  <Chip tone={field === f ? "luminous" : "neutral"}>{f}</Chip>
                </button>
              ))}
            </div>
          </div>

          {/* Industry trend — appears when a field is selected */}
          {field && <IndustryTrendPanel field={field} demand={demand} />}
        </div>

        {/* Scroll zone: only the card grid moves */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-muted-foreground mt-8 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Loading jobs…
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-muted-foreground mt-8">No jobs match that search.</p>
          ) : (
            <Grid12 className="pb-4">
              {jobs.map((job) => (
                <Col key={job.id} span={12} md={6} lg={4}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="glass-3 hover:border-luminous/40 border-border/15 flex h-full flex-col rounded-2xl border p-6 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold tracking-tight">
                          {job.title}
                        </h2>
                        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-sm">
                          <Briefcase className="size-3.5 shrink-0" />
                          {job.company}
                        </p>
                      </div>
                      {job.isDemo && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          Demo data
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                      <MapPin className="size-3.5" />
                      {job.location} · {job.duration}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.requiredSkills.slice(0, 4).map((skill) => (
                        <Chip key={skill}>{skill}</Chip>
                      ))}
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="border-border/15 bg-linear-to-b from-foreground/5 to-foreground/2 rounded-lg border px-3 py-2.5">
                        <ScoreBar
                          label={job.personalized ? "Your match" : "Base match"}
                          value={job.match}
                          size="sm"
                        />
                      </div>
                    </div>
                  </Link>
                </Col>
              ))}
            </Grid12>
          )}
        </div>
      </main>
    </AppShell>
  );
}

const TREND_META: Record<
  DemandTrend,
  { icon: typeof TrendingUp; label: string; cls: string }
> = {
  up: { icon: TrendingUp, label: "Hot right now", cls: "text-clover" },
  stable: { icon: Minus, label: "Steady", cls: "text-muted-foreground" },
  down: { icon: TrendingDown, label: "Cooling", cls: "text-yellow-400" },
};
const k = (n: number, currency: string) => `${currency}${Math.round(n / 1000)}k`;

/** "Is this field hot right now?" — curated trend + real posting volume. */
function IndustryTrendPanel({ field, demand }: { field: string; demand: Demand | null }) {
  const row = marketRowFor(field);
  const trend = TREND_META[row.demandTrend] ?? TREND_META.stable;
  return (
    <div className="glass-4 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-3">
      <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-wider">
        {field}
      </p>
      <span className={cn("flex items-center gap-1.5 text-sm font-semibold", trend.cls)}>
        <trend.icon className="size-4" aria-hidden />
        {trend.label}
      </span>
      <span className="text-muted-foreground text-xs">
        {k(row.salaryMin, row.currency)}–{k(row.salaryMax, row.currency)}/yr
      </span>
      <Chip tone="clover">{row.salaryGrowth} demand</Chip>
      {demand && (
        <span className="text-muted-foreground text-xs">
          {demand.postingCount.toLocaleString()} live postings
        </span>
      )}
      <Badge variant="outline" className="text-[10px]">Demo data</Badge>
      <span className="text-muted-foreground/60 w-full text-[10px]">
        {row.dataSource} · as of {row.demandPeriod}
      </span>
    </div>
  );
}
