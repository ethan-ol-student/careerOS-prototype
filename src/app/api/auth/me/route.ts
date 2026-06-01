import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";
import { ok, failFromUnknown } from "@/lib/api/respond";
import type { AuthRole, AuthUser } from "@/lib/auth/types";

interface AuthMeResponse {
  user: AuthUser | null;
  /** True only for candidates who have completed advanced onboarding. */
  candidateOnboardingCompleted: boolean;
  /** True only for employers who have completed employer onboarding. */
  employerOnboardingCompleted: boolean;
}

/** GET /api/auth/me — current auth user + onboarding flags. */
export async function GET() {
  try {
    const session = await readSession();
    if (!session) {
      return ok<AuthMeResponse>({
        user: null,
        candidateOnboardingCompleted: false,
        employerOnboardingCompleted: false,
      });
    }

    const [user, candidatesAI, employerProfile] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId } }),
      prisma.candidatesAI.findUnique({
        where: { userId: session.userId },
        select: { onboardingCompleted: true },
      }),
      prisma.employerProfile.findUnique({
        where: { userId: session.userId },
        select: { hasCompletedOnboarding: true },
      }),
    ]);

    if (!user) {
      return ok<AuthMeResponse>({
        user: null,
        candidateOnboardingCompleted: false,
        employerOnboardingCompleted: false,
      });
    }

    const role: AuthRole = user.role === "CANDIDATE" ? "candidate" : "employer";
    return ok<AuthMeResponse>({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role,
        isJudge: user.isJudgeAccount,
      },
      candidateOnboardingCompleted:
        user.isJudgeAccount || !!candidatesAI?.onboardingCompleted,
      employerOnboardingCompleted:
        user.isJudgeAccount || !!employerProfile?.hasCompletedOnboarding,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
