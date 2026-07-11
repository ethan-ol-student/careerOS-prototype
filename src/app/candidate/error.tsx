"use client";

// Segment-level error boundary for /candidate/*. Re-uses the shared route
// error UI so a render error inside one candidate page is caught here
// (with its own reset) instead of bubbling to the root boundary.
export { default } from "../error";
