"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import {
  validateContactDraft,
  type ContactErrors,
} from "@/lib/validation";
import type { Candidate } from "@/lib/candidates/types";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  candidate: Candidate;
}

/**
 * Email-style invite form. On send: validates the draft, marks the
 * candidate as invited, shows a success modal, schedules a simulated
 * "candidate accepted" notification ~3.5s later, and lets the
 * employer return to the marketplace.
 */
export function ContactForm({ candidate }: ContactFormProps) {
  const router = useRouter();
  const { markInvited, addNotification, ensureConversation } =
    useSavedCandidates();

  const defaultMessage = `Hi ${candidate.name.split(" ")[0]},\n\nWe found your profile through Career OS and would like to connect with you about a potential ${candidate.targetRole} opportunity.\n\nLooking forward to hearing from you.`;

  const [subject, setSubject] = useState(
    `Opportunity to connect — ${candidate.targetRole}`,
  );
  const [message, setMessage] = useState(defaultMessage);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSend = () => {
    const result = validateContactDraft({ subject, message });
    if (!result.ok || !result.value) {
      setErrors(result.fieldErrors ?? {});
      return;
    }
    setErrors({});
    // Use the cleaned values returned by validation so we never
    // ship control chars / leading whitespace into the (eventual)
    // backend payload.
    setSubject(result.value.subject);
    setMessage(result.value.message);

    markInvited(candidate.id);
    ensureConversation(candidate.id, candidate.name);
    setShowSuccess(true);

    // Simulate a candidate-accepted notification a few seconds later.
    setTimeout(() => {
      addNotification({
        kind: "invite-accepted",
        title: `${candidate.name} has accepted your invite.`,
        body: `${candidate.name.split(" ")[0]} is open to chatting about the ${candidate.targetRole} opportunity.`,
        candidateId: candidate.id,
      });
    }, 3500);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <Link
          href="/employers/marketplace"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to marketplace
        </Link>

        <div className="glass-4 ring-luminous/20 rounded-2xl p-6 ring-1 sm:p-8">
          <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
            New message
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Reach out to {candidate.name}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {candidate.targetRole} · {candidate.industry} · {candidate.location}
          </p>

          <div className="border-border/15 mt-6 flex flex-col gap-4 border-t pt-6">
            <Field label="To">
              <div className="glass-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                <span className="bg-luminous/15 text-luminous-soft flex size-7 items-center justify-center rounded-full text-xs font-semibold">
                  {candidate.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="truncate">
                  {candidate.name}{" "}
                  <span className="text-muted-foreground">
                    · {candidate.targetRole}
                  </span>
                </span>
              </div>
            </Field>

            <Field label="Subject" error={errors.subject} errorId="contact-subject-error">
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) {
                    setErrors((prev) => ({ ...prev, subject: undefined }));
                  }
                }}
                maxLength={120}
                aria-invalid={errors.subject ? true : undefined}
                aria-describedby={
                  errors.subject ? "contact-subject-error" : undefined
                }
                className={cn(
                  "bg-foreground/2 border-border/15 focus-visible:border-luminous/60 focus-visible:ring-luminous/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2",
                  errors.subject &&
                    "border-destructive/60 focus-visible:ring-destructive/40",
                )}
              />
            </Field>

            <Field label="Message" error={errors.message} errorId="contact-message-error">
              <textarea
                rows={8}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) {
                    setErrors((prev) => ({ ...prev, message: undefined }));
                  }
                }}
                maxLength={4000}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={
                  errors.message ? "contact-message-error" : undefined
                }
                className={cn(
                  "bg-foreground/2 border-border/15 focus-visible:border-luminous/60 focus-visible:ring-luminous/40 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2",
                  errors.message &&
                    "border-destructive/60 focus-visible:ring-destructive/40",
                )}
              />
              <p className="text-muted-foreground mt-2 text-[11px]">
                Tip: candidates reply faster when the message is specific to
                their portfolio.
              </p>
            </Field>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Link href="/employers/marketplace">
                <Button variant="ghost">Cancel</Button>
              </Link>
              <Button onClick={handleSend} disabled={!subject || !message}>
                <Send className="size-4" />
                Send invite
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate side panel */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="glass-3 rounded-2xl p-5">
          <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
            Reaching out to
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {candidate.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            {candidate.careerDirection}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {candidate.topSkills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="bg-card/60 border-border/20 text-foreground/90 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="border-border/15 mt-4 flex items-center gap-2 border-t pt-4 text-xs">
            <span className="bg-luminous/10 text-luminous-soft border-luminous/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium">
              Match {candidate.matchScore}
            </span>
            <span className="bg-clover/10 text-clover-soft border-clover/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium">
              Readiness {candidate.readinessScore}
            </span>
          </div>
        </div>
      </aside>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => router.push("/employers/marketplace")}
      />
    </div>
  );
}

function Field({
  label,
  children,
  error,
  errorId,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  errorId?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
        {label}
      </span>
      {children}
      {error ? (
        <span
          id={errorId}
          role="alert"
          className="text-destructive inline-flex items-center gap-1.5 text-xs"
        >
          <AlertCircle className="size-3.5" aria-hidden />
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SuccessModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite sent" size="sm" hideVisibleTitle>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="bg-clover/15 text-clover-soft ring-2 ring-clover/40 flex size-14 items-center justify-center rounded-full">
          <Check className="size-7" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-semibold leading-tight">
          The candidate has been notified.
        </h3>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          You will be updated if they accept the invite.
        </p>
        <Button onClick={onClose} size="lg">
          Back to Dashboard
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </Modal>
  );
}
