import { z } from "zod";
import { devModeGuard, setTestRoleAndSession } from "@/lib/dev/testApi";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const Schema = z.object({ role: z.enum(["candidate", "employer"]) });

/**
 * POST /api/dev/session — log in as the test account in the chosen mode
 * (sets `User.role` + issues a real session cookie). Dev only.
 */
export async function POST(request: Request) {
  const blocked = devModeGuard();
  if (blocked) return blocked;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "role must be 'candidate' or 'employer'.");
    }
    await setTestRoleAndSession(parsed.data.role);
    return ok({ role: parsed.data.role, signedIn: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
