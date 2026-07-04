"use client";

import { Pencil, FileText } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Grid12, Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  SettingsSection,
  SettingsField,
  settingsInputClass,
} from "@/components/settings/SettingsSection";
import { AccountInfoForm } from "@/components/settings/AccountInfoForm";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { DiscoverySection } from "@/components/settings/DiscoverySection";
import { UiDensitySection } from "@/components/settings/UiDensitySection";
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection";
import { useIntent } from "@/lib/context/IntentContext";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";

export default function CandidateSettingsPage() {
  return (
    <AppShell>
      <CandidateSettingsContent />
    </AppShell>
  );
}

function CandidateSettingsContent() {
  const { intent, setIntent } = useIntent();
  const { portfolio, setHeadline } = usePortfolio();
  const { data: ai } = useCandidatesAI();

  const targetRoles = ai?.targetRoles ?? [];
  const skills = portfolio.skills;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Account & profile"
        description="Manage your profile, personal information, and privacy. Changes are saved to your account."
      />

      <section className="px-4 py-8 sm:py-12">
        <Grid12>
          <Col span={12} lg={8} startLg={3} className="flex flex-col gap-6">
            {/* Profile customization */}
            <SettingsSection
              title="Profile customization"
              description="How you appear across Career OS. These fields save automatically."
            >
              <div className="flex flex-col gap-4">
                <SettingsField label="Profile headline / title" htmlFor="set-headline">
                  <input
                    id="set-headline"
                    type="text"
                    maxLength={120}
                    value={portfolio.headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Product-minded frontend engineer"
                    className={settingsInputClass}
                  />
                </SettingsField>
                <SettingsField label="Career direction / field" htmlFor="set-field">
                  <input
                    id="set-field"
                    type="text"
                    maxLength={120}
                    value={intent.field}
                    onChange={(e) => setIntent({ field: e.target.value })}
                    placeholder="e.g. Software Engineering"
                    className={settingsInputClass}
                  />
                </SettingsField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground mb-2 text-[11px] font-medium uppercase tracking-wider">
                      Target roles
                    </p>
                    {targetRoles.length ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {targetRoles.map((r) => (
                          <li key={r}>
                            <Chip tone="luminous">{r}</Chip>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground/70 text-xs">
                        None yet — add them in onboarding.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2 text-[11px] font-medium uppercase tracking-wider">
                      Skills summary
                    </p>
                    {skills.length ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 10).map((s) => (
                          <li key={s}>
                            <Chip tone="clover">{s}</Chip>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground/70 text-xs">
                        None yet — add them in your Living Portfolio.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* Onboarding / profile edit */}
            <SettingsSection
              title="Onboarding & profile setup"
              description="Revisit your onboarding answers — this opens edit mode and never restarts you as a new user."
            >
              <div className="flex flex-wrap gap-2">
                <LinkButton
                  href="/candidate/onboarding?edit=1"
                  size="default"
                  icon={<Pencil className="size-4" />}
                >
                  Edit onboarding answers
                </LinkButton>
                <LinkButton
                  href="/candidate/portfolio"
                  size="default"
                  variant="outline"
                  icon={<FileText className="size-4" />}
                >
                  Edit Living Portfolio
                </LinkButton>
              </div>
            </SettingsSection>

            {/* Age-adaptive dashboard style (Feature 14) */}
            <SettingsSection
              title="Dashboard style"
              description="Calm & editorial, or visual & gamified — your call, never locked to age."
            >
              <UiDensitySection />
            </SettingsSection>

            {/* Marketplace discovery opt-in */}
            <SettingsSection
              title="Discovery"
              description="Control whether employers can find you in the marketplace."
            >
              <DiscoverySection />
            </SettingsSection>

            {/* Personal information */}
            <SettingsSection
              title="Personal information"
              description="Your account details. Email and username must stay unique."
            >
              <AccountInfoForm />
            </SettingsSection>

            {/* Privacy / session */}
            <SettingsSection title="Privacy & session">
              <PrivacySection />
            </SettingsSection>

            {/* Danger zone */}
            <SettingsSection
              title="Delete account"
              description="Danger zone — irreversible."
              danger
            >
              <DeleteAccountSection />
            </SettingsSection>
          </Col>
        </Grid12>
      </section>
    </>
  );
}
