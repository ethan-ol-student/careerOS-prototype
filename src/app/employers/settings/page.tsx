"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  SettingsSection,
  SettingsField,
  settingsInputClass,
} from "@/components/settings/SettingsSection";
import { AccountInfoForm } from "@/components/settings/AccountInfoForm";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { useEmployersAI } from "@/lib/hooks/useEmployersAI";

export default function EmployerSettingsPage() {
  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <header className="flex flex-col gap-2">
            <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Settings
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Account &amp; company
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
              Manage your company profile, personal information, and privacy.
              Changes are saved to your account.
            </p>
          </header>

          <CompanyProfileSection />

          <SettingsSection
            title="Hiring profile"
            description="Edit your full hiring preferences — opens edit mode, never restarts onboarding."
          >
            <LinkButton
              href="/employers/onboarding?edit=1"
              size="default"
              icon={<Pencil className="size-4" />}
            >
              Edit hiring profile
            </LinkButton>
          </SettingsSection>

          <SettingsSection
            title="Personal information"
            description="Your account details. Email and username must stay unique."
          >
            <AccountInfoForm />
          </SettingsSection>

          <SettingsSection title="Privacy & session">
            <PrivacySection />
          </SettingsSection>

          <SettingsSection
            title="Delete account"
            description="Danger zone — irreversible."
            danger
          >
            <DeleteAccountSection />
          </SettingsSection>
        </div>
      </main>
    </EmployerAppShell>
  );
}

/** Editable organization name + read-only hiring-profile summary. */
function CompanyProfileSection() {
  const { data: ai } = useEmployersAI();
  const [orgName, setOrgName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/employer/profile", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { organizationName?: string } }
          | null;
        if (cancelled) return;
        if (body?.ok && body.data) setOrgName(body.data.organizationName ?? "");
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/employer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName: orgName }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!res.ok || body?.ok === false) {
        setStatus("error");
        setError(body?.error?.message ?? "Couldn't save.");
        return;
      }
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't save.");
    }
  };

  const industries = ai?.industries ?? [];
  const hiringReasons = ai?.hiringReasons ?? [];

  return (
    <SettingsSection
      title="Company profile"
      description="Your organization details and hiring focus."
    >
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <SettingsField label="Company name" htmlFor="org-name">
          <input
            id="org-name"
            type="text"
            maxLength={120}
            value={orgName}
            onChange={(e) => {
              setOrgName(e.target.value);
              setStatus("idle");
            }}
            disabled={!loaded}
            placeholder="e.g. Northwind Labs"
            className={settingsInputClass}
          />
        </SettingsField>

        {error ? (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!loaded || status === "saving"}>
            {status === "saving" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save company name"
            )}
          </Button>
          {status === "saved" ? (
            <span className="text-clover inline-flex items-center gap-1 text-xs">
              <CheckCircle2 className="size-4" />
              Saved
            </span>
          ) : null}
        </div>
      </form>

      <div className="border-border/15 mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground mb-1 text-[11px] font-mono font-medium uppercase tracking-wider">
            Company type
          </p>
          <p className="text-sm">{ai?.companyType || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-[11px] font-mono font-medium uppercase tracking-wider">
            Industries
          </p>
          {industries.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {industries.map((i) => (
                <li key={i}>
                  <Chip tone="clover">{i}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground/70 text-xs">—</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground mb-2 text-[11px] font-mono font-medium uppercase tracking-wider">
            Hiring focus
          </p>
          {hiringReasons.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {hiringReasons.map((r) => (
                <li key={r}>
                  <Chip tone="neutral">{r}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground/70 text-xs">—</p>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
