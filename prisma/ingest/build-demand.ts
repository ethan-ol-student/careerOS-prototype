/**
 * Precompute market aggregates from the ingested corpus:
 *  - `MarketFieldDemand`: per-field posting volume + salary range/median.
 *  - `SkillDemand`: per app-canonical skill, how much the market wants it —
 *    LIGHT-FIRST: skill→field comes from the curated `Job` catalogue, weighted
 *    by each field's real JobStreet posting volume × the skill's prevalence in
 *    that field. Global ("") + per-field scopes. O*NET (slice 3) will replace
 *    the curated-catalogue mapping with per-occupation skills.
 *
 * Run AFTER `db:ingest:jobstreet`. Command: `npm run db:build:demand`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
/** p-th percentile (0–1) of a numeric array, or null when empty. */
const pctile = (arr: number[], p: number): number | null => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

async function main() {
  // ── 1) MarketFieldDemand ──
  const fields = await prisma.marketPosting.groupBy({ by: ["field"], _count: true });
  for (const f of fields) {
    const withSalary = await prisma.marketPosting.findMany({
      where: { field: f.field, salaryMinYr: { not: null } },
      select: { salaryMinYr: true, salaryMaxYr: true },
    });
    // Pool every observed salary point, then report a credible p25–p75 band
    // (raw min–max is dragged wide by outliers).
    const pts = withSalary
      .flatMap((p) => [p.salaryMinYr, p.salaryMaxYr])
      .filter((n): n is number => typeof n === "number" && n > 0);
    const row = {
      postingCount: f._count,
      salaryMinYr: pctile(pts, 0.25),
      salaryMaxYr: pctile(pts, 0.75),
      salaryMedianYr: pctile(pts, 0.5),
    };
    await prisma.marketFieldDemand.upsert({
      where: { field: f.field },
      create: { field: f.field, ...row },
      update: row,
    });
  }
  const fieldWeight = new Map(fields.map((f) => [f.field, f._count]));

  // ── 2) SkillDemand from curated jobs × field volume ──
  const jobs = await prisma.job.findMany({
    select: { field: true, requiredSkills: true },
  });
  const fieldJobCount = new Map<string, number>();
  const skillField = new Map<string, Map<string, number>>(); // skill → field → #jobs
  for (const j of jobs) {
    fieldJobCount.set(j.field, (fieldJobCount.get(j.field) ?? 0) + 1);
    for (const raw of j.requiredSkills) {
      const sk = raw.trim().toLowerCase();
      if (!sk) continue;
      if (!skillField.has(sk)) skillField.set(sk, new Map());
      const fm = skillField.get(sk)!;
      fm.set(j.field, (fm.get(j.field) ?? 0) + 1);
    }
  }

  interface Row { skill: string; field: string; postingCount: number; raw: number }
  const rows: Row[] = [];
  for (const [sk, fm] of skillField) {
    let globalRaw = 0;
    let globalPostings = 0;
    for (const [field, cnt] of fm) {
      const fw = fieldWeight.get(field) ?? 0;
      const prevalence = cnt / (fieldJobCount.get(field) ?? 1);
      const raw = fw * prevalence;
      rows.push({ skill: sk, field, postingCount: Math.round(raw), raw });
      globalRaw += raw;
      globalPostings += fw;
    }
    rows.push({ skill: sk, field: "", postingCount: globalPostings, raw: globalRaw });
  }

  // Normalize demandScore to 0–100 within each scope (field).
  const maxByScope = new Map<string, number>();
  for (const r of rows)
    maxByScope.set(r.field, Math.max(maxByScope.get(r.field) ?? 0, r.raw));

  await prisma.skillDemand.deleteMany({});
  await prisma.skillDemand.createMany({
    data: rows.map((r) => ({
      skill: r.skill,
      field: r.field,
      postingCount: r.postingCount,
      demandScore: clamp((r.raw / (maxByScope.get(r.field) || 1)) * 100),
    })),
  });

  const fd = await prisma.marketFieldDemand.count();
  const sd = await prisma.skillDemand.count();
  console.log(`built ${fd} field-demand rows, ${sd} skill-demand rows`);
  const top = await prisma.skillDemand.findMany({
    where: { field: "" },
    orderBy: { demandScore: "desc" },
    take: 8,
  });
  top.forEach((t) => console.log(`  ${t.skill}: ${t.demandScore}/100 (${t.postingCount} postings)`));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
