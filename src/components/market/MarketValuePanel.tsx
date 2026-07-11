"use client";

import { useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
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

const fmtMoney = (row: MarketRow, n: number) =>
  `${row.currency} ${n.toLocaleString("en-US")}`;

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
          Market value — {roleTitle}
        </h3>
        <Badge variant="outline">Demo data</Badge>
      </div>

      {/* Primary figure — the indicative range leads the panel */}
      <div>
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">
          {fmtMoney(data, data.salaryMin)}
          <span className="text-muted-foreground/70 mx-1 font-normal">–</span>
          {fmtMoney(data, data.salaryMax)}
        </p>
        <p className="text-muted-foreground/80 mt-0.5 font-mono text-[11px] uppercase tracking-wider">
          Indicative range · per year
        </p>
      </div>

      {/* Secondary: trend + growth, deliberately quieter */}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <trend.icon className={cn("size-3.5", trend.cls)} aria-hidden />
        <span className={cn("font-medium", trend.cls)}>{trend.label}</span>
        <span>
          · {data.salaryGrowth} · {data.demandPeriod} · {data.field}
        </span>
      </p>
      <div className="bg-foreground/8 h-1.5 overflow-hidden rounded-full">
        <div className="bg-luminous/50 h-full w-full rounded-full" />
      </div>

      {/* Fair-pay check — client-side only, live as the slider moves */}
      <div>
        <div className="flex items-center justify-between text-sm">
          <label htmlFor={`fair-pay-offer-${field}`} className="font-medium">
            Check an offer
          </label>
          <span className="text-luminous font-semibold">
            {fmtMoney(data, offer)}
          </span>
        </div>
        <input
          id={`fair-pay-offer-${field}`}
          type="range"
          min={OFFER_MIN}
          max={OFFER_MAX}
          step={1000}
          value={offer}
          onChange={(e) => setOffer(Number(e.target.value))}
          aria-label="Salary offer to check"
          className="accent-luminous mt-1 w-full"
        />
        <p className="mt-1 text-sm">
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
