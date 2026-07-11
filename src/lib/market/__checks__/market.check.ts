/**
 * Deterministic assertions for the market module (run via
 * `npm run check:market`, same pattern as check:intelligence).
 * Guards the fair-pay boundaries and the field-row fallback.
 */
import { MARKET_DATA, getFairPayLabel, marketRowFor } from "../marketData";

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

const row = MARKET_DATA[0];

check("offer below min → Below market", getFairPayLabel(row.salaryMin - 1, row).label === "Below market");
check("offer at min (inclusive) → Fair", getFairPayLabel(row.salaryMin, row).label === "Fair");
check("offer mid-range → Fair", getFairPayLabel((row.salaryMin + row.salaryMax) / 2, row).label === "Fair");
check("offer at max (inclusive) → Fair", getFairPayLabel(row.salaryMax, row).label === "Fair");
check("offer above max → Above market", getFairPayLabel(row.salaryMax + 1, row).label === "Above market");
check("tones map to design tokens", ["destructive", "clover", "luminous"].includes(getFairPayLabel(0, row).tone));

check("exact field resolves its row", marketRowFor("Technology and software").field === "Technology and software");
check("lookup is case-insensitive", marketRowFor("TECHNOLOGY AND SOFTWARE").field === "Technology and software");
check("unknown field falls back", marketRowFor("Underwater basket weaving").field === "All fields");
check("every row is demo-labelled", MARKET_DATA.every((r) => r.isDemo));
check("every row is in RM", MARKET_DATA.every((r) => r.currency === "RM"));
check("every row has min < max", MARKET_DATA.every((r) => r.salaryMin < r.salaryMax));

if (failures > 0) {
  console.error(`market.check: ${failures} failure(s)`);
  process.exit(1);
}
console.log("market.check: all assertions passed");
