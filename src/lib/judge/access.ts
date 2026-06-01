import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";

function dashboardForUser(user: {
  role: "CANDIDATE" | "EMPLOYER";
  candidatesAI?: { onboardingCompleted: boolean } | null;
  employerProfile?: { hasCompletedOnboarding: boolean } | null;
}) {
  if (user.role === "EMPLOYER") {
    return user.employerProfile?.hasCompletedOnboarding
      ? "/employers/marketplace"
      : "/employers/onboarding";
  }

  return user.candidatesAI?.onboardingCompleted
    ? "/candidate/dashboard"
    : "/candidate/onboarding";
}

export async function requireJudgeAccount() {
  const session = await readSession();
  if (!session) redirect("/auth?mode=login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      candidatesAI: { select: { onboardingCompleted: true } },
      employerProfile: { select: { hasCompletedOnboarding: true } },
    },
  });

  if (!user) redirect("/auth?mode=login");
  if (!user.isJudgeAccount) redirect(dashboardForUser(user));

  return user;
}
