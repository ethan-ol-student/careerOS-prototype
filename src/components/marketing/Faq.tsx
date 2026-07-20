"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Common SaaS friction-point questions, answered honestly for Career OS. */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Is my data private and secure?",
    a: "Yes. Your data only powers your own insights. Employers can see you ONLY if you switch on Discovery — it's off by default. Any salary you enter stays private to you, and optional self-identification answers are never shared or used for matching.",
  },
  {
    q: "Do I need to sign in to try it?",
    a: "No — the Judge Demo opens the full experience with zero sign-up, using two clearly-labelled demo accounts. When you're ready for your own profile, creating an account takes under a minute.",
  },
  {
    q: "Is Career OS free?",
    a: "It's free during the judge demo preview. Core scoring — your readiness, matches, and every “Why this?” explanation — is always free. A Pro tier gates exactly three premium exports (resume PDF, the fair-pay report, and the detailed skill bridge); nothing essential sits behind a paywall.",
  },
  {
    q: "How does matching work — is it a black box?",
    a: "Every score comes from deterministic, explainable engines: the same inputs always produce the same result, and each recommendation ships with its reasons. Open any match to see the exact skills, evidence, and trade-offs behind it.",
  },
  {
    q: "Can I use my existing resume?",
    a: "Yes. Paste or upload your CV during onboarding and Career OS auto-fills what it can confidently read — you review the rest. When your profile is complete you can export a polished PDF, and deeper integrations are on the roadmap.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-border/10 mx-auto w-full max-w-3xl divide-y">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="group-hover:text-brand text-base font-medium tracking-tight transition-colors sm:text-lg">
                {f.q}
              </span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-5 shrink-0 transition-transform duration-300",
                  isOpen && "text-brand rotate-180",
                )}
                aria-hidden
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="text-muted-foreground pb-5 text-pretty text-sm leading-relaxed sm:text-base">
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
