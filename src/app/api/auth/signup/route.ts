import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/auth/rateLimit";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";
import type { AuthRole, AuthUser } from "@/lib/auth/types";

const SignupSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, . _ -"),
    email: z.string().email().max(120),
    password: z.string().min(8).max(120),
    confirmPassword: z.string(),
    role: z.enum(["candidate", "employer"]),
    name: z.string().max(120).optional(),
    organizationName: z.string().max(120).optional(),
    careerGoal: z.string().max(120).optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

/** POST /api/auth/signup — create a new user + profile + session. */
export async function POST(request: Request) {
  try {
    // Throttle automated sign-up abuse per IP.
    const ip = clientIp(request);
    const rl = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return failFromCode(
        "rate_limited",
        "Too many sign-up attempts. Please wait a minute and try again.",
        429,
      );
    }

    const json = await request.json();
    const parsed = SignupSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid signup payload.",
      );
    }
    const {
      username,
      email,
      password,
      role,
      name,
      organizationName,
      careerGoal,
    } = parsed.data;

    // Conflict checks — friendly errors before bcrypt work.
    const [emailTaken, usernameTaken] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);
    if (emailTaken) {
      return failFromCode("conflict", "An account with this email already exists.", 409);
    }
    if (usernameTaken) {
      return failFromCode("conflict", "That username is taken.", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: name ?? null,
        role: role === "candidate" ? "CANDIDATE" : "EMPLOYER",
        ...(role === "candidate"
          ? {
              candidateProfile: {
                create: {
                  name: name ?? "",
                  targetJob: careerGoal ?? "",
                },
              },
            }
          : {
              employerProfile: {
                create: {
                  organizationName: organizationName ?? null,
                },
              },
            }),
      },
    });

    const token = await signSession({
      userId: user.id,
      role: role as AuthRole,
      isJudge: false,
    });
    await setSessionCookie(token);

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: role as AuthRole,
      isJudge: false,
    };
    return ok({ user: safeUser });
  } catch (err) {
    return failFromUnknown(err);
  }
}
