/**
 * Server-only helpers for the dev/test API routes.
 *
 * SECURITY: never import this from client code. Every dev route calls
 * `devModeGuard()` first (404s when the flag is off) and operates ONLY
 * on the seeded test account — resolved here by the known username, never
 * from a client-supplied id — so real users can never be affected.
 *
 * (This module imports `prisma` + `next/headers` cookies, so it is
 * inherently server-only and cannot be bundled into client code.)
 */

import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie, readSession } from "@/lib/auth/session";
import { failFromCode } from "@/lib/api/respond";
import { ForbiddenError } from "@/lib/api/errors";
import { normalizeCareerPhase } from "@/lib/dashboard/phaseConfig";
import {
  isTestModeEnabled,
  TEST_ADMIN_USERNAME,
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_NAME,
  TEST_ORG_NAME,
  TEST_ADMIN_PASSWORD,
  type DevStatus,
  type DevUserMode,
} from "./testMode";

/**
 * Gate for every dev route. Returns a 404 response when test mode is
 * disabled (so the routes are indistinguishable from non-existent in
 * production), or null when the caller may proceed.
 */
export function devModeGuard(): NextResponse | null {
  if (!isTestModeEnabled()) {
    return failFromCode("not_found", "Not found.", 404);
  }
  return null;
}

export interface TestContext {
  user: {
    id: string;
    username: string | null;
    email: string;
    name: string | null;
    role: "CANDIDATE" | "EMPLOYER";
  };
  candidateProfileId: string;
  employerProfileId: string;
}

/**
 * Ensures the dev test account exists with BOTH candidate + employer
 * profiles (so one account can exercise either side), then returns the
 * ids needed by the dev routes. Idempotent — safe to call on every request.
 */
export async function loadTestContext(): Promise<TestContext> {
  let user = await prisma.user.findUnique({
    where: { username: TEST_ADMIN_USERNAME },
    include: {
      candidateProfile: { select: { id: true } },
      employerProfile: { select: { id: true } },
      candidatesAI: { select: { id: true } },
      employersAI: { select: { id: true } },
    },
  });

  if (!user) {
    const passwordHash = await hashPassword(TEST_ADMIN_PASSWORD);
    user = await prisma.user.create({
      data: {
        email: TEST_ADMIN_EMAIL,
        username: TEST_ADMIN_USERNAME,
        passwordHash,
        name: TEST_ADMIN_NAME,
        role: "CANDIDATE",
        candidateProfile: { create: { name: TEST_ADMIN_NAME } },
        candidatesAI: { create: {} },
        employerProfile: { create: { organizationName: TEST_ORG_NAME } },
        employersAI: { create: {} },
      },
      include: {
        candidateProfile: { select: { id: true } },
        employerProfile: { select: { id: true } },
        candidatesAI: { select: { id: true } },
        employersAI: { select: { id: true } },
      },
    });
  } else {
    // Backfill any missing child rows (e.g. account predates this feature).
    if (!user.candidateProfile) {
      await prisma.candidateProfile.create({
        data: { userId: user.id, name: TEST_ADMIN_NAME },
      });
    }
    if (!user.candidatesAI) {
      await prisma.candidatesAI.create({ data: { userId: user.id } });
    }
    if (!user.employerProfile) {
      await prisma.employerProfile.create({
        data: { userId: user.id, organizationName: TEST_ORG_NAME },
      });
    }
    if (!user.employersAI) {
      await prisma.employersAI.create({ data: { userId: user.id } });
    }
    if (
      !user.candidateProfile ||
      !user.employerProfile ||
      !user.candidatesAI ||
      !user.employersAI
    ) {
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          candidateProfile: { select: { id: true } },
          employerProfile: { select: { id: true } },
          candidatesAI: { select: { id: true } },
          employersAI: { select: { id: true } },
        },
      });
    }
  }

  if (!user?.candidateProfile || !user?.employerProfile) {
    throw new Error("Failed to provision the test account profiles.");
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    candidateProfileId: user.candidateProfile.id,
    employerProfileId: user.employerProfile.id,
  };
}

/**
 * Log in a named demo account (resolved by username server-side, never a
 * client id) in the chosen role. Backup for demo-login security: refuses any
 * account that isn't a demo account (`isJudgeAccount`), so this can never
 * sign in a real user even if the username is guessed.
 */
export async function setDemoSession(
  username: string,
  role: DevUserMode,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isJudgeAccount) {
    throw new ForbiddenError("Not a demo account.");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { role: role === "candidate" ? "CANDIDATE" : "EMPLOYER" },
  });
  // Carry the account's current sessionVersion so the token passes the
  // revocation check in getAuthUser (a prior logout may have bumped it).
  const token = await signSession({
    userId: user.id,
    role,
    sessionVersion: user.sessionVersion,
  });
  await setSessionCookie(token);
}

