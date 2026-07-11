import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/auth/rateLimit";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";
import type { AuthRole, AuthUser } from "@/lib/auth/types";

const LoginSchema = z.object({
  identifier: z.string().min(1).max(120), // username OR email
  password: z.string().min(1).max(200),
});

/** POST /api/auth/login — verify password, issue session. */
export async function POST(request: Request) {
  try {
    // Brute-force protection: cap attempts per IP per minute.
    const ip = clientIp(request);
    const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return failFromCode(
        "rate_limited",
        "Too many login attempts. Please wait a minute and try again.",
        429,
      );
    }

    const json = await request.json();
    const parsed = LoginSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        "Username/email and password are required.",
      );
    }
    const { identifier, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
      },
    });

    // Same response shape for "user not found" and "wrong password" so
    // we don't leak which accounts exist.
    if (!user || !user.passwordHash) {
      console.warn(`[auth] failed login for "${identifier}" from ${ip}`);
      return failFromCode("unauthenticated", "Invalid username or password.", 401);
    }
    const ok2 = await verifyPassword(password, user.passwordHash);
    if (!ok2) {
      console.warn(`[auth] failed login for "${identifier}" from ${ip}`);
      return failFromCode("unauthenticated", "Invalid username or password.", 401);
    }

    const role: AuthRole = user.role === "CANDIDATE" ? "candidate" : "employer";
    const token = await signSession({
      userId: user.id,
      role,
      isJudge: user.isJudgeAccount,
      sessionVersion: user.sessionVersion,
    });
    await setSessionCookie(token);

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role,
      isJudge: user.isJudgeAccount,
    };
    return ok({ user: safeUser });
  } catch (err) {
    return failFromUnknown(err);
  }
}
