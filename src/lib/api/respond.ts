/**
 * Tiny Next.js Response helpers so every route hands back the
 * `ApiResult<T>` shape the frontend adapter already speaks.
 *
 * `failFromUnknown` is the shared catch-all: it classifies known
 * errors into correct HTTP semantics (401/403/404/400) and falls back
 * to a 500 for anything unexpected. In production it returns generic,
 * safe messages and never leaks internal causes (Prisma details,
 * stack traces, raw thrown values); unexpected failures are logged
 * server-side.
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";
import type { ApiError, ApiErrorCode } from "./types";

const IS_PROD = process.env.NODE_ENV === "production";

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function fail(error: ApiError, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function failFromCode(
  code: ApiErrorCode,
  message: string,
  status = 400,
) {
  return fail({ code, message }, status);
}

/** Default user-facing copy per status — used in production. */
const GENERIC_MESSAGE: Record<number, string> = {
  400: "Invalid request.",
  401: "Authentication required.",
  403: "You don't have access to this resource.",
  404: "Not found.",
  409: "That conflicts with an existing record.",
  500: "Something went wrong. Please try again.",
};

/**
 * Picks the client-facing message. In development we surface the real
 * message to aid debugging; in production we return the generic copy
 * for 5xx (to avoid leaking internals) but keep the specific message
 * for 4xx (which is safe, user-actionable, and already validated)
 */
function clientMessage(status: number, specific: string): string {
  const generic = GENERIC_MESSAGE[status] ?? GENERIC_MESSAGE[500];
  if (status >= 500) return IS_PROD ? generic : specific;
  return specific || generic;
}

/**
 * Catch-all responder. Classifies the thrown value and returns a
 * production-safe envelope (no `cause`, no stack, no Prisma internals).
 * Expected request-state failures like unauthenticated API calls are not
 * logged as errors, because those are normal 401/403/404 responses and can
 * otherwise flood Vercel logs whenever an anonymous user hits a protected API.
 */
export function failFromUnknown(err: unknown) {
  // 401 — not authenticated.
  if (err instanceof UnauthorizedError) {
    return failFromCode(
      "unauthenticated",
      clientMessage(401, err.message),
      401,
    );
  }
  // 403 — authenticated but not allowed.
  if (err instanceof ForbiddenError) {
    return failFromCode("forbidden", clientMessage(403, err.message), 403);
  }
  // 404 — missing resource.
  if (err instanceof NotFoundError) {
    return failFromCode("not_found", clientMessage(404, err.message), 404);
  }
  // 409 — conflicts with current state (friendly duplicate handling).
  if (err instanceof ConflictError) {
    return failFromCode("conflict", clientMessage(409, err.message), 409);
  }
  // 400 — request validation.
  if (err instanceof ZodError) {
    const first = err.issues[0]?.message ?? "Invalid request.";
    return failFromCode("validation", clientMessage(400, first), 400);
  }
  // Prisma known request errors → map the common ones.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[api]", err);
    if (err.code === "P2025") {
      return failFromCode("not_found", clientMessage(404, "Not found."), 404);
    }
    if (err.code === "P2002") {
      return failFromCode(
        "conflict",
        IS_PROD ? "That already exists." : `Unique constraint: ${err.meta?.target ?? "field"}`,
        409,
      );
    }
    // Other DB errors are server-side concerns — never echo details.
    return failFromCode("server", GENERIC_MESSAGE[500], 500);
  }

  // Unknown server error — generic in prod, detailed in dev. No cause.
  console.error("[api]", err);
  const detail = err instanceof Error ? err.message : "Unexpected server error.";
  return failFromCode("server", clientMessage(500, detail), 500);
}
