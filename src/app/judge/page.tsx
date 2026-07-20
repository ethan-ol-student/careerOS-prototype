import { notFound } from "next/navigation";
import { isJudgeDemoEnabled } from "@/lib/dev/testMode";
import { JudgeHub } from "@/components/judge/JudgeHub";


/**
 * /judge — guided demo hub. Gated by the judge-demo flag (decoupled from
 * full test mode so production can run the judge experience without the
 * dev harness); 404s when the flag is off.
 */
export default function JudgeLandingPage() {
  if (!isJudgeDemoEnabled()) notFound();
  return <JudgeHub />;
}
