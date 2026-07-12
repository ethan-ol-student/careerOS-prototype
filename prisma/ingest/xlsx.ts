/**
 * Minimal, dependency-free .xlsx reader (ZIP + SpreadsheetML). Enough to pull
 * the O*NET sheets we ingest — no SheetJS, no Python. An .xlsx is a ZIP of XML;
 * we parse the central directory, inflate entries with node:zlib, resolve the
 * shared-strings table, and read the first worksheet's cells.
 *
 * ponytail: one-off ingestion helper. Handles shared/inline strings + numbers
 * (all O*NET needs). Not a general xlsx library — no styles, dates, or formulas.
 */
import { readFileSync } from "fs";
import { inflateRawSync } from "zlib";

function unzip(buf: Buffer): Map<string, Buffer> {
  // End of Central Directory record (scan from the tail).
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("xlsx: EOCD not found");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16); // central directory offset

  const entries: { name: string; method: number; compSize: number; offset: number }[] = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    entries.push({ name, method, compSize, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }

  const out = new Map<string, Buffer>();
  for (const e of entries) {
    const lh = e.offset;
    if (buf.readUInt32LE(lh) !== 0x04034b50) continue;
    const nameLen = buf.readUInt16LE(lh + 26);
    const extraLen = buf.readUInt16LE(lh + 28);
    const start = lh + 30 + nameLen + extraLen;
    const comp = buf.subarray(start, start + e.compSize);
    out.set(e.name, e.method === 0 ? comp : inflateRawSync(comp));
  }
  return out;
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

function sharedStrings(xml: string | undefined): string[] {
  if (!xml) return [];
  const out: string[] = [];
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml))) {
    let text = "";
    const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let tm: RegExpExecArray | null;
    while ((tm = tRe.exec(m[1]))) text += decodeXml(tm[1]);
    out.push(text);
  }
  return out;
}

function colToIdx(ref: string): number {
  const letters = /^([A-Z]+)/.exec(ref)?.[1] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Rows of raw cell strings from the first worksheet. */
export function readSheet(path: string): string[][] {
  const files = unzip(readFileSync(path));
  const shared = sharedStrings(files.get("xl/sharedStrings.xml")?.toString("utf8"));
  const sheetKey =
    [...files.keys()].find((k) => /^xl\/worksheets\/sheet1\.xml$/.test(k)) ??
    [...files.keys()].find((k) => /^xl\/worksheets\/.*\.xml$/.test(k));
  if (!sheetKey) throw new Error("xlsx: no worksheet");
  const xml = files.get(sheetKey)!.toString("utf8");

  const rows: string[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml))) {
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1] ?? "";
      const body = cm[2] ?? "";
      const col = colToIdx(/r="([A-Z]+\d+)"/.exec(attrs)?.[1] ?? "");
      const t = /t="([^"]+)"/.exec(attrs)?.[1];
      let val = "";
      if (t === "s") {
        const idx = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        val = idx ? shared[parseInt(idx, 10)] ?? "" : "";
      } else if (t === "inlineStr") {
        val = decodeXml(/<t\b[^>]*>([\s\S]*?)<\/t>/.exec(body)?.[1] ?? "");
      } else {
        val = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
      }
      const target = col >= 0 ? col : cells.length;
      while (cells.length < target) cells.push("");
      cells[target] = val;
    }
    rows.push(cells);
  }
  return rows;
}

/** First row as header → array of records. */
export function readRecords(path: string): Record<string, string>[] {
  const rows = readSheet(path);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => {
      o[h] = (r[i] ?? "").trim();
    });
    return o;
  });
}
