/**
 * CV text → structured profile, rule-based. Pure functions only — no DOM,
 * no worker, no fetch — so the whole module is unit-checkable in node
 * (see __checks__/cvParser.check.ts) and the worker stays thin plumbing.
 *
 * Design rule: OMIT anything not confidently found. Every extractor
 * returns undefined/empty rather than guessing — a blank field the user
 * fills beats a hallucinated one they must notice and fix.
 */

export interface ParsedExperience {
  title: string;
  company: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  current: boolean;
  description?: string;
}

export interface ParsedEducation {
  school: string;
  degree?: string;
  startDate?: string;
  endDate?: string;
}

export interface ParsedCv {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  links: string[];
  experiences: ParsedExperience[];
  education: ParsedEducation[];
  skills: string[];
  certifications: string[];
  languages: string[];
}

// ── Section segmentation ────────────────────────────────────────

type SectionKey =
  | "top"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "projects"
  | "other";

/** Header keyword → section. Checked against whole trimmed lines only. */
const HEADERS: [RegExp, SectionKey][] = [
  [/^(work experience|professional experience|employment( history)?|experience|work history)$/i, "experience"],
  [/^(education|academic background|academics|qualifications)$/i, "education"],
  [/^(skills|technical skills|core competencies|key skills|skills & tools)$/i, "skills"],
  [/^(certifications?|certificates?|licenses? (and|&) certifications?)$/i, "certifications"],
  [/^(languages?)$/i, "languages"],
  [/^(projects?|personal projects)$/i, "projects"],
  [/^(summary|profile|objective|about( me)?|references|interests|hobbies|awards|volunteering)$/i, "other"],
];

function headerKey(line: string): SectionKey | null {
  const clean = line.replace(/[:\s]+$/, "").trim();
  if (clean.length === 0 || clean.length > 40) return null;
  for (const [re, key] of HEADERS) if (re.test(clean)) return key;
  return null;
}

/** Split raw CV text into per-section line blocks. Text before the first
 *  recognized header is the "top" block (name + contact live there). */
function segment(text: string): Record<SectionKey, string[]> {
  const blocks: Record<SectionKey, string[]> = {
    top: [], experience: [], education: [], skills: [],
    certifications: [], languages: [], projects: [], other: [],
  };
  let current: SectionKey = "top";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const key = headerKey(line);
    if (key) {
      current = key;
      continue;
    }
    blocks[current].push(line);
  }
  return blocks;
}

// ── Contact extractors ──────────────────────────────────────────

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const LINK_RE = /(https?:\/\/[^\s|,;)]+|(?:www\.|linkedin\.com\/|github\.com\/)[^\s|,;)]+)/gi;

function findEmail(text: string): string | undefined {
  return text.match(EMAIL_RE)?.[0];
}

