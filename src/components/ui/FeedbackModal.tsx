"use client";

import { CheckCircle2, PartyPopper } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/**
 * Success / celebration feedback dialog (mentor wireframes): a centered
 * icon, one line of confirmation, and a single "OK!" button. Use `success`
 * for completed actions ("Successfully posted the job!") and `celebrate`
 * for milestones ("Congratulations — you're The Dolphin!").
 */
export function FeedbackModal({
  isOpen,
  onClose,
  variant,
  title,
  description,
  okLabel = "OK!",
}: {
  isOpen: boolean;
  onClose: () => void;
  variant: "success" | "celebrate"; // TS owns legal values
  title: string;
  description?: string;
  okLabel?: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      hideVisibleTitle
      hideCloseButton
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        {variant === "success" ? (
          <span className="bg-clover/15 ring-clover/30 flex size-16 items-center justify-center rounded-full ring-2">
            <CheckCircle2 className="text-clover size-8" aria-hidden />
          </span>
        ) : (
          <span className="bg-luminous/15 ring-luminous/30 flex size-16 items-center justify-center rounded-full ring-2">
            <PartyPopper className="text-luminous size-8" aria-hidden />
          </span>
        )}
        <div>
          <p className="text-base font-semibold tracking-tight">{title}</p>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <Button type="button" onClick={onClose} className="min-w-32">
          {okLabel}
        </Button>
      </div>
    </Modal>
  );
}
