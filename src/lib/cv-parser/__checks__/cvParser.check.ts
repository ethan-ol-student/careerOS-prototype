/**
 * CV-parser heuristics check — pure, no DB, no browser. Run:
 *   npm run check:cv
 * Asserts extraction on a realistic sample AND the omit-don't-guess rule
 * on garbage input.
 */
import assert from "node:assert/strict";
import { countFilled, parseCvText, parseDateRange } from "../heuristics";
import { SKILL_TAXONOMY } from "@/lib/skills/taxonomy";

const SAMPLE = `
Jordan Reyes
Kuala Lumpur, Malaysia
jordan.reyes@example.com | +60 12-345 6789
linkedin.com/in/jordanreyes

SUMMARY
Product-minded engineer with 8 years of experience.

WORK EXPERIENCE
Senior Software Engineer at Acme Corp
Jan 2020 - Mar 2023
• Led migration of the billing platform to TypeScript
• Cut deployment time from 2 days to 20 minutes

Software Engineer | Initech
2017 - Present
• Built internal tools with React and SQL

EDUCATION
BSc Computer Science, University of Malaya
2013 - 2017

SKILLS
Python, Communication, Welding

LANGUAGES
English, Malay
`;

function main() {
  const cv = parseCvText(SAMPLE, SKILL_TAXONOMY);

  assert.equal(cv.fullName, "Jordan Reyes", "name from top block");
  assert.equal(cv.email, "jordan.reyes@example.com", "email regex");
  assert.ok(cv.phone?.includes("12-345"), "phone found, not a year range");
  assert.equal(cv.location, "Kuala Lumpur, Malaysia", "City, Country line");
  assert.ok(cv.links.some((l) => l.includes("linkedin.com/in/jordanreyes")), "link");

  assert.equal(cv.experiences.length, 2, "two dated experience entries");
  const [a, b] = cv.experiences;
  assert.equal(a.title, "Senior Software Engineer");
  assert.equal(a.company, "Acme Corp");
  assert.equal(a.startDate, "2020-01");
  assert.equal(a.endDate, "2023-03");
  assert.equal(a.current, false);
  assert.ok(a.description?.includes("billing platform"), "bullets → description");
  assert.equal(b.title, "Software Engineer");
  assert.equal(b.company, "Initech");
  assert.equal(b.current, true, "'Present' → current");

  assert.equal(cv.education.length, 1, "one education entry");
  assert.equal(cv.education[0].school, "University of Malaya");
  assert.ok(cv.education[0].degree?.startsWith("BSc"), "degree kept");

  // Skills: block entries + gazetteer hits from the experience bullets.
  const lower = cv.skills.map((s) => s.toLowerCase());
  for (const s of ["python", "communication", "welding", "react", "sql", "typescript"]) {
    assert.ok(lower.includes(s), `skill found: ${s}`);
  }
  assert.deepEqual(cv.languages, ["English", "Malay"], "languages split");

  // Omit-don't-guess: junk text yields an EMPTY parse, not invented data.
  const junk = parseCvText("lorem ipsum dolor sit amet 12345\nmore filler text here ok", []);
  assert.equal(junk.fullName, undefined, "no fake name");
  assert.equal(junk.experiences.length, 0, "no fake experiences");
  assert.equal(countFilled(junk), 0, "junk fills zero fields");

  // Date edge cases.
  assert.deepEqual(parseDateRange("Sept 2019 — Now"), {
    startDate: "2019-09", endDate: undefined, current: true,
  });
  assert.equal(parseDateRange("random text with no dates"), null);

  console.log(`OK — cv-parser heuristics passed (sample filled ${countFilled(cv)} fields).`);
}

main();
