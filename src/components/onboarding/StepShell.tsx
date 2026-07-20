"use client";

import { ReactNode } from "react";
import { Compass } from "lucide-react";
import { LayoutLines } from "@/components/ui/LayoutLines";
import { Badge } from "@/components/ui/Badge";
import { CarrieWidget } from "@/components/carrie/CarrieWidget";

interface StepShellProps {
  /** Omit both to hide the step counter + progress bar (edit overview). */
  stepNumber?: number;
  totalSteps?: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function StepShell({
  stepNumber,
  totalSteps,
  eyebrow = "Onboarding",
  title,
  subtitle,
  children,
  footer,
}: StepShellProps) {
  const progress =
    stepNumber !== undefined && totalSteps ? (stepNumber / totalSteps) * 100 : null;

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <LayoutLines />

      <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <div className="max-w-container relative mx-auto">
          <div className="flex items-center justify-between py-4">
            {/* Not a link during onboarding — leaving the flow via the logo
                stranded users on the landing page while still signed in. */}
            <span className="flex items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight">
              {/* Role-aware accent: --btn-from is luminous on candidate
                  shells, clover under data-role-accent="employer". */}
              <Compass className="size-5 text-(--btn-from)" />
              Career OS
            </span>
            {progress !== null && (
              <p className="text-muted-foreground font-mono text-xs">
                Step {stepNumber} of {totalSteps}
              </p>
            )}
          </div>
          {progress !== null && (
            <div className="bg-foreground/8 h-0.75 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-(--btn-from) transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pt-12 pb-16">
        <div className="max-w-container mx-auto grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 mb-2 lg:col-span-9">
            <Badge variant="outline" className="mb-4">
              <span className="text-muted-foreground">{eyebrow}</span>
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-4 max-w-2xl text-base sm:text-lg">
                {subtitle}
              </p>
            )}
          </div>
          <div className="col-span-12">{children}</div>
        </div>
      </main>

      {footer && (
        <footer className="line-t bg-background/60 backdrop-blur-sm sticky bottom-0 z-20">
          <div className="max-w-container mx-auto px-4 py-4">{footer}</div>
        </footer>
      )}

      <CarrieWidget />
    </div>
  );
}
