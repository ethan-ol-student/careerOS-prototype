/**
 * Server-side "who is calling" resolver.
 *
 * Reads the session cookie (`readSession()`), looks up the User
 * row, and returns the appropriate profile row. When no session
 * exists, the helpers throw a 401-flavored error that route
 * handlers can catch and surface as `{ ok: false, error: ... }`.
 */

import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";
import { ForbiddenError, UnauthorizedError } from "./errors";

// Re-exported so existing importers (`@/lib/api/currentUser`) keep working.
export { UnauthorizedError, ForbiddenError } from "./errors";

/** Returns the User row for the current caller, or throws. */
export async function getAuthUser() {
  const session = await readSession();
  if (!session) throw new UnauthorizedError();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new UnauthorizedError("User not found.");
  return user;
}

/** Candidate-side helper. Throws if the caller isn't a candidate. */
export async function getCurrentCandidateProfile() {
  const user = await getAuthUser();
  if (user.role !== "CANDIDATE") {
    throw new ForbiddenError("This action requires a candidate account.");
  }
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
  });
  if (profile) return profile;
  // Defensive — should already exist from signup, but auto-create
  // if somehow missing so the caller never gets a null row.
  return prisma.candidateProfile.create({ data: { userId: user.id } });
}

/** Employer-side helper. Throws if the caller isn't an employer. */
export async function getCurrentEmployerProfile() {
  const user = await getAuthUser();
  if (user.role !== "EMPLOYER") {
    throw new ForbiddenError("This action requires an employer account.");
  }
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });
  if (profile) return profile;
  return prisma.employerProfile.create({ data: { userId: user.id } });
}
