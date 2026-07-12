/**
 * Title normalization shared by JobStreet ingestion and O*NET aliasing — they
 * MUST normalize identically or the fuzzy title→occupation match can't line up.
 * Lowercase, drop parentheticals, strip punctuation, collapse whitespace.
 */
export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
