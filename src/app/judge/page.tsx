import { notFound } from "next/navigation";
import { isTestModeEnabled } from "@/lib/dev/testMode";
import { JudgeHub } from "@/components/judge/JudgeHub";

/**
 * /judge — guided demo hub. Flag-gated: 404s in production (no test mode),
 * so it's invisible to real users. The interactive pieces live in JudgeHub.
 */
export default function JudgeLandingPage() {
  if (!isTestModeEnabled()) notFound();
  return <JudgeHub />;
}
