import { getResumeData } from "@/lib/resume/data";
import { resumeCompleteness } from "@/lib/resume/completeness";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** GET /api/me/resume — live resume data + completeness meter. */
export async function GET() {
  try {
    const data = await getResumeData();
    return ok({ data, completeness: resumeCompleteness(data) });
  } catch (err) {
    return failFromUnknown(err);
  }
}
