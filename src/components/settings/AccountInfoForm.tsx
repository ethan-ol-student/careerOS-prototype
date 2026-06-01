"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";
import { SettingsField, settingsInputClass } from "./SettingsSection";

/**
 * Edit safe account fields (name / username / email) via
 * `PATCH /api/account`. Role is shown read-only — there is no
 * client-side role switching. On success we `refresh()` the auth
 * context so the menu/header reflect the change immediately.
 */
export function AccountInfoForm() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const dirty =
    name !== (user.name ?? "") ||
    username !== (user.username ?? "") ||
    email !== (user.email ?? "");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!res.ok || body?.ok === false) {
        setStatus("error");
        setError(body?.error?.message ?? "Couldn't save your changes.");
        return;
      }
      await refresh();
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField label="Full name" htmlFor="acct-name">
          <input
            id="acct-name"
            type="text"
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setStatus("idle");
            }}
            className={settingsInputClass}
          />
        </SettingsField>
        <SettingsField label="Username" htmlFor="acct-username">
          <input
            id="acct-username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setStatus("idle");
            }}
            className={settingsInputClass}
          />
        </SettingsField>
        <SettingsField label="Email" htmlFor="acct-email">
          <input
            id="acct-email"
            type="email"
            maxLength={120}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("idle");
            }}
            className={settingsInputClass}
          />
        </SettingsField>
        <SettingsField label="Account type" hint="Roles can't be changed here.">
          <input
            type="text"
            value={user.role === "candidate" ? "Candidate" : "Employer"}
            disabled
            className={cn(settingsInputClass, "capitalize")}
          />
        </SettingsField>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || status === "saving"}>
          {status === "saving" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
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
  );
}
