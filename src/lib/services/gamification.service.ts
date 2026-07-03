import { prisma } from "@/lib/prisma";
import type { CareerPhase } from "@/lib/dashboard/types";

/**
 * Gamification core (Feature 4), age-tuned:
 * - Younger phases (student → early_career): daily check-in, streaks, XP.
 * - Mid-career+ (mid_career, senior_career, executive): a quiet MONTHLY
 *   "Career Check-Up" — no daily nudges, XP de-emphasised.
 *
 * Anti-dark-pattern rules: XP only for real actions (check-in is one
 * deliberate action per period); streaks are FORGIVABLE (one missed
 * period is bridged, not reset); no loss-aversion messaging.
 */

export type Cadence = "daily" | "monthly";

export function cadenceForPhase(phase: CareerPhase): Cadence {
  return phase === "mid_career" || phase === "senior_career" || phase === "executive"
    ? "monthly"
    : "daily";
}

const XP_PER_CHECKIN: Record<Cadence, number> = { daily: 10, monthly: 25 };

/** Streak badges awarded at these `current` values. */
const STREAK_BADGES: Record<Cadence, Record<number, string>> = {
  daily: { 3: "streak-3", 7: "streak-7", 30: "streak-30" },
  monthly: { 3: "checkup-3", 6: "checkup-6", 12: "checkup-12" },
};

/** Whole-period index since epoch (UTC) — day number or month number. */
function periodIndex(date: Date, cadence: Cadence): number {
  return cadence === "daily"
    ? Math.floor(date.getTime() / 86_400_000)
    : date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export interface CheckInResult {
  ok: boolean;
  alreadyCheckedIn: boolean;
  xpGained: number;
  streak: { current: number; best: number; cadence: Cadence };
  newBadges: string[];
}

export async function checkIn(
  profileId: string,
  phase: CareerPhase,
): Promise<CheckInResult> {
  const cadence = cadenceForPhase(phase);
  const now = new Date();
  const nowIdx = periodIndex(now, cadence);

  const streak = await prisma.streak.upsert({
    where: { profileId },
    create: { profileId, cadence },
    update: { cadence }, // phase changes retune the cadence in place
  });

  if (streak.lastCheckIn && periodIndex(streak.lastCheckIn, cadence) === nowIdx) {
    return {
      ok: true,
      alreadyCheckedIn: true,
      xpGained: 0,
      streak: { current: streak.current, best: streak.best, cadence },
      newBadges: [],
    };
  }

  // Forgivable streak: continue if last check-in was the previous period
  // OR the one before (one missed period bridged); otherwise restart at 1.
  const lastIdx = streak.lastCheckIn
    ? periodIndex(streak.lastCheckIn, cadence)
    : null;
  const current =
    lastIdx !== null && nowIdx - lastIdx <= 2 ? streak.current + 1 : 1;
  const best = Math.max(streak.best, current);

  const xp = XP_PER_CHECKIN[cadence];
  const badgeKeys: string[] = [];
  if (!streak.lastCheckIn) badgeKeys.push("first-checkin");
  const milestone = STREAK_BADGES[cadence][current];
  if (milestone) badgeKeys.push(milestone);

  const [, , newBadges] = await prisma.$transaction([
    prisma.streak.update({
      where: { profileId },
      data: { current, best, cadence, lastCheckIn: now },
    }),
    prisma.xpLedger.create({
      data: {
        profileId,
        amount: xp,
        reason: cadence === "daily" ? "Daily check-in" : "Monthly Career Check-Up",
      },
    }),
    prisma.badge.createManyAndReturn({
      data: badgeKeys.map((key) => ({ profileId, key })),
      skipDuplicates: true,
    }),
  ]);

  return {
    ok: true,
    alreadyCheckedIn: false,
    xpGained: xp,
    streak: { current, best, cadence },
    newBadges: newBadges.map((b) => b.key),
  };
}

export interface GamificationState {
  xpTotal: number;
  streak: { current: number; best: number; cadence: Cadence; lastCheckIn: Date | null };
  badges: { key: string; earnedAt: Date }[];
  checkedInThisPeriod: boolean;
}

export async function getState(
  profileId: string,
  phase: CareerPhase,
): Promise<GamificationState> {
  const cadence = cadenceForPhase(phase);
  const [xp, streak, badges] = await Promise.all([
    prisma.xpLedger.aggregate({ where: { profileId }, _sum: { amount: true } }),
    prisma.streak.findUnique({ where: { profileId } }),
    prisma.badge.findMany({ where: { profileId }, orderBy: { earnedAt: "asc" } }),
  ]);
  const lastCheckIn = streak?.lastCheckIn ?? null;
  return {
    xpTotal: xp._sum.amount ?? 0,
    streak: {
      current: streak?.current ?? 0,
      best: streak?.best ?? 0,
      cadence,
      lastCheckIn,
    },
    badges: badges.map((b) => ({ key: b.key, earnedAt: b.earnedAt })),
    checkedInThisPeriod:
      !!lastCheckIn &&
      periodIndex(lastCheckIn, cadence) === periodIndex(new Date(), cadence),
  };
}
