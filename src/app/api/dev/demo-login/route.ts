import { z } from "zod";
import { setDemoSession } from "@/lib/dev/testApi";
import { isJudgeDemoEnabled } from "@/lib/dev/testMode";
import { JUDGE_ACCOUNT } from "@/lib/judge/demoData";
import { MID_CAREER_DEMO } from "@/lib/judge/midCareerDemo";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const Schema = z.object({
  account: z.enum(["judge", "mid-career"]).default("judge"),
  role: z.enum(["candidate", "employer"]).default("candidate"),
});

const USERNAME = {
  judge: JUDGE_ACCOUNT.username,
  "mid-career": MID_CAREER_DEMO.username,
};

/**
 * POST /api/dev/demo-login — sign in a flag-gated demo account (judge or
 * mid-career) in the chosen role and return where to land. Gated by the
 * judge-demo flag (decoupled from full test mode so production judges can
 * use it without the dev harness); `setDemoSession` re-checks the account
 * is a demo account server-side, so real users are never reachable.
 */
export async function POST(request: Request) {
  if (!isJudgeDemoEnabled()) {
    return failFromCode("not_found", "Not found.", 404);
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "account must be judge|mid-career and role candidate|employer.");
    }
    const { account, role } = parsed.data;
    await setDemoSession(USERNAME[account], role);

    const redirect =
      role === "employer"
        ? "/employers/marketplace"
        : account === "judge"
          ? "/judge/tour"
          : "/candidate/dashboard";

    return ok({ account, role, redirect });
  } catch (err) {
    return failFromUnknown(err);
  }
}
