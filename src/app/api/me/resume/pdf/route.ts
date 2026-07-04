import { getResumeData } from "@/lib/resume/data";
import { renderResumeBuffer } from "@/lib/resume/pdfTemplate";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { failFromUnknown } from "@/lib/api/respond";

// @react-pdf/renderer needs the Node runtime (not edge).
export const runtime = "nodejs";

/**
 * GET /api/me/resume/pdf — download the caller's resume as a PDF.
 * Pro gate (Career Report): the resume PAGE stays free; only the
 * polished PDF export is entitled. Judges bypass via isJudgeAccount.
 */
export async function GET() {
  try {
    await requireEntitlement(); // 402 for free tier (JSON envelope)
    const data = await getResumeData();
    const buffer = await renderResumeBuffer(data);
    const filename = `${(data.name || "resume").replace(/[^\w-]+/g, "-")}-resume.pdf`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
