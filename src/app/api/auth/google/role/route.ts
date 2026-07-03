import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  signSession,
  setSessionCookie,
  verifyTransientToken,
} from "@/lib/auth/session";
import { googleSsoConfigured, GOOGLE_PENDING_COOKIE } from "@/lib/auth/google";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const Schema = z.object({ role: z.enum(["candidate", "employer"]) });

/**
 * POST /api/auth/google/role — finish first-time Google sign-up: verify
 * the pending identity token from the callback, create the user with the
 * chosen role (provisioned exactly like password signup: passwordless,
 * profile row included), link the OAuthAccount, mint the session.
 */
export async function POST(request: Request) {
  if (!googleSsoConfigured()) {
    return failFromCode("not_found", "Not found.", 404);
  }
  try {
    const store = await cookies();
    const pendingRaw = store.get(GOOGLE_PENDING_COOKIE)?.value;
    const pending = pendingRaw ? await verifyTransientToken(pendingRaw) : null;
    if (
      !pending ||
      pending.kind !== "google-pending" ||
      typeof pending.sub !== "string" ||
      typeof pending.email !== "string"
    ) {
      return failFromCode(
        "unauthenticated",
        "Your Google sign-in expired — please try again.",
        401,
      );
    }

    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "role must be candidate or employer.");
    }
    const { role } = parsed.data;
    const name = typeof pending.name === "string" ? pending.name : null;

    // Race guard: the email may have been registered since the callback.
    const taken = await prisma.user.findUnique({
      where: { email: pending.email },
    });
    if (taken) {
      return failFromCode(
        "conflict",
        "An account with this email already exists — sign in with your password instead.",
        409,
      );
    }

    const user = await prisma.user.create({
      data: {
        email: pending.email,
        name,
        role: role === "candidate" ? "CANDIDATE" : "EMPLOYER",
        // Passwordless: `passwordHash` stays null — Google is the credential.
        oauthAccounts: {
          create: {
            provider: "google",
            providerAccountId: pending.sub,
            email: pending.email,
          },
        },
        ...(role === "candidate"
          ? { candidateProfile: { create: { name: name ?? "" } } }
          : { employerProfile: { create: {} } }),
      },
    });

    const token = await signSession({ userId: user.id, role, isJudge: false });
    await setSessionCookie(token);
    store.delete(GOOGLE_PENDING_COOKIE);

    return ok({
      redirect:
        role === "candidate" ? "/candidate/onboarding" : "/employers/onboarding",
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
