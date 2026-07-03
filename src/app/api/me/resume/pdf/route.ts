import { getResumeData } from "@/lib/resume/data";
import { renderResumeBuffer } from "@/lib/resume/pdfTemplate";
import { failFromUnknown } from "@/lib/api/respond";

// @react-pdf/renderer needs the Node runtime (not edge).
export const runtime = "nodejs";

/** GET /api/me/resume/pdf — download the caller's resume as a PDF. */
export async function GET() {
  try {
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
