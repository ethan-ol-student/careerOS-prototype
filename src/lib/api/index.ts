/**
 * Public surface of the Career OS API layer.
 *
 * Components and providers should import from this module — never
 * directly from `./localAdapter` or `./types` — so we keep a single
 * place to swap the implementation later.
 */
export type * from "./types";
export { getApiAdapter, _resetApiAdapterForTests } from "./adapter";
export type { ApiAdapter } from "./adapter";
