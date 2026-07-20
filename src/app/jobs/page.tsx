"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  CheckCircle2,
  Loader2,
  MapPin,
  Minus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { InfoHint } from "@/components/ui/InfoHint";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { Select } from "@/components/ui/Select";
import {
  FilterField,
  MicroLabel,
  QuickToggle,
  SignalPill,
} from "@/components/browse/BrowseControls";
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
  matched: string[];
  isDemo: boolean;
  match: number;
  personalized: boolean;
}
interface Demand {
  field: string;
  postingCount: number;
}

type SortKey = "match" | "az" | "company";
const SORT_LABEL: Record<SortKey, string> = {
  match: "best match",
  az: "role A–Z",
  company: "company",
};

/** Match tier drives the card banner — strong matches earn the highlight. */
function matchTier(m: number): { label: string; cls: string } | null {
  if (m >= 75) return { label: "Strong match", cls: "from-clover/20 text-clover-soft" };
  if (m >= 55) return { label: "Good match", cls: "from-luminous/20 text-luminous-soft" };
  return null;
}

/**
 * Roles catalogue — a streamlined filter ecosystem (one search/sort row +
 * field quick-pills + collapsible advanced filters) over trust-signal-rich,
 * breathing 2-column role cards. Search + field filter hit the DB; match %,
 * skill overlap, and industry trend explain every card.
 */
