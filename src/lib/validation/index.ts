/**
 * Form validation for Career OS — zod schemas behind a small
 * `{ ok, value?, fieldErrors? }` result the UI renders inline.
 */
import { z } from "zod";

// ASCII control characters (0x00–0x1F, 0x7F) — never expected in a text field.
const CONTROL_CHARS = /\p{Cc}/gu;

// Friendly "please don't paste a script tag here" guard — the server stays
// responsible for the real defence when one exists.
const UNSAFE = /<\s*script\b|<\s*iframe\b|javascript\s*:|\son\w+\s*=/i;

const contactSchema = z.object({
  subject: z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, "Subject is required.")
        .min(4, "Subject must be at least 4 characters.")
        .max(120, "Subject must be 120 characters or fewer.")
        .refine(
          (s) => !UNSAFE.test(s),
          "Subject contains characters we can't accept.",
        ),
    ),
  message: z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, "").trim())
    .pipe(
      z
        .string()
        .min(1, "Message can't be empty.")
        .min(20, "Add a bit more context — at least 20 characters.")
        .max(4000, "Message is too long — keep it under 4000 characters.")
        .refine(
          (s) => !UNSAFE.test(s),
          "Message contains characters we can't accept.",
        ),
    ),
});

export interface ContactErrors {
  subject?: string;
  message?: string;
}

export interface ContactValidationResult {
  ok: boolean;
  /** Cleaned values, present when ok. */
  value?: z.infer<typeof contactSchema>;
  /** Field-level errors for inline UI hints (first issue per field). */
  fieldErrors?: ContactErrors;
}

export function validateContactDraft(draft: {
  subject: string;
  message: string;
}): ContactValidationResult {
  const parsed = contactSchema.safeParse(draft);
  if (parsed.success) return { ok: true, value: parsed.data };
  const fieldErrors: ContactErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if ((key === "subject" || key === "message") && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, fieldErrors };
}
