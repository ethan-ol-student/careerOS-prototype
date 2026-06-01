/**
 * Prisma client singleton.
 *
 * Next.js dev-mode HMR re-runs modules, which would spawn a fresh
 * PrismaClient on every reload and exhaust the Neon connection
 * pool. Pinning the client to `globalThis` in non-production keeps
 * a single instance across reloads.
 *
 * In production (Vercel serverless) every cold start creates exactly
 * one client per invocation, which is correct — no global needed.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
