"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export interface ModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /**
   * Fired when the user dismisses the modal via the close button,
   * backdrop click, or ESC key. The caller decides whether to
   * actually unmount.
   */
  onClose: () => void;
  /** Accessible title text. Required for screen readers. */
  title: string;
  /**
   * Optional short description rendered next to the title and
   * announced as `aria-describedby` to assistive tech.
   */
  description?: string;
  /** Width preset. Defaults to "md". */
  size?: ModalSize;
  /** Hide the X close button (rare — used for required-action dialogs). */
  hideCloseButton?: boolean;
  /** Whether ESC and backdrop click close the modal. Default true. */
  closeOnBackdropClick?: boolean;
  /** Optional className applied to the inner panel. */
  className?: string;
  /** Optional className applied to the title region. */
  titleClassName?: string;
  /** Hide the rendered title visually but keep it for screen readers. */
  hideVisibleTitle?: boolean;
  /** Optional element to render to the left of the title (e.g. an icon chip). */
  leading?: React.ReactNode;
  /** Optional footer rendered below the body. */
  footer?: React.ReactNode;
  /** Modal body content. */
  children: React.ReactNode;
}

/**
 * Shared modal primitive used across Career OS. Handles:
 * - Backdrop with click-to-close
 * - ESC-key dismissal
 * - Body scroll lock while open
 * - Focus restoration to the previously focused element on close
 * - Initial focus moved to the dialog so screen readers announce it
 * - Accessible role/aria-modal/aria-labelledby/aria-describedby
 *
 * It intentionally renders inline (no portal) to match the existing
 * implementations being refactored, so visual stacking and global
 * styles stay identical.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  hideCloseButton = false,
  closeOnBackdropClick = true,
  className,
  titleClassName,
  hideVisibleTitle,
  leading,
  footer,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // ESC-to-close.
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  // Body scroll lock + focus management.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the panel so the dialog is announced to screen readers
    // and so the first ESC press is captured even if the click came
    // from outside any focusable child.
    requestAnimationFrame(() => {
      panelRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      // Restore focus to whoever opened the modal.
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const titleId = "modal-title";
  const descId = description ? "modal-description" : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "bg-background border-border/60 relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border p-6 focus:outline-none sm:p-8",
          SIZE_CLASSES[size],
          className,
        )}
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        {hideCloseButton ? null : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-luminous/40 absolute right-4 top-4 rounded-md p-1 transition-colors focus:outline-none focus-visible:ring-2"
          >
            <X className="size-4" />
          </button>
        )}

        {hideVisibleTitle ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <header className="mb-4 flex items-start gap-3 pr-8">
            {leading}
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className={cn(
                  "text-base font-semibold leading-tight",
                  titleClassName,
                )}
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descId}
                  className="text-muted-foreground mt-1 text-sm leading-relaxed"
                >
                  {description}
                </p>
              ) : null}
            </div>
          </header>
        )}

        <div>{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
