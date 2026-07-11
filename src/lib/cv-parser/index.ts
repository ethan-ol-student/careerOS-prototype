/**
 * Client entry for the CV parser. Loaded ONLY via dynamic import() from the
 * upload handler, so pdfjs + mammoth + heuristics are code-split out of the
 * page bundle.
 *
 * ponytail: parsing runs on the MAIN thread using pdfjs's own in-thread
 * "fake worker" — importing the worker bundle registers globalThis.pdfjsWorker
 * and, with GlobalWorkerOptions.workerSrc left unset, pdf.mjs's #initialize()
 * parses in-thread (see node_modules/pdfjs-dist/build/pdf.mjs). We deliberately
 * do NOT wrap this in our own Web Worker: a worker-inside-a-worker is what
 * silently broke uploads under Turbopack. A CV is 1–3 pages, so the block is
 * ~100–300ms behind the spinner. Upgrade path if that ever bites: ship
 * pdf.worker.min.mjs from /public and set workerSrc to it — pdfjs then parses
 * in its OWN worker, off the main thread, with no nested-worker fragility.
 */
import { parseCvText, type ParsedCv } from "./heuristics";
import { SKILL_TAXONOMY } from "@/lib/skills/taxonomy";

export type ParseStage = "reading" | "parsing" | "filling";

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — reject early
const MAX_PAGES = 10; // ponytail: first 10 pages — CVs beyond that are books

/** Friendly, user-facing failures (size/type/scan) — not programmer errors. */
export class CvParseError extends Error {}

function fileKind(file: File): "pdf" | "docx" | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  return null;
}

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  // Importing the worker bundle registers globalThis.pdfjsWorker, so pdfjs
  // uses its in-thread fake worker instead of trying to spawn one.
  const [pdfjs] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs"),
  ]);
  const task = pdfjs.getDocument({ data: buf });
  try {
    const doc = await task.promise;
    let text = "";
    const pages = Math.min(doc.numPages, MAX_PAGES);
    for (let i = 1; i <= pages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      for (const item of content.items) {
        if ("str" in item) text += item.str + (item.hasEOL ? "\n" : " ");
      }
      text += "\n";
    }
    return text;
  } finally {
    await task.destroy(); // frees the document + worker
  }
}

async function extractDocxText(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  return (await mammoth.extractRawText({ arrayBuffer: buf })).value;
}

export async function parseCvFile(
  file: File,
  onStage?: (stage: ParseStage) => void,
): Promise<ParsedCv> {
  const kind = fileKind(file);
  if (!kind) {
    throw new CvParseError("We can read PDF and DOCX files — or add your details manually.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new CvParseError("That file is over 5MB. Export a lighter PDF, or add your details manually.");
  }

  const buf = await file.arrayBuffer();
  onStage?.("reading");

  let text: string;
  try {
    text = kind === "pdf" ? await extractPdfText(buf) : await extractDocxText(buf);
  } catch (err) {
    // Surface the REAL reason where we can; keep the raw cause in the console.
    const detail = err instanceof Error ? err.message : String(err);
    console.error("CV parse failed:", err);
    if (/password/i.test(detail)) {
      throw new CvParseError("That PDF is password-protected — unlock it or add your details manually.");
    }
    if (/InvalidPDF|structure|corrupt/i.test(detail)) {
      throw new CvParseError("That PDF looks corrupted or incomplete — try re-exporting it, or add your details manually.");
    }
    throw new CvParseError("We couldn't read that file — it may be an unusual format. Add your details manually instead.");
  }

  if (text.trim().length < 40) {
    // Image-only scanned PDF or empty file — be honest, offer the manual path.
    throw new CvParseError(
      "We couldn't find readable text — this looks like a scanned image, not a text PDF. Add your details manually instead.",
    );
  }

  onStage?.("parsing");
  const result = parseCvText(text, SKILL_TAXONOMY);
  onStage?.("filling");
  return result;
}

export type { ParsedCv };
