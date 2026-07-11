import { Beaker } from "lucide-react";

/**
 * Marketplace-wide demo notice. Career OS is in research preview and
 * the employer surface renders against a fixed pool of mock candidates
 * defined in `src/lib/candidates/data.ts`. The banner exists so that
 * employers, partners, and reviewers can never mistake those profiles
 * for real, contactable people.
 *
 * Keep the styling intentionally calm — informative, not alarming —
 * and consistent with the rest of the employer shell.
 */
export function DemoDataBanner() {
  return (
    <div className="border-b border-border/15 bg-luminous/5 px-4 py-2">
      <div className="max-w-container mx-auto flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="bg-luminous/15 text-luminous-soft flex size-6 shrink-0 items-center justify-center rounded-lg">
          <Beaker className="size-3.5" aria-hidden />
        </span>
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Demo data
        </p>
        <p className="text-muted-foreground text-xs">
          Candidate profiles shown here are fictional samples for the
          Career OS research preview — they aren&apos;t real people.
        </p>
      </div>
    </div>
  );
}
