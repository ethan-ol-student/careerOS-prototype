/**
 * Ingest JobStreet postings → `MarketPosting` (aggregate market corpus, NOT
 * applyable jobs). Real Malaysian demand + salary. Idempotent: clears prior
 * jobstreet rows first. Run: `npm run db:ingest:jobstreet`.
 *
 * Reality of the file (verified): `job_description` holds the TITLE (no prose,
 * no skills column); salaries look like "RM 8,000 per month"; the
 * classification carries a parenthetical domain used to map → Job.field.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCsv } from "./csv";
import { normalizeTitle } from "./normalize";

const prisma = new PrismaClient();

/** JobStreet classification "… (Engineering)" → app Job.field vocabulary. */
function domainToField(classification: string): string {
  const m = classification.match(/\(([^)]+)\)\s*$/);
  const d = (m?.[1] ?? classification).toLowerCase();
  if (/information & communication|science & technology|technology/.test(d))
    return "Technology and software";
  if (/engineering|manufacturing|transport|logistics/.test(d))
    return "Engineering and manufacturing";
  return "Business and finance";
}

/** "RM 8,000 per month" | "RM 5,000 - RM 7,000" | "No info" → annualized RM. */
function parseSalaryToAnnual(raw: string): { min: number | null; max: number | null } {
  if (!raw || /no info/i.test(raw)) return { min: null, max: null };
  const perYear = /annum|year|yearly|p\.?a/i.test(raw);
  const nums = [...raw.matchAll(/(\d[\d,]{2,})/g)]
    .map((mm) => parseInt(mm[1].replace(/,/g, ""), 10))
    .filter((n) => n >= 500 && n <= 5_000_000);
  if (!nums.length) return { min: null, max: null };
  const mult = perYear ? 1 : 12;
  return { min: Math.min(...nums) * mult, max: Math.max(...nums) * mult };
}

async function main() {
  const csv = readFileSync(
    join(process.cwd(), "data", "jobstreet_jobs.csv"),
    "utf8",
  );
  const rows = parseCsv(csv);

  await prisma.marketPosting.deleteMany({ where: { source: "jobstreet" } });

  let withSalary = 0;
  const data = rows
    .map((r) => {
      const rawTitle = r["job_description"] || ""; // title lives here
      const { min, max } = parseSalaryToAnnual(r["job_salary"] || "");
      if (min !== null) withSalary++;
      return {
        rawTitle,
        normalizedTitle: normalizeTitle(rawTitle),
        field: domainToField(r["job_classification"] || ""),
        classification: r["job_classification"] || "",
        salaryMinYr: min,
        salaryMaxYr: max,
        location: r["job_location"] || "",
        industry: r["company_industry"] || "",
        source: "jobstreet",
      };
    })
    .filter((d) => d.rawTitle);

  for (let i = 0; i < data.length; i += 500) {
    await prisma.marketPosting.createMany({ data: data.slice(i, i + 500) });
  }

  const pct = data.length ? Math.round((withSalary / data.length) * 100) : 0;
  console.log(`ingested ${data.length} postings; ${withSalary} with salary (${pct}%)`);
  const byField = await prisma.marketPosting.groupBy({
    by: ["field"],
    _count: true,
  });
  byField.forEach((f) => console.log(`  ${f.field}: ${f._count}`));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
