/**
 * Lightweight, dependency-free validation helpers for Career OS.
 *
 * The project does not ship Zod / Yup / React Hook Form right now,
 * so this module gives us a small, ergonomic substitute that is
 * easy to upgrade later. Each validator returns a `Result<T>` shape
 * with either the cleaned value or a user-facing error message.
 *
 * Upgrade path: when we adopt Zod, every `validateX` here can be
 * swapped for a `schema.safeParse(input)` and the `Result` shape
 * stays the same — so call sites don't have to change.
 */

export interface ValidationOk<T> {
  ok: true;
  value: T;
}
export interface ValidationFail {
  ok: false;
  /** Short, user-facing message safe to render in the UI. */
  error: string;
}
export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

const ok = <T,>(value: T): ValidationOk<T> => ({ ok: true, value });
const fail = (error: string): ValidationFail => ({ ok: false, error });

// ── Generic helpers ─────────────────────────────────────────────

// Match ASCII control characters (0x00–0x1F and 0x7F) — anything we
// don't expect in a normal text field. Using \p{Cc} keeps the regex
// readable without baking control bytes into the source.
const CONTROL_CHARS = /[\p{Cc}]/gu;

/** Strip control chars + collapse runs of whitespace. */
export function sanitizeText(input: string): string {
  return input.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

/**
 * Heuristic block for the few patterns we treat as obviously unsafe
 * in a free-text field. This is *not* a sanitizer; it's a friendly
 * "please don't paste a script tag here" guard. The server is still
 * responsible for the real defence when one exists.
 */
const UNSAFE_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /<\s*iframe\b/i,
  /javascript\s*:/i,
  /\son\w+\s*=/i, // onerror=, onclick=, …
];

function containsUnsafeContent(input: string): boolean {
  return UNSAFE_PATTERNS.some((re) => re.test(input));
}

// ── Field validators ────────────────────────────────────────────

export function validateRoleTitle(raw: string): ValidationResult<string> {
  const cleaned = sanitizeText(raw);
  if (!cleaned) return fail("Please enter the role you're hiring for.");
  if (cleaned.length < 2)
    return fail("Role title must be at least 2 characters.");
  if (cleaned.length > 80)
    return fail("Role title can't be longer than 80 characters.");
  if (containsUnsafeContent(cleaned))
    return fail("That role title contains characters we can't accept.");
  return ok(cleaned);
}

export interface ContactDraft {
  subject: string;
  message: string;
}
export interface ContactErrors {
  subject?: string;
  message?: string;
}
export interface ContactValidationResult {
  ok: boolean;
  value?: ContactDraft;
  /** First error message, useful when you only want to render one. */
  error?: string;
  /** Field-level errors for inline UI hints. */
  fieldErrors?: ContactErrors;
}

export function validateContactDraft(
  draft: ContactDraft,
): ContactValidationResult {
  const subject = sanitizeText(draft.subject);
  const message = draft.message.replace(CONTROL_CHARS, "");

  const fieldErrors: ContactErrors = {};
  if (!subject) fieldErrors.subject = "Subject is required.";
  else if (subject.length < 4)
    fieldErrors.subject = "Subject must be at least 4 characters.";
  else if (subject.length > 120)
    fieldErrors.subject = "Subject must be 120 characters or fewer.";
  else if (containsUnsafeContent(subject))
    fieldErrors.subject = "Subject contains characters we can't accept.";

  const trimmedMessage = message.trim();
  if (!trimmedMessage) fieldErrors.message = "Message can't be empty.";
  else if (trimmedMessage.length < 20)
    fieldErrors.message =
      "Add a bit more context — at least 20 characters.";
  else if (trimmedMessage.length > 4000)
    fieldErrors.message =
      "Message is too long — keep it under 4000 characters.";
  else if (containsUnsafeContent(trimmedMessage))
    fieldErrors.message = "Message contains characters we can't accept.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: fieldErrors.subject ?? fieldErrors.message ?? "Invalid form.",
      fieldErrors,
    };
  }
  return { ok: true, value: { subject, message: trimmedMessage } };
}
