"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  Factory,
  Laptop,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  getFairPayLabel,
  marketRowFor,
  type DemandTrend,
  type FairPayVerdict,
  type MarketRow,
} from "@/lib/market/marketData";
import { cn } from "@/lib/utils";

/**
 * Market Value / Demand panel (Feature 5.7) — indicative demand trend,
 * salary range (RM), and a client-side fair-pay slider check for one role.
 *
 * DATA CONTRACT: everything renders from a `MarketRow`, resolved by the
 * pure `marketRowFor(field)` lookup. When a real market API lands, wrap
 * that call in an async hook here — nothing else changes. The slider
 * value is compared purely client-side (`getFairPayLabel`) and NEVER
 * sent to a server. Mount with `key={field}` where the role can change
 * so the offer state resets naturally.
 */

const OFFER_MIN = 5000;
const OFFER_MAX = 1000000;

const TREND_META: Record<
  DemandTrend,
  { icon: typeof TrendingUp; label: string; cls: string }
> = {
  up: { icon: TrendingUp, label: "Trending up", cls: "text-clover" },
  stable: { icon: Minus, label: "Stable demand", cls: "text-muted-foreground" },
  down: { icon: TrendingDown, label: "Trending down", cls: "text-destructive" },
};

const VERDICT_CLASSES: Record<FairPayVerdict["tone"], string> = {
  destructive: "bg-destructive/10 text-destructive border-destructive/40",
  clover: "bg-clover/10 text-clover-soft border-clover/30",
  luminous: "bg-luminous/10 text-luminous-soft border-luminous/30",
};

/** Short industry context per field, for the sector badge next to "Demo data". */
const SECTOR: Record<string, { label: string; icon: typeof Laptop }> = {
  "Technology and software": { label: "Tech Sector", icon: Laptop },
  "Engineering and manufacturing": { label: "Engineering Sector", icon: Factory },
};

const round1k = (n: number) => Math.round(n / 1000) * 1000;
const fmtK = (n: number) => `${Math.round(n / 1000)}k`;

/** Split the indicative range into three experience tiers. Fractions are tuned
 *  so the flagship Tech range (60k–216k) lands on the mentor's spec
 *  (60–95k / 96–150k / 151–216k) and degrade proportionally for other fields. */
function salaryTiers(row: MarketRow) {
  const span = row.salaryMax - row.salaryMin;
  const entryMax = round1k(row.salaryMin + span * 0.224);
  const midMax = round1k(row.salaryMin + span * 0.577);
  return [
    { label: "Entry-Level", years: "0–2 Yrs", min: row.salaryMin, max: entryMax },
    { label: "Mid-Career", years: "3–5 Yrs", min: entryMax + 1000, max: midMax },
    { label: "Senior", years: "5+ Yrs", min: midMax + 1000, max: row.salaryMax },
  ];
}

export function MarketValuePanel({
  field,
  roleTitle,
}: {
  field: string;
  roleTitle: string;
}) {
  const data = marketRowFor(field);
  const [offer, setOffer] = useState(
    Math.round((data.salaryMin + data.salaryMax) / 2),
  );
  const verdict = getFairPayLabel(offer, data);

  const trend = TREND_META[data.demandTrend] ?? TREND_META.stable;
  const sector = SECTOR[data.field] ?? { label: data.field, icon: Building2 };
  const tiers = salaryTiers(data);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
          Market value — {roleTitle}
        </h3>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">Demo data</Badge>
          <span className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
            <sector.icon className="size-3" aria-hidden />
            {sector.label}
          </span>
        </div>
      </div>

      {/* Salary by experience tier — replaces the single wide range */}
      <div className="grid grid-cols-3 gap-2">
        {tiers.map((t) => (
          <div
            key={t.label}
            className="border-border/15 bg-foreground/2 rounded-lg border px-2.5 py-2"
          >
            <div className="text-luminous/80 flex items-center gap-1">
              <BarChart3 className="size-3" aria-hidden />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wide">
                {t.years}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">{t.label}</p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight">
              {data.currency} {fmtK(t.min)}
              <span className="text-muted-foreground/60">–</span>
              {fmtK(t.max)}
            </p>
          </div>
        ))}
      </div>

      {/* Trend trajectory only — sector + period now live in the badge/source */}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <trend.icon className={cn("size-3.5", trend.cls)} aria-hidden />
        <span className={cn("font-medium", trend.cls)}>{trend.label}</span>
        <span>· {data.salaryGrowth}</span>
      </p>

      {/* Fair-pay check — client-side only */}
      <div>
        <label
          htmlFor={`fair-pay-offer-${field}`}
          className="text-sm font-medium"
        >
          Check an offer
        </label>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{data.currency}</span>
          <input
            id={`fair-pay-offer-${field}`}
            type="number"
            inputMode="numeric"
            min={OFFER_MIN}
            max={OFFER_MAX}
            step={1000}
            value={offer}
            onChange={(e) => setOffer(Number(e.target.value))}
            aria-label="Salary offer to check"
            className="bg-foreground/2 border-border/15 focus:border-luminous min-h-9 w-full rounded-lg border px-3 py-2 text-sm tabular-nums outline-none"
          />
        </div>
        <p className="mt-2 text-sm">
          <span
            className={cn(
              "mr-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
              VERDICT_CLASSES[verdict.tone],
            )}
          >
            {verdict.label}
          </span>
          <span className="text-muted-foreground text-xs">{verdict.detail}</span>
        </p>
      </div>

      <p className="text-muted-foreground/60 text-[11px]">
        Source: {data.dataSource} · Updated {data.lastUpdated}
      </p>
    </div>
  );
}
