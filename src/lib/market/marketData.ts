/**
 * Market Value / Demand data (Feature 5.7) — a curated, indicative DEMO
 * dataset, always labelled as such in the UI.
 *
 * DATA CONTRACT (for the future real integration): rows are keyed by
 * `Job.field` (stable on every job; ids are seed-specific), and the ONLY
 * consumer-facing surface is the `MarketRow` shape + the two pure
 * functions below. Swap `MARKET_DATA` for an API response inside
 * `useMarketData` (src/lib/hooks/useMarketData.ts) and nothing else
 * changes. `DemandTrend` is an open string union — extend it (e.g.
 * "strong-up") and add a `TREND_META` entry in MarketValuePanel; unknown
 * values fall back to the "stable" rendering.
 */

export type DemandTrend = "up" | "down" | "stable";

export interface MarketRow {
  /** Join key — matches `Job.field`. */
  field: string;
  demandTrend: DemandTrend;
  /** Human period label for the trend, e.g. "June 2026". */
  demandPeriod: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  salaryGrowth: string;
  dataSource: string;
  lastUpdated: string; // YYYY-MM-DD
  isDemo: true;
}

// All rows are annual figures in Ringgit Malaysia (RM).
export const MARKET_DATA: MarketRow[] = [
  {
    field: "Technology and software",
    demandTrend: "up",
    demandPeriod: "June 2026",
    salaryMin: 60000,
    salaryMax: 216000,
    currency: "RM",
    salaryGrowth: "+5% YoY",
    dataSource: "2025 JobStreet Malaysia salary guide & sampled postings",
    lastUpdated: "2026-06-01",
    isDemo: true,
  },
  {
    field: "Engineering and manufacturing",
    demandTrend: "stable",
    demandPeriod: "June 2026",
    salaryMin: 54000,
    salaryMax: 180000,
    currency: "RM",
    salaryGrowth: "+3% YoY",
    dataSource: "2025 MEF salary survey & sampled postings",
    lastUpdated: "2026-06-01",
    isDemo: true,
  },
];

/** Fallback when a job's field has no curated row yet. */
const DEFAULT_ROW: MarketRow = {
  field: "All fields",
  demandTrend: "stable",
  demandPeriod: "June 2026",
  salaryMin: 42000,
  salaryMax: 150000,
  currency: "RM",
  salaryGrowth: "+3% YoY",
  dataSource: "Cross-field sample of Malaysian postings",
  lastUpdated: "2026-06-01",
  isDemo: true,
};

/** Deterministic row lookup by job field (case-insensitive), with fallback. */
export function marketRowFor(field: string): MarketRow {
  const key = field.trim().toLowerCase();
  return (
    MARKET_DATA.find((r) => r.field.toLowerCase() === key) ?? DEFAULT_ROW
  );
}

// ── Fair-pay comparison (pure, testable — see __checks__) ─────────

export interface FairPayVerdict {
  label: "Below market" | "Fair" | "Above market";
  /** Design-system tone the UI maps to classes. */
  tone: "destructive" | "clover" | "luminous";
  detail: string;
}

/** Compare an offer against the market range. Boundaries are inclusive. */
export function getFairPayLabel(offer: number, row: MarketRow): FairPayVerdict {
  const fmt = (n: number) => `${row.currency} ${n.toLocaleString("en-US")}`;
  const range = `${fmt(row.salaryMin)} – ${fmt(row.salaryMax)}`;
  if (offer < row.salaryMin) {
    return {
      label: "Below market",
      tone: "destructive",
      detail: `Below the indicative range (${range}) — room to negotiate up.`,
    };
  }
  if (offer > row.salaryMax) {
    return {
      label: "Above market",
      tone: "luminous",
      detail: `Above the indicative range (${range}) — a strong offer for this field.`,
    };
  }
  return {
    label: "Fair",
    tone: "clover",
    detail: `Within the indicative market range (${range}).`,
  };
}
