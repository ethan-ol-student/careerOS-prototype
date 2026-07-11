"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ParsedCv } from "@/lib/cv-parser/heuristics";
import { cn } from "@/lib/utils";

type Status = "idle" | "parsing" | "done" | "error";

const STAGE_TEXT: Record<string, string> = {
  reading: "Reading your CV…",
  parsing: "Finding your experience…",
  filling: "Filling in what we found…",
};

/**
 * CV upload zone (drag-drop + click). The parser module — worker, pdfjs,
 * mammoth, heuristics — is dynamic-imported HERE on first upload, so none
 * of it touches the initial bundle; all parsing runs in a Web Worker.
 */
export function UploadZone({
  onParsed,
  onBusyChange,
  summary,
}: {
  /** Merge a successful parse into the draft; returns the success text. */
  onParsed: (cv: ParsedCv, fileName: string) => string;
  /** Lets the page disable Continue while a parse is running. */
  onBusyChange: (busy: boolean) => void;
  /** Sticky success summary once a CV has been applied (survives remounts). */
  summary?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(summary ? "done" : "idle");
  const [stage, setStage] = useState("reading");
  const [message, setMessage] = useState<string | null>(summary ?? null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || status === "parsing") return;
    setStatus("parsing");
    setStage("reading");
    onBusyChange(true);
    try {
      // Code-split boundary: nothing parser-related loads before this line.
      const { parseCvFile } = await import("@/lib/cv-parser");
      const cv = await parseCvFile(file, setStage);
      setMessage(onParsed(cv, file.name));
      setStatus("done");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "We couldn't parse that file. Add your details manually instead.",
      );
      setStatus("error");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "rounded-2xl border border-dashed p-5 text-center transition-colors",
        dragging ? "border-luminous/60 bg-luminous/10" : "border-border/20 bg-foreground/2",
        status === "done" && "border-clover/60 bg-clover/5",
        status === "error" && "border-destructive/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        aria-label="Upload your CV"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      {status === "parsing" ? (
        <div aria-live="polite" className="flex flex-col items-center gap-3 py-2">
          <Loader2 className="text-luminous size-6 animate-spin" aria-hidden />
          <p className="text-sm font-medium">{STAGE_TEXT[stage] ?? STAGE_TEXT.reading}</p>
          {/* Indeterminate bar — luminous, animated. */}
          <div className="bg-foreground/8 h-1 w-56 overflow-hidden rounded-full">
            <div className="bg-luminous h-full w-full origin-left animate-pulse rounded-full" />
          </div>
        </div>
      ) : status === "done" ? (
        <div aria-live="polite" className="flex flex-col items-center gap-2 py-1">
          <CheckCircle2 className="text-clover size-6" aria-hidden />
          <p className="text-clover text-sm font-medium">{message}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-muted-foreground text-xs hover:underline"
          >
            Upload a different file
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-1">
          {status === "error" && (
            <div
              aria-live="assertive"
              className="border-destructive/40 bg-destructive/10 mb-2 w-full rounded-lg border px-3 py-2 text-left"
            >
              <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                Couldn&apos;t read that CV
              </p>
              <p className="text-destructive/90 mt-1 text-xs">{message}</p>
            </div>
          )}
          <Upload className="text-luminous size-6" aria-hidden />
          <p className="text-sm font-medium">Quick upload your CV</p>
          <p className="text-muted-foreground text-xs">
            Drag & drop a PDF or DOCX (max 5MB) — we fill what we find, you confirm.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()}>
              <FileUp className="size-3.5" />
              Choose file
            </Button>
            {/* ponytail: no LinkedIn OAuth backend — honest placeholder. */}
            <Button size="sm" variant="outline" disabled title="Coming soon">
              Import from LinkedIn — soon
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">
            No CV? No problem — everything below can be added manually.
          </p>
        </div>
      )}
    </div>
  );
}