function findLinks(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.match(LINK_RE) ?? []) {
    const clean = m.replace(/[.,;]$/, "");
    // Emails also contain dots — the regex can't match them (no @), but
    // avoid duplicating a link that appears with and without protocol.
    seen.add(clean.replace(/^https?:\/\//, "").toLowerCase());
  }
  return [...seen];
}

function findPhone(text: string): string | undefined {
  // Conservative: 8–15 digits with phone punctuation, not a year range.
  for (const m of text.match(/\+?\d[\d\s().\-/]{6,18}\d/g) ?? []) {
    const digits = m.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    if (/(19|20)\d{2}\s*[–—-]\s*(19|20)\d{2}/.test(m)) continue; // "2019 - 2022"
    return m.trim();
  }
  return undefined;
}

/** Name: first top-block line of 2–4 capitalized words, no digits/contact. */
function findName(topLines: string[]): string | undefined {
  for (const line of topLines.slice(0, 5)) {
    if (EMAIL_RE.test(line) || /\d/.test(line) || /http|www\./i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 4 || line.length > 48) continue;
    if (!words.every((w) => /^[A-Z][A-Za-z.'-]*$/.test(w))) continue;
    return line;
  }
  return undefined;
}

/** Location: a "City, Country/State" line (2–3 comma parts) near the top,
 *  or an explicit "Location: X" label. Unsure → undefined. */
function findLocation(topLines: string[]): string | undefined {
  for (const line of topLines.slice(0, 8)) {
    const labelled = line.match(/^location[:\s]+(.{2,80})$/i);
    if (labelled) return labelled[1].trim();
    if (EMAIL_RE.test(line) || /http|www\.|\d{5,}/i.test(line)) continue;
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2 || parts.length > 3) continue;
    if (parts.every((p) => /^[A-Z][A-Za-z .'-]{1,30}$/.test(p))) {
      return parts.join(", ");
    }
  }
  return undefined;
}

// ── Date ranges ─────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", sept: "09", oct: "10", nov: "11", dec: "12",
};
const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE_RANGE_RE = new RegExp(
  `(?:${MONTH_RE}\\s+)?((?:19|20)\\d{2})\\s*[–—-]\\s*(?:(present|current|now|ongoing)|(?:${MONTH_RE}\\s+)?((?:19|20)\\d{2}))`,
  "i",
);

interface DateRange {
  startDate: string;
  endDate?: string;
  current: boolean;
}

/** "Jan 2020 – Mar 2022" / "2020–Present" → YYYY-MM pair. Missing months
 *  default to -01 (a deliberate approximation, visible and editable). */
export function parseDateRange(line: string): DateRange | null {
  const m = line.match(DATE_RANGE_RE);
  if (!m) return null;
  const [, m1, y1, presentWord, m2, y2] = m;
  const month = (raw?: string) => (raw ? MONTHS[raw.slice(0, 3).toLowerCase()] ?? "01" : "01");
  return {
    startDate: `${y1}-${month(m1)}`,
    endDate: presentWord ? undefined : y2 ? `${y2}-${month(m2)}` : undefined,
    current: !!presentWord,
  };
}

// ── Experience & education blocks ───────────────────────────────

const BULLET_RE = /^[•·▪◦*-]\s*/;

/** Entries are delimited by date-range lines. Title/company come from the
 *  same line's leftover text or the immediately preceding line; bullets
 *  below become the description. No date range → no entry (omit). */
function parseExperiences(lines: string[]): ParsedExperience[] {
  const out: ParsedExperience[] = [];
  for (let i = 0; i < lines.length; i++) {
    const range = parseDateRange(lines[i]);
    if (!range) continue;
    // Header text = the date line minus the date, else the previous line
    // (unless that line was consumed by the previous entry's description).
    let header = lines[i].replace(DATE_RANGE_RE, "").replace(/[|,•·–—-]\s*$/, "").trim();
    if (!header && i > 0 && !parseDateRange(lines[i - 1]) && !BULLET_RE.test(lines[i - 1])) {
      header = lines[i - 1].trim();
    }
    // Company may sit on the line after the date when the header only
    // carried the title ("Software Engineer" / "Acme Corp\n• built…").
    let title = "";
    let company = "";
    const split = header.split(/\s+(?:at|@)\s+|\s*[|•·]\s*|\s+[–—]\s+|,\s+/);
    if (split.length >= 2) {
      [title, company] = [split[0].trim(), split[1].trim()];
    } else {
      title = header;
      const next = lines[i + 1];
      if (next && !BULLET_RE.test(next) && !parseDateRange(next) && next.length <= 60) {
        company = next.trim();
      }
    }
    if (!title) continue; // ponytail: no confident title → omit, never guess
    const description: string[] = [];
    for (let j = i + 1; j < lines.length && !parseDateRange(lines[j]); j++) {
      if (BULLET_RE.test(lines[j])) description.push(lines[j].replace(BULLET_RE, ""));
    }
    out.push({
      title: title.slice(0, 120),
      company: company.slice(0, 120),
      ...range,
      description: description.length ? description.join("\n").slice(0, 600) : undefined,
    });
  }
  return out;
}

const DEGREE_RE = /\b(bachelor|master|b\.?\s?sc|m\.?\s?sc|b\.?\s?a\b|m\.?\s?a\b|b\.?\s?eng|m\.?\s?eng|ph\.?\s?d|doctorate|diploma|associate|mba)\b/i;

function parseEducation(lines: string[]): ParsedEducation[] {
  const out: ParsedEducation[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!DEGREE_RE.test(lines[i])) continue;
    const range = parseDateRange(lines[i]) ?? (lines[i + 1] ? parseDateRange(lines[i + 1]) : null);
    const degree = lines[i].replace(DATE_RANGE_RE, "").replace(/[|,–—-]\s*$/, "").trim();
    // School: comma-tail of the same line, or the nearest non-degree line.
    let school = "";
    const parts = degree.split(/,\s+|\s+[–—]\s+|\s+at\s+/);
    if (parts.length >= 2) school = parts[parts.length - 1].trim();
    else {
      const near = [lines[i + 1], lines[i - 1]].find(
        (l) => l && !DEGREE_RE.test(l) && !parseDateRange(l) && !BULLET_RE.test(l) && l.length <= 80,
      );
      if (near) school = near.trim();
    }
    if (!school) continue; // omit half-found entries
    out.push({
      school: school.slice(0, 120),
      degree: parts[0]?.trim().slice(0, 120) || undefined,
      startDate: range?.startDate,
      endDate: range?.endDate,
    });
  }
  return out;
}

// ── Skills / list blocks ────────────────────────────────────────

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Skills = the skills block split on separators, UNION a gazetteer match
 *  over the whole text (catches skills mentioned inside experience bullets).
 *  Gazetteer casing wins on duplicates. */
function parseSkills(
  skillLines: string[],
  fullText: string,
  dictionary: string[],
): string[] {
  const found = new Map<string, string>(); // lower → display
  for (const line of skillLines) {
    for (const piece of line.split(/[,;•·|/]+/)) {
      const s = piece.replace(BULLET_RE, "").trim();
      if (!s || s.length > 40 || s.split(/\s+/).length > 4) continue;
      found.set(s.toLowerCase(), s);
    }
  }
  const lower = fullText.toLowerCase();
  for (const skill of dictionary) {
    if (new RegExp(`(^|[^a-z0-9])${escapeRe(skill.toLowerCase())}($|[^a-z0-9])`).test(lower)) {
      found.set(skill.toLowerCase(), skill); // dictionary casing wins
    }
  }
  return [...found.values()];
}

function parseListBlock(lines: string[], maxLen: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    for (const piece of line.split(/[,;•·|]+/)) {
      const s = piece.replace(BULLET_RE, "").trim();
      if (s && s.length <= maxLen) out.push(s);
    }
  }
  return [...new Set(out)];
}

// ── Entry point ─────────────────────────────────────────────────

export function parseCvText(text: string, skillDictionary: string[]): ParsedCv {
  const blocks = segment(text);
  return {
    fullName: findName(blocks.top),
    email: findEmail(text),
    phone: findPhone(text),
    location: findLocation(blocks.top),
    links: findLinks(text),
    experiences: parseExperiences(blocks.experience),
    education: parseEducation(blocks.education),
    skills: parseSkills(blocks.skills, text, skillDictionary),
    certifications: parseListBlock(blocks.certifications, 120),
    languages: parseListBlock(blocks.languages, 40),
  };
}

/** How many distinct profile fields the parse actually filled — drives the
 *  "Filled N fields from your CV" success message. */
export function countFilled(cv: ParsedCv): number {
  let n = 0;
  if (cv.fullName) n++;
  if (cv.email) n++;
  if (cv.phone) n++;
  if (cv.location) n++;
  if (cv.links.length) n++;
  n += cv.experiences.length + cv.education.length;
  if (cv.skills.length) n++;
  if (cv.certifications.length) n++;
  if (cv.languages.length) n++;
  return n;
}
