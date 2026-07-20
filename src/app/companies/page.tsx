"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { InfoHint } from "@/components/ui/InfoHint";
import { Select } from "@/components/ui/Select";
import {
  FilterField,
  MicroLabel,
  QuickToggle,
  SignalPill,
} from "@/components/browse/BrowseControls";
import {
  presentCompany,
  type CompanyPresentation,
  type PartnerTier,
} from "@/lib/companies/presentation";
import type { CompanyMetrics } from "@/lib/services/companies.service";
import { cn } from "@/lib/utils";

type SortKey = "top" | "rating" | "roles" | "az";
const SORT_LABEL: Record<SortKey, string> = {
  top: "top rated",
  rating: "rating",
  roles: "open roles",
  az: "A–Z",
};

const TYPE_LABEL: Record<string, string> = {
  local: "Local",
  mnc: "Multinational",
  startup: "Startup",
  "public-sector": "Public sector",
};
const SIZE_LABEL: Record<string, string> = {
  startup: "Startup",
  midsize: "Mid-size",
  enterprise: "Enterprise",
};

const TIER_TONE: Record<PartnerTier, string> = {
  Platinum: "border-luminous/40 bg-luminous/10 text-luminous-soft",
  Gold: "border-yellow-400/40 bg-yellow-400/10 text-yellow-400",
  Silver: "border-border/30 bg-foreground/5 text-muted-foreground",
  Bronze: "border-border/30 bg-foreground/5 text-muted-foreground",
};

interface Row extends CompanyMetrics {
  p: CompanyPresentation;
}