/** Set the test account's role and (re)issue its session cookie. */
export async function setTestRoleAndSession(role: DevUserMode): Promise<void> {
  const ctx = await loadTestContext();
  const updated = await prisma.user.update({
    where: { id: ctx.user.id },
    data: { role: role === "candidate" ? "CANDIDATE" : "EMPLOYER" },
  });
  // Sign with the current sessionVersion (see setDemoSession).
  const token = await signSession({
    userId: ctx.user.id,
    role,
    sessionVersion: updated.sessionVersion,
  });
  await setSessionCookie(token);
}

/** Gathers a full snapshot of the test account for the panel. */
export async function buildDevStatus(): Promise<DevStatus> {
  const ctx = await loadTestContext();

  const [
    candidateProfile,
    candidatesAI,
    employerProfile,
    employersAI,
    projectCount,
    experienceCount,
    chapters,
    candNotifTotal,
    candNotifUnread,
    saved,
    invites,
    empNotifTotal,
    empNotifUnread,
    conversations,
    sampleCandidate,
    session,
  ] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { id: ctx.candidateProfileId } }),
    prisma.candidatesAI.findUnique({ where: { userId: ctx.user.id } }),
    prisma.employerProfile.findUnique({ where: { id: ctx.employerProfileId } }),
    prisma.employersAI.findUnique({ where: { userId: ctx.user.id } }),
    prisma.project.count({ where: { profileId: ctx.candidateProfileId } }),
    prisma.experience.count({ where: { profileId: ctx.candidateProfileId } }),
    prisma.chapterEvent.count({ where: { profileId: ctx.candidateProfileId } }),
    prisma.candidateNotification.count({ where: { profileId: ctx.candidateProfileId } }),
    prisma.candidateNotification.count({
      where: { profileId: ctx.candidateProfileId, read: false },
    }),
    prisma.employerSavedCandidate.count({ where: { employerId: ctx.employerProfileId } }),
    prisma.employerInvitedCandidate.count({ where: { employerId: ctx.employerProfileId } }),
    prisma.employerNotification.count({ where: { employerId: ctx.employerProfileId } }),
    prisma.employerNotification.count({
      where: { employerId: ctx.employerProfileId, read: false },
    }),
    prisma.chatConversation.count({ where: { employerId: ctx.employerProfileId } }),
    prisma.candidate.findFirst({
      orderBy: { matchScore: "desc" },
      select: { id: true },
    }),
    readSession(),
  ]);

  const careerStage = candidatesAI?.careerStage ?? "";
  const hasAdvancedData = !!(
    candidatesAI &&
    (candidatesAI.targetRoles.length > 0 ||
      candidatesAI.currentSkills.length > 0 ||
      candidatesAI.projects.length > 0 ||
      candidatesAI.desiredNextMove.trim().length > 0)
  );
  const portfolioFilled = !!(
    candidateProfile &&
    (candidateProfile.headline.trim() !== "" ||
      candidateProfile.summary.trim() !== "" ||
      candidateProfile.bio.trim() !== "" ||
      candidateProfile.skills.length > 0 ||
      projectCount > 0 ||
      experienceCount > 0)
  );
  const hasAIData = !!(
    employersAI &&
    (employersAI.onboardingCompleted ||
      employersAI.requiredSkills.length > 0 ||
      employersAI.targetRoles.length > 0 ||
      employersAI.companyType.trim() !== "")
  );

  return {
    testModeEnabled: true,
    account: {
      username: ctx.user.username ?? TEST_ADMIN_USERNAME,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role === "CANDIDATE" ? "candidate" : "employer",
    },
    session: {
      signedIn: !!session,
      role: session?.role ?? null,
      isTestAccount: session?.userId === ctx.user.id,
    },
    candidate: {
      onboardingCompleted: !!candidatesAI?.onboardingCompleted,
      careerStage,
      phase: normalizeCareerPhase(careerStage),
      hasAdvancedData,
      skills: candidateProfile?.skills.length ?? 0,
      portfolioFilled,
      chapters,
      notificationsTotal: candNotifTotal,
      notificationsUnread: candNotifUnread,
    },
    employer: {
      onboardingCompleted: !!employerProfile?.hasCompletedOnboarding,
      hasAIData,
      saved,
      invites,
      notificationsTotal: empNotifTotal,
      notificationsUnread: empNotifUnread,
      conversations,
    },
    sampleCandidateId: sampleCandidate?.id ?? null,
  };
}
