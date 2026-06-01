import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/marketplace?query=&category=&limit=&cursor=
 *
 * Lists catalog candidates. Filters live in the DB query so this
 * scales beyond the seeded 16 once real data lands. Cursor pagination
 * is omitted for hackathon scope; `limit` clamps the result set.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query")?.trim().toLowerCase() ?? "";
    const category = url.searchParams.get("category") ?? undefined;
    const limit = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get("limit") ?? "100")),
    );

    const candidates = await prisma.candidate.findMany({
      where: {
        // Only surface candidates who are discoverable: seed rows default
        // to visible:true; real candidates flip it via discovery opt-in.
        visible: true,
        ...(category && category !== "Recommended"
          ? { category }
          : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { careerDirection: { contains: query, mode: "insensitive" } },
                { targetRole: { contains: query, mode: "insensitive" } },
                { industry: { contains: query, mode: "insensitive" } },
                { location: { contains: query, mode: "insensitive" } },
                { topSkills: { has: query } },
              ],
            }
          : {}),
      },
      orderBy: { matchScore: "desc" },
      take: limit,
    });

    return ok({ candidates, total: candidates.length });
  } catch (err) {
    return failFromUnknown(err);
  }
}
