"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      leading={
        <div className="bg-destructive/15 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl">
          <AlertTriangle className="size-5" />
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <button
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/80 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {null}
    </Modal>
  );
}
