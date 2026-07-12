/**
 * Ingest O*NET 30.3 → `Occupation`, `OccupationWorkStyle`, `OccupationTitleAlias`.
 * Work-style importance uses the WI (weight/index) scale, min–max normalized
 * per occupation to 0–100 (this AI-augmented release reports DR + WI, not IM).
 * Idempotent. Run: `npm run db:ingest:onet`.
 */
import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { readRecords } from "./xlsx";
import { normalizeTitle } from "./normalize";

const prisma = new PrismaClient();
const DIR = join(process.cwd(), "data", "db_30_3_excel");
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

async function createManyChunked<T>(
  rows: T[],
  fn: (chunk: T[]) => Promise<unknown>,
  size = 1000,
) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

async function main() {
  // ── Occupations ──
  const occRows = readRecords(join(DIR, "Occupation Data.xlsx")).filter(
    (r) => r["O*NET-SOC Code"],
  );
  await prisma.occupationTitleAlias.deleteMany({});
  await prisma.occupationWorkStyle.deleteMany({});
  await prisma.occupation.deleteMany({});
  await prisma.occupation.createMany({
    data: occRows.map((r) => ({
      socCode: r["O*NET-SOC Code"],
      title: r["Title"],
      description: r["Description"] ?? "",
    })),
  });
  console.log("occupations:", await prisma.occupation.count());

  // ── Work styles (WI scale) → per-occupation min–max 0–100 ──
  const wsRows = readRecords(join(DIR, "Work Styles.xlsx")).filter(
    (r) => r["Scale ID"] === "WI",
  );
  const byOcc = new Map<string, { el: string; v: number }[]>();
  for (const r of wsRows) {
    const soc = r["O*NET-SOC Code"];
    const v = Number(r["Data Value"]);
    if (!soc || Number.isNaN(v)) continue;
    if (!byOcc.has(soc)) byOcc.set(soc, []);
    byOcc.get(soc)!.push({ el: r["Element Name"], v });
  }
  const wsData: { socCode: string; elementName: string; score: number }[] = [];
  for (const [soc, arr] of byOcc) {
    const vals = arr.map((a) => a.v);
    const min = Math.min(...vals);
    const span = Math.max(...vals) - min || 1;
    for (const a of arr)
      wsData.push({
        socCode: soc,
        elementName: a.el,
        score: clamp(((a.v - min) / span) * 100),
      });
  }
  await createManyChunked(wsData, (c) =>
    prisma.occupationWorkStyle.createMany({ data: c, skipDuplicates: true }),
  );
  console.log("work-style rows:", await prisma.occupationWorkStyle.count());

  // ── Title aliases: occupation titles + sampled reported titles ──
  const validSoc = new Set(occRows.map((r) => r["O*NET-SOC Code"]));
  const seen = new Set<string>();
  const aliasData: { socCode: string; normalized: string; source: string }[] = [];
  const push = (soc: string, title: string, source: string) => {
    if (!validSoc.has(soc)) return;
    const norm = normalizeTitle(title);
    if (!norm) return;
    const key = `${soc}|${norm}`;
    if (seen.has(key)) return;
    seen.add(key);
    aliasData.push({ socCode: soc, normalized: norm, source });
  };
  for (const r of occRows) push(r["O*NET-SOC Code"], r["Title"], "occupation");
  for (const r of readRecords(join(DIR, "Sample of Reported Titles.xlsx")))
    push(r["O*NET-SOC Code"], r["Reported Job Title"], "reported");
  await createManyChunked(aliasData, (c) =>
    prisma.occupationTitleAlias.createMany({ data: c, skipDuplicates: true }),
  );
  console.log("aliases:", await prisma.occupationTitleAlias.count());

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
