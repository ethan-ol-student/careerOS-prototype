"use client";

// Segment-level error boundary for /employers/*. Re-uses the shared route
// error UI so a render error inside one employer page is caught here
// (with its own reset) instead of bubbling to the root boundary.
export { default } from "../error";
