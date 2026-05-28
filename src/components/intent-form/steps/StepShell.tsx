"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { LayoutLines } from "@/components/ui/LayoutLines";
import { Badge } from "@/components/ui/Badge";

interface StepShellProps {
  stepNumber: number;
  totalSteps: number;
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
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <LayoutLines />

      <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <div className="max-w-container relative mx-auto">
          <div className="flex items-center justify-between py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-luminous" />
              Career OS
            </Link>
            <p className="text-muted-foreground font-mono text-xs">
              Step {stepNumber} of {totalSteps}
            </p>
          </div>
          <div className="bg-muted/40 h-0.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-luminous h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pt-12 pb-16">
        <div className="max-w-container mx-auto grid grid-cols-12 gap-4 sm:gap-6">
          <div className="col-span-12 mb-2 lg:col-span-9">
            <Badge variant="outline" className="mb-4">
              <span className="text-muted-foreground">{eyebrow}</span>
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
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
    </div>
  );
}
