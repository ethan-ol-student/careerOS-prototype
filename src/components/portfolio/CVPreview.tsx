"use client";

import {
  Mail,
  MapPin,
  Compass,
  Award as AwardIcon,
  GraduationCap,
  Briefcase,
  FolderGit2,
} from "lucide-react";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { useIntent } from "@/lib/context/IntentContext";

/**
 * Live, document-style CV preview that updates in real time as
 * the user edits the builder on the left. Styled to look like a
 * paper résumé that sits on top of the dark dashboard surface.
 */
export function CVPreview() {
  const { portfolio, isHydrated } = usePortfolio();
  const { intent } = useIntent();
  const firstName = intent.name.split(" ")[0] || "Friend";

  if (!isHydrated) {
    return (
      <div className="glass-3 flex items-center justify-center rounded-2xl p-12">
        <p className="text-muted-foreground text-sm">Loading CV…</p>
      </div>
    );
  }

  return (
    <div className="glass-3 rounded-2xl p-3 sm:p-4">
      {/* "Paper" surface */}
      <div className="bg-background text-foreground border-border/60 relative overflow-hidden rounded-xl border shadow-2xl">
        <div
          aria-hidden
          className="from-luminous/10 pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent"
        />

        {/* Header */}
        <header className="border-border/40 relative border-b px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-luminous text-[10px] font-semibold uppercase tracking-[0.22em]">
            Living portfolio · live
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {intent.name || firstName}
          </h1>
          {portfolio.headline ? (
            <p className="text-foreground/85 mt-1 text-sm sm:text-base">
              {portfolio.headline}
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm italic">
              Add a headline in the builder to set the tone.
            </p>
          )}

          <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            {intent.field && (
              <span className="flex items-center gap-1">
                <Compass className="size-3" />
                {intent.field}
              </span>
            )}
            {intent.targetJob && (
              <span className="flex items-center gap-1">
                <Briefcase className="size-3" />
                Targeting {intent.targetJob}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail className="size-3" />
              {firstName.toLowerCase()}@career-os.dev
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              Asia · open to remote
            </span>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-x-6 gap-y-6 px-6 py-6 sm:px-8">
          {/* Left column: summary + experience + projects */}
          <div className="col-span-12 flex flex-col gap-6 md:col-span-8">
            <CVSection title="Summary" empty="Write a summary in the builder.">
              {portfolio.summary && (
                <p className="text-foreground/85 text-sm leading-relaxed">
                  {portfolio.summary}
                </p>
              )}
            </CVSection>

            <CVSection
              title="Experience"
              empty="Add roles, internships, or work in the Experience tab."
              icon={Briefcase}
            >
              {portfolio.experiences.length > 0 && (
                <ul className="flex flex-col gap-4">
                  {portfolio.experiences.map((e) => (
                    <li
                      key={e.id}
                      className="border-luminous/40 border-l-2 pl-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <p className="text-sm font-semibold">{e.role}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {e.period}
                        </p>
                      </div>
                      <p className="text-foreground/80 text-xs">{e.company}</p>
                      {e.detail && (
                        <p className="text-foreground/75 mt-1.5 text-xs leading-snug">
                          {e.detail}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CVSection>

            <CVSection
              title="Projects"
              empty="Add projects in the Projects tab."
              icon={FolderGit2}
            >
              {portfolio.projects.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {portfolio.projects.map((p) => (
                    <li key={p.id} className="text-sm">
                      <p className="font-semibold">{p.title}</p>
                      {p.description && (
                        <p className="text-foreground/75 text-xs leading-snug">
                          {p.description}
                        </p>
                      )}
                      {p.link && (
                        <p className="text-luminous truncate text-[11px]">
                          {p.link}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CVSection>
          </div>

          {/* Right column: skills + certificates + awards */}
          <div className="col-span-12 flex flex-col gap-6 md:col-span-4">
            <CVSection title="Skills" empty="Add skills in the Skills tab.">
              {portfolio.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {portfolio.skills.map((s) => (
                    <span
                      key={s}
                      className="bg-luminous/15 text-luminous border-luminous/40 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </CVSection>

            <CVSection
              title="Certificates"
              icon={GraduationCap}
              empty="Add certificates in the Certificates tab."
            >
              {portfolio.certificates.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {portfolio.certificates.map((c) => (
                    <li key={c.id} className="text-xs">
                      <p className="text-foreground font-medium">{c.title}</p>
                      <p className="text-muted-foreground">
                        {c.issuer}
                        {c.year ? ` · ${c.year}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CVSection>

            <CVSection
              title="Awards"
              icon={AwardIcon}
              empty="Add awards in the Awards tab."
            >
              {portfolio.awards.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {portfolio.awards.map((a) => (
                    <li key={a.id} className="text-xs">
                      <p className="text-foreground font-medium">
                        {a.title}
                        {a.year ? ` · ${a.year}` : ""}
                      </p>
                      {a.description && (
                        <p className="text-muted-foreground leading-snug">
                          {a.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CVSection>
          </div>
        </div>

        <footer className="border-border/40 flex items-center justify-between border-t px-6 py-3 sm:px-8">
          <p className="text-muted-foreground text-[10px]">
            Updated in real time · saved locally
          </p>
          <p className="text-muted-foreground font-mono text-[10px]">
            {portfolio.totalAdditions} edits
          </p>
        </footer>
      </div>
    </div>
  );
}

function CVSection({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  empty: string;
  children: React.ReactNode;
}) {
  const isEmpty =
    children === null ||
    children === undefined ||
    children === false ||
    (Array.isArray(children) && children.length === 0);
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="text-muted-foreground size-3" />}
        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
          {title}
        </p>
      </div>
      {isEmpty ? (
        <p className="text-muted-foreground/70 text-[11px] italic">{empty}</p>
      ) : (
        children
      )}
    </section>
  );
}