/**
 * Browse employers — every company is verified & established. Streamlined
 * controls (one search/sort row + collapsible advanced filters + quick
 * toggles) over trust-signal-rich, breathing 2-column cards. Real
 * responsiveness metrics where applications exist; the richer signals
 * (tier/rating/tenure) are deterministically derived and demo-labelled.
 */
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyMetrics[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("top");
  const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState("");
  const [size, setSize] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [fastOnly, setFastOnly] = useState(false);
  const [gradsOnly, setGradsOnly] = useState(false);
  const [scaleOnly, setScaleOnly] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/companies", { cache: "no-store" });
      const json = await res.json();
      setCompanies(json.ok ? json.data.companies : []);
    })();
  }, []);

  const rows: Row[] | null = useMemo(
    () => companies?.map((c) => ({ ...c, p: presentCompany(c) })) ?? null,
    [companies],
  );

  const advancedCount = (type ? 1 : 0) + (size ? 1 : 0) + (minRating ? 1 : 0);

  const visible = useMemo(() => {
    if (!rows) return null;
    const q = query.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (type && r.type !== type) return false;
      if (size && r.size !== size) return false;
      if (minRating && r.p.rating < minRating) return false;
      if (fastOnly && !r.p.fastResponder) return false;
      if (gradsOnly && !r.p.graduatesChoice) return false;
      if (scaleOnly && !r.p.hiringAtScale) return false;
      return true;
    });
    const by: Record<SortKey, (a: Row, b: Row) => number> = {
      top: (a, b) => b.responseScore - a.responseScore || a.name.localeCompare(b.name),
      rating: (a, b) => b.p.rating - a.p.rating || a.name.localeCompare(b.name),
      roles: (a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name),
      az: (a, b) => a.name.localeCompare(b.name),
    };
    return [...out].sort(by[sort]);
  }, [rows, query, type, size, minRating, fastOnly, gradsOnly, scaleOnly, sort]);

  const types = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.type).filter(Boolean))].sort(),
    [rows],
  );
  const sizes = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.size).filter(Boolean))].sort(),
    [rows],
  );

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Browse employers
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Employers <span className="text-luminous">worth knowing</span>
        </h1>
        <InfoHint className="text-muted-foreground mt-1 block text-sm">
          Every company here is verified and established — filter to find your
          field. Responsiveness is real once applications flow; richer badges
          are illustrative demo signals.
        </InfoHint>

        {/* ── Streamlined controls ── */}
        <div className="mt-5 flex flex-col gap-2.5">
          {/* Row 1: search + sort + advanced toggle */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="border-border/15 bg-foreground/2 focus-within:border-luminous/60 flex min-h-11 flex-1 items-center gap-2 rounded-xl border px-3.5">
              <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company name"
                className="w-full bg-transparent py-2 text-sm outline-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <Select
                aria-label="Sort employers"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-11"
              >
                <option value="top">Top rated</option>
                <option value="rating">Highest rating</option>
                <option value="roles">Most open roles</option>
                <option value="az">A–Z</option>
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

          {/* Row 2: quick toggles (one tap, high value) */}
          <div className="flex flex-wrap gap-1.5">
            <QuickToggle active={fastOnly} onClick={() => setFastOnly((v) => !v)} icon={Zap}>
              Fast responders
            </QuickToggle>
            <QuickToggle active={gradsOnly} onClick={() => setGradsOnly((v) => !v)} icon={Trophy}>
              Graduates&apos; Choice
            </QuickToggle>
            <QuickToggle active={scaleOnly} onClick={() => setScaleOnly((v) => !v)} icon={Sparkles}>
              Hiring at scale
            </QuickToggle>
          </div>

          {/* Collapsible advanced filters (hidden on landing) */}
          {showFilters && (
            <div className="border-border/15 bg-foreground/2 grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-3">
              <FilterField label="Type">
                <Select aria-label="Company type" value={type} onChange={(e) => setType(e.target.value)} wrapperClassName="w-full">
                  <option value="">All types</option>
                  {types.map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Size">
                <Select aria-label="Company size" value={size} onChange={(e) => setSize(e.target.value)} wrapperClassName="w-full">
                  <option value="">Any size</option>
                  {sizes.map((s) => (
                    <option key={s} value={s}>{SIZE_LABEL[s] ?? s}</option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Min rating">
                <Select aria-label="Minimum rating" value={String(minRating)} onChange={(e) => setMinRating(Number(e.target.value))} wrapperClassName="w-full">
                  <option value="0">Any rating</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                </Select>
              </FilterField>
            </div>
          )}
        </div>

        {/* Count + clear */}
        {visible && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-semibold">{visible.length}</span>{" "}
              employer{visible.length === 1 ? "" : "s"} · sorted by {SORT_LABEL[sort]}
            </p>
            {(query || advancedCount || fastOnly || gradsOnly || scaleOnly) && (
              <button
                type="button"
                onClick={() => {
                  setQuery(""); setType(""); setSize(""); setMinRating(0);
                  setFastOnly(false); setGradsOnly(false); setScaleOnly(false);
                }}
                className="text-luminous text-xs font-medium hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* ── Cards ── */}
        {!visible ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : visible.length === 0 ? (
          <div className="glass-3 mt-6 rounded-2xl p-10 text-center">
            <Building2 className="text-muted-foreground/50 mx-auto size-8" aria-hidden />
            <p className="mt-3 text-sm font-medium">No employers match those filters.</p>
            <p className="text-muted-foreground mt-1 text-xs">Try widening your search or clearing a filter.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visible.map((r) => (
              <EmployerCard key={r.id} row={r} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────

function EmployerCard({ row }: { row: Row }) {
  const { p } = row;
  return (
    <Link
      href={`/companies/${row.id}`}
      className="glass-3 border-border/15 hover:border-luminous/40 group flex flex-col overflow-hidden rounded-2xl border transition-colors"
    >
      {/* Premium banner — Gold/Platinum only, so lower tiers stay quiet */}
      {p.premium && (
        <div
          className={cn(
            "flex items-center gap-1.5 px-5 py-1.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.16em]",
            p.tier === "Platinum"
              ? "from-luminous/20 text-luminous-soft bg-linear-to-r to-transparent"
              : "bg-linear-to-r from-yellow-400/20 to-transparent text-yellow-400",
          )}
        >
          <BadgeCheck className="size-3" aria-hidden /> Premier partner · {p.tier}
        </div>
      )}

      <div className="flex flex-col gap-4 p-5">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="border-border/15 from-luminous/20 to-luminous/5 text-luminous-soft flex size-13 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br text-lg font-bold"
          >
            {row.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate text-base font-semibold tracking-tight">{row.name}</h2>
              <BadgeCheck className="text-luminous size-4 shrink-0" aria-label="Verified" />
            </div>
            <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              {row.type && <span>{TYPE_LABEL[row.type] ?? row.type}</span>}
              {row.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden /> {row.location}
                </span>
              )}
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-medium">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
                {p.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <Users className="size-3.5" aria-hidden /> {p.followers} following
              </span>
            </p>
          </div>
          {!p.premium && (
            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-wider", TIER_TONE[p.tier])}>
              {p.tier}
            </span>
          )}
        </div>

        {/* What's special */}
        <div className="border-border/10 space-y-1.5 border-t pt-3">
          <MicroLabel>What&apos;s special</MicroLabel>
          <div className="flex flex-wrap gap-1.5">
            {p.whatsSpecial.map((s) => (
              <Chip key={s} tone="neutral">{s}</Chip>
            ))}
          </div>
        </div>

        {/* Verified signals — the trust row, deduped (name already shows ✓) */}
        <div className="space-y-1.5">
          <MicroLabel>Verified signals</MicroLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            <SignalPill icon={Zap} className="border-clover/30 bg-clover/10 text-clover-soft">
              Replies ~{p.repliesDays}d
            </SignalPill>
            <SignalPill icon={BadgeCheck} className={TIER_TONE[p.tier]}>
              {p.tier} · {p.partnerYears}y partner
            </SignalPill>
            {p.graduatesChoice && (
              <SignalPill icon={Trophy} className="border-border/20 bg-foreground/4 text-muted-foreground">
                Graduates&apos; Choice
              </SignalPill>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-border/10 mt-1 flex items-center justify-between gap-3 border-t pt-3.5">
          <span className="text-sm">
            <span className="text-foreground font-semibold">{row.jobCount}</span>{" "}
            <span className="text-muted-foreground">open role{row.jobCount === 1 ? "" : "s"}</span>
          </span>
          <span className="flex items-center gap-2">
            {row.demoMetrics && (
              <Badge variant="outline" className="text-[0.5625rem]">Demo data</Badge>
            )}
            <span className="bg-luminous group-hover:bg-luminous-soft inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-colors">
              View profile <ArrowUpRight className="size-3.5" aria-hidden />
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

