/**
 * Shared lifecycle status for any Career OS context provider that
 * may eventually be backed by a remote API.
 *
 * Today every provider is localStorage-only, so the realistic
 * transitions are `idle → loading → ready`. The `error` slot exists
 * so a future API-backed implementation can surface failures
 * without changing the consuming components.
 */
export type ContextStatus = "idle" | "loading" | "ready" | "error";
