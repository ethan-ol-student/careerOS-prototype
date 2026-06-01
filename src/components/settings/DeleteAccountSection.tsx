"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";
import { settingsInputClass } from "./SettingsSection";

/**
 * Real account deletion (not faked). Requires password re-entry, then
 * calls `DELETE /api/account`, which verifies the password, cascades
 * the delete across all owned rows, and clears the session. On success
 * we reset client auth state and return to the landing page.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const dangerBtn =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/50 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:pointer-events-none disabled:opacity-50";

  const onDelete = async () => {
    setStatus("deleting");
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!res.ok || body?.ok === false) {
        setStatus("error");
        setError(body?.error?.message ?? "Couldn't delete your account.");
        return;
      }
      // Session is already cleared server-side; reset client state + leave.
      await logout();
      router.push("/");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't delete account.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Permanently delete your account and all associated data — profile,
        portfolio, chapters, saved candidates, messages, and notifications.
        This action cannot be undone.
      </p>
      <div>
        <button
          type="button"
          className={dangerBtn}
          onClick={() => {
            setOpen(true);
            setPassword("");
            setError(null);
            setStatus("idle");
          }}
        >
          <Trash2 className="size-4" />
          Delete account
        </button>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Delete your account?"
        description="This permanently removes your account and all data. Enter your password to confirm."
        size="sm"
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          className={settingsInputClass}
        />
        {error ? (
          <p role="alert" className="text-destructive mt-2 text-xs">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={status === "deleting"}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!password || status === "deleting"}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {status === "deleting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Permanently delete"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
