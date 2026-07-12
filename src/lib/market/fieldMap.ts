/**
 * Normalize a free-text field/industry (onboarding answers are open text) to
 * the canonical `Job.field` vocabulary the market corpus is keyed by. Keeps the
 * intelligence route's demand lookups from missing on "Technology" vs
 * "Technology and software". Returns the input unchanged when nothing matches
 * (the route then falls back to global demand).
 */
export function toMarketField(raw: string): string {
  const d = raw.trim().toLowerCase();
  if (!d) return "";
  if (/tech|software|\bit\b|ict|data|information|comput|digital|\bai\b|science/.test(d))
    return "Technology and software";
  if (/eng|manufactur|mechanic|electr|robot|industrial|transport|logistic|construct/.test(d))
    return "Engineering and manufacturing";
  if (/financ|account|bank|sales|business|market|consult/.test(d))
    return "Business and finance";
  return raw.trim();
}