export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [demand, setDemand] = useState<Demand | null>(null);
  const [q, setQ] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState<SortKey>("match");
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState("");
  const [strongOnly, setStrongOnly] = useState(false);
  const [personalizedOnly, setPersonalizedOnly] = useState(false);

  // Debounced fetch on search/field change (field also pulls its demand).
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
  const locations = useMemo(
    () => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort(),
    [jobs],
  );
  const advancedCount = (location ? 1 : 0);

  const visible = useMemo(() => {
    const out = jobs.filter((j) => {
      if (location && j.location !== location) return false;
      if (strongOnly && j.match < 75) return false;
      if (personalizedOnly && !j.personalized) return false;
      return true;
    });
    const by: Record<SortKey, (a: JobRow, b: JobRow) => number> = {
      match: (a, b) => b.match - a.match || a.title.localeCompare(b.title),
      az: (a, b) => a.title.localeCompare(b.title),
      company: (a, b) => a.company.localeCompare(b.company) || b.match - a.match,
    };
    return [...out].sort(by[sort]);
  }, [jobs, location, strongOnly, personalizedOnly, sort]);

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Browse roles
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Roles <span className="text-luminous">worth your time</span>
        </h1>
        <InfoHint className="text-muted-foreground mt-1 block text-sm">
          Every match is explainable — computed from your validated skills, not
          a black box. Filter to find your field, then open any role for the
          full breakdown.
        </InfoHint>

        {/* ── Streamlined controls ── */}
        <div className="mt-5 flex flex-col gap-2.5">
          {/* Row 1: search + sort + advanced toggle */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="border-border/15 bg-foreground/2 focus-within:border-luminous/60 flex min-h-11 flex-1 items-center gap-2 rounded-xl border px-3.5">
              <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search roles or companies"
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <Select
                aria-label="Sort roles"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-11"
              >
                <option value="match">Best match</option>
                <option value="az">Role A–Z</option>
                <option value="company">Company</option>
              </Select>
              <button
                type="button"
                aria-expanded={showFilters}
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                  showFilters || advancedCount
                    ? "border-luminous/40 bg-luminous/10 text-luminous-soft"
                    : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Filters
                {advancedCount > 0 && (
                  <span className="bg-luminous/20 text-luminous-soft ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold">
                    {advancedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: field quick-pills (drive the DB fetch + trend) */}
          <div className="flex flex-wrap gap-1.5">
            <QuickToggle active={field === ""} onClick={() => setField("")} icon={Briefcase}>
              All fields
            </QuickToggle>
            {fields.map((f) => (
              <QuickToggle key={f} active={field === f} onClick={() => setField(f === field ? "" : f)} icon={Sparkles}>
                {f}
              </QuickToggle>
            ))}
          </div>

          {/* Collapsible advanced filters */}
          {showFilters && (
            <div className="border-border/15 bg-foreground/2 grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-3">
              <FilterField label="Location">
                <Select aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value)} wrapperClassName="w-full">
                  <option value="">Any location</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </FilterField>
              <div className="flex items-end">
                <QuickToggle active={strongOnly} onClick={() => setStrongOnly((v) => !v)} icon={Star}>
                  Strong matches (75%+)
                </QuickToggle>
              </div>
              <div className="flex items-end">
                <QuickToggle active={personalizedOnly} onClick={() => setPersonalizedOnly((v) => !v)} icon={Sparkles}>
                  Personalized only
                </QuickToggle>
              </div>
            </div>
          )}

          {/* Industry trend — appears when a field is selected */}
          {field && <IndustryTrendPanel field={field} demand={demand} />}
        </div>

        {/* Count + scoring note + clear */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-semibold">{visible.length}</span>{" "}
            role{visible.length === 1 ? "" : "s"} · sorted by {SORT_LABEL[sort]}
          </p>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium",
                personalized
                  ? "border-clover/30 bg-clover/10 text-clover-soft"
                  : "border-border/20 bg-foreground/4 text-muted-foreground",
              )}
              title={personalized ? "Matches use your validated skills" : "Add skills to personalize your matches"}
            >
              <Sparkles className="size-3" aria-hidden />
              {personalized ? "Personalized" : "Curated baseline"}
            </span>
            {(q || field || advancedCount || strongOnly || personalizedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQ(""); setField(""); setLocation("");
                  setStrongOnly(false); setPersonalizedOnly(false);
                }}
                className="text-luminous text-xs font-medium hover:underline"
              >
                Clear all
              </button>
            )}
          </span>
        </div>

        {/* ── Cards ── */}
        {loading ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading roles…
          </div>
        ) : visible.length === 0 ? (
          <div className="glass-3 mt-6 rounded-2xl p-10 text-center">
            <Briefcase className="text-muted-foreground/50 mx-auto size-8" aria-hidden />
            <p className="mt-3 text-sm font-medium">No roles match those filters.</p>
            <p className="text-muted-foreground mt-1 text-xs">Try widening your search or clearing a filter.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visible.map((job) => (
              <RoleCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

// ── Role card ──────────────────────────────────────────────────────

function RoleCard({ job }: { job: JobRow }) {
  const tier = matchTier(job.match);
  const matched = new Set(job.matched);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="glass-3 border-border/15 hover:border-luminous/40 group flex flex-col overflow-hidden rounded-2xl border transition-colors"
    >
      {/* Match banner — strong/good matches only, so weak ones stay quiet */}
      {tier && (
        <div className={cn("flex items-center gap-1.5 bg-linear-to-r to-transparent px-5 py-1.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.16em]", tier.cls)}>
          <Award className="size-3" aria-hidden /> {tier.label} · {job.match}%
        </div>
      )}

      <div className="flex flex-col gap-4 p-5">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="border-border/15 from-luminous/20 to-luminous/5 text-luminous-soft flex size-13 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br text-lg font-bold"
          >
            {job.company.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold tracking-tight">{job.title}</h2>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
              <Briefcase className="size-3 shrink-0" aria-hidden /> {job.company}
            </p>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden /> {job.location}
                </span>
              )}
              {job.duration && <span>{job.duration}</span>}
            </p>
          </div>
          {!tier && (
            <span className="border-border/20 bg-foreground/5 text-muted-foreground shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-wider">
              {job.match}%
            </span>
          )}
        </div>

        {/* What you'd need — required skills, matched ones highlighted */}
        <div className="border-border/10 space-y-1.5 border-t pt-3">
          <MicroLabel>What you&apos;d need</MicroLabel>
          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills.slice(0, 5).map((s) => {
              const have = matched.has(s);
              return (
                <Chip key={s} tone={have ? "clover" : "neutral"}>
                  {have && <CheckCircle2 className="size-3" aria-hidden />}
                  {s}
                </Chip>
              );
            })}
            {job.requiredSkills.length > 5 && (
              <span className="text-muted-foreground self-center text-[0.6875rem]">
                +{job.requiredSkills.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Signals */}
        <div className="space-y-1.5">
          <MicroLabel>Signals</MicroLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            <SignalPill
              icon={Sparkles}
              className={job.personalized ? "border-clover/30 bg-clover/10 text-clover-soft" : "border-border/20 bg-foreground/4 text-muted-foreground"}
            >
              {job.personalized ? "Personalized" : "Baseline"}
            </SignalPill>
            <SignalPill icon={CheckCircle2} className="border-luminous/30 bg-luminous/10 text-luminous-soft">
              {matched.size}/{job.requiredSkills.length} skills
            </SignalPill>
            {job.field && (
              <SignalPill icon={Briefcase} className="border-border/20 bg-foreground/4 text-muted-foreground">
                {job.field}
              </SignalPill>
            )}
          </div>
        </div>

        {/* Footer — match bar + CTA */}
        <div className="border-border/10 mt-1 flex items-center gap-3 border-t pt-3.5">
          <div className="min-w-0 flex-1">
            <ScoreBar
              label={job.personalized ? "Your match" : "Base match"}
              value={job.match}
              size="sm"
            />
          </div>
          {job.isDemo && (
            <Badge variant="outline" className="shrink-0 text-[0.5625rem]">Demo</Badge>
          )}
          <span className="bg-luminous group-hover:bg-luminous-soft inline-flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors">
            View role <ArrowUpRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Industry trend ─────────────────────────────────────────────────

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
    <div className="glass-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-3">
      <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
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
      <Badge variant="outline" className="text-[0.625rem]">Demo data</Badge>
      <InfoHint className="text-muted-foreground/60 w-full text-[0.625rem]">
        {row.dataSource} · as of {row.demandPeriod}
      </InfoHint>
    </div>
  );
}
