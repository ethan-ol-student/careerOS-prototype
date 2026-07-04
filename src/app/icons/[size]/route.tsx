import { renderBrandIcon } from "@/lib/pwa/brandIcon";
import { failFromCode } from "@/lib/api/respond";

/**
 * PWA icon set, generated on demand (no binary assets):
 *   /icons/192 · /icons/512 · /icons/maskable (512, safe-zone padded).
 * Referenced by src/app/manifest.ts.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  if (size === "192") return renderBrandIcon(192);
  if (size === "512") return renderBrandIcon(512);
  if (size === "maskable") return renderBrandIcon(512, true);
  return failFromCode("not_found", "Not found.", 404);
}
