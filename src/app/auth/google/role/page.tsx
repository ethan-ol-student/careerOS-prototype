"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Briefcase, Telescope } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

/**
 * First-time Google sign-in: pick a side. The verified Google identity
 * waits in a 10-minute httpOnly cookie; choosing a role creates the
 * account and lands in the matching onboarding.
 */
export default function GoogleRolePage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: "candidate" | "employer") {
    setBusy(role);
    setError(null);
    const res = await fetch("/api/auth/google/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!json.ok) {
      setBusy(null);
      setError(json.error?.message ?? "Could not finish sign-up.");
      return;
    }
    // Hydrate AuthContext with the fresh session before navigating so the
    // client shells don't bounce to /auth (same fix as the judge hub).
    await refresh();
    router.push(json.data.redirect);
  }

  const options = [
    {
      role: "candidate" as const,
      icon: Telescope,
      title: "I'm building my career",
      body: "See where you stand, where you can go, and what to do next.",
    },
    {
      role: "employer" as const,
      icon: Briefcase,
      title: "I'm hiring talent",
      body: "Find candidates on trajectory — matched for the right reasons.",
    },
  ];

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <p className="text-luminous flex items-center justify-center gap-2 text-sm font-semibold">
          <Compass className="size-5" /> Career OS
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold">
          One last thing — how will you use Career OS?
        </h1>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Your Google account is verified. Pick a side to finish setting up.
        </p>

        {error && (
          <p className="border-destructive/40 bg-destructive/10 text-destructive mt-4 rounded-lg border px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.map((o) => (
            <button
              key={o.role}
              type="button"
              disabled={busy !== null}
              onClick={() => choose(o.role)}
              className={cn(
                "glass-3 border-border/15 hover:border-luminous/50 rounded-2xl border p-6 text-left transition-colors disabled:opacity-60",
                busy === o.role && "border-luminous/60",
              )}
            >
              <o.icon className="text-luminous size-6" />
              <p className="mt-3 font-semibold">{o.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{o.body}</p>
              <p className="text-luminous mt-3 text-sm font-medium">
                {busy === o.role ? "Setting up…" : "Continue →"}
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
