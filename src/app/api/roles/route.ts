import { prisma } from "@/lib/prisma";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/roles — the curated role-catalog taxonomy (category, title,
 * connected skills). Public reference data for the searchable role
 * dropdown; ~200 rows, so the client filters locally. Supports an
 * optional ?q= server-side filter (matches industry OR title) for
 * callers that prefer it.
 */
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    const rows = await prisma.roleCatalog.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });
    const roles = q
      ? rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q),
        )
      : rows;
    return ok({ roles });
  } catch (err) {
    return failFromUnknown(err);
  }
}
