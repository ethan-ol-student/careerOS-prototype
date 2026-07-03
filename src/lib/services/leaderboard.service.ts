import { prisma } from "@/lib/prisma";

/**
 * University employability leaderboard — curated, cited demo data (seeded
 * from prisma/data/universities.csv). Never derived from real users; no
 * user data is ever ranked or exposed here.
 */
export async function listUniversities() {
  return prisma.university.findMany({
    orderBy: [{ score: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      country: true,
      score: true,
      sourceUrl: true,
      isDemo: true,
    },
  });
}
