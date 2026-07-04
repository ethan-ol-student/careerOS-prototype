/**
 * Semantic API error classes.
 *
 * Route handlers / helpers throw these and the shared responder
 * (`failFromUnknown` in `respond.ts`) maps them to the correct HTTP
 * status. This keeps auth/ownership failures from being reported as
 * generic 500s.
 */

/** 401 — no valid session. */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** 403 — authenticated, but wrong role / not the owner. */
export class ForbiddenError extends Error {
  constructor(message = "You don't have access to this resource.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** 404 — the requested resource doesn't exist (or isn't visible). */
export class NotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** 409 — conflicts with current state (e.g. a duplicate unique row). */
export class ConflictError extends Error {
  constructor(message = "That conflicts with an existing record.") {
    super(message);
    this.name = "ConflictError";
  }
}

/** 402 — authenticated but the feature needs a Pro plan (freemium gate). */
export class PaymentRequiredError extends Error {
  constructor(message = "This feature is part of Career OS Pro.") {
    super(message);
    this.name = "PaymentRequiredError";
  }
}
