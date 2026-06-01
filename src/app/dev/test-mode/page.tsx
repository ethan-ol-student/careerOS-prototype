"use client";

import { notFound } from "next/navigation";
import { isTestModeEnabled } from "@/lib/dev/testMode";
import { TestModePanel } from "@/components/dev/TestModePanel";

/**
 * `/dev/test-mode` — the developer test panel. Double-gated: the parent
 * `dev/layout.tsx` 404s server-side when disabled, and this re-checks on
 * the client for defense in depth.
 */
export default function TestModePage() {
  if (!isTestModeEnabled()) {
    notFound();
  }
  return <TestModePanel />;
}
