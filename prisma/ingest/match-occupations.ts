/**
 * Fuzzy-match each MarketPosting title → O*NET occupation, then aggregate a
 * per-field work-style profile (`FieldWorkStyle`) from the matched occupations.
 * Exact normalized-alias match first, then token-Jaccard (≥ 0.5). Run AFTER
 * ingest-jobstreet + ingest-onet. Command: `npm run db:match:occupations`.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tokens = (s: string) =>
  new Set(s.split(" ").filter((w) => w.length > 2));
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const uni = a.size + b.size - inter;
  return uni ? inter / uni : 0;
}

async function main() {
  const aliases = await prisma.occupationTitleAlias.findMany({
    select: { socCode: true, normalized: true },
  });
  const exact = new Map<string, string>();
  for (const a of aliases) if (!exact.has(a.normalized)) exact.set(a.normalized, a.socCode);
  const aliasTok = aliases.map((a) => ({ soc: a.socCode, tok: tokens(a.normalized) }));

  const postings = await prisma.marketPosting.findMany({
    select: { id: true, normalizedTitle: true },
  });

  const bySoc = new Map<string, string[]>(); // socCode → postingIds
  let exactN = 0;
  let fuzzyN = 0;
  for (const p of postings) {
    let soc = exact.get(p.normalizedTitle);
    if (soc) exactN++;
    else {
      const pt = tokens(p.normalizedTitle);
      if (pt.size) {
        let best = 0;
        let bestSoc: string | null = null;
        for (const a of aliasTok) {
          const j = jaccard(pt, a.tok);
          if (j > best) {
            best = j;
            bestSoc = a.soc;
          }
        }
        if (best >= 0.5 && bestSoc) {
          soc = bestSoc;
          fuzzyN++;
        }
      }
    }
    if (soc) {
      if (!bySoc.has(soc)) bySoc.set(soc, []);
      bySoc.get(soc)!.push(p.id);
    }
  }

  // Clear stale matches, then write in grouped updateMany calls.
  await prisma.marketPosting.updateMany({ data: { socCode: null } });
  for (const [soc, ids] of bySoc) {
    for (let i = 0; i < ids.length; i += 200)
      await prisma.marketPosting.updateMany({
        where: { id: { in: ids.slice(i, i + 200) } },
        data: { socCode: soc },
      });
  }
  const matched = exactN + fuzzyN;
  console.log(
    `matched ${matched}/${postings.length} (${Math.round((matched / postings.length) * 100)}%): exact ${exactN}, fuzzy ${fuzzyN}`,
  );

  // ── FieldWorkStyle: average occupation work-styles per field ──
  const fields = await prisma.marketPosting.groupBy({
    by: ["field"],
    where: { socCode: { not: null } },
    _count: true,
  });
  await prisma.fieldWorkStyle.deleteMany({});
  for (const f of fields) {
    const socs = await prisma.marketPosting.findMany({
      where: { field: f.field, socCode: { not: null } },
      select: { socCode: true },
      distinct: ["socCode"],
    });
    const socList = socs.map((s) => s.socCode!).filter(Boolean);
    if (!socList.length) continue;
    const ws = await prisma.occupationWorkStyle.findMany({
      where: { socCode: { in: socList } },
      select: { elementName: true, score: true },
    });
    const agg = new Map<string, { sum: number; n: number }>();
    for (const w of ws) {
      const a = agg.get(w.elementName) ?? { sum: 0, n: 0 };
      a.sum += w.score;
      a.n++;
      agg.set(w.elementName, a);
    }
    const rows = [...agg].map(([elementName, a]) => ({
      field: f.field,
      elementName,
      score: Math.round(a.sum / a.n),
      occupations: socList.length,
    }));
    await prisma.fieldWorkStyle.createMany({ data: rows, skipDuplicates: true });
    console.log(`  ${f.field}: ${socList.length} occupations → ${rows.length} styles`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
