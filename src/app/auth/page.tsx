"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Compass,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { isTestModeEnabled, TEST_ADMIN_USERNAME } from "@/lib/dev/testMode";
import type { AuthRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type Mode = "signup" | "login";

export default function AuthPage() {
  const router = useRouter();
  const {
    user,
    candidateOnboardingCompleted,
    employerOnboardingCompleted,
    signup,
    login,
    status,
  } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");

  // Sign-up form state
  const [role, setRole] = useState<AuthRole>("candidate");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Log-in form state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Honor ?mode= and ?role= from landing CTAs. Read post-mount so the
  // SSR/first-render output matches (no hydration mismatch); the tab +
  // role picker then reflect what the user clicked.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    const r = params.get("role");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time URL param read on mount (no external sync needed).
    if (m === "login" || m === "signup") setMode(m);
    if (r === "candidate" || r === "employer") setRole(r);
  }, []);

  // If already signed in, bounce to the right shell.
  useEffect(() => {
    if (status !== "ready") return;
    if (!user) return;
    if (user.isJudge) {
      router.replace("/judge/tour");
      return;
    }
    // Dev/test admin → the test panel. Flag-gated: in production the
    // flag is off, so `admin123` is just a normal account and
    // /dev/test-mode 404s — no production backdoor.
    if (isTestModeEnabled() && user.username === TEST_ADMIN_USERNAME) {
      router.replace("/dev/test-mode");
      return;
    }
    if (user.role === "employer") {
      router.replace(
        employerOnboardingCompleted
          ? "/employers/marketplace"
          : "/employers/onboarding",
      );
    } else {
      router.replace(
        candidateOnboardingCompleted
          ? "/candidate/dashboard"
          : "/candidate/onboarding",
      );
    }
  }, [
    user,
    status,
    router,
    candidateOnboardingCompleted,
    employerOnboardingCompleted,
  ]);

  // Theme-tint helper based on chosen role (candidate=luminous, employer=clover)
  const accent =
    role === "employer"
      ? {
          ring: "ring-clover/30",
          border: "border-clover",
          bg: "bg-clover",
          text: "text-clover",
          fade: "from-clover/15",
        }
      : {
          ring: "ring-luminous/30",
          border: "border-luminous",
          bg: "bg-luminous",
          text: "text-luminous",
          fade: "from-luminous/15",
        };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const result = await signup({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      role,
      name: name.trim() || undefined,
      organizationName:
        role === "employer" ? organizationName.trim() || undefined : undefined,
      careerGoal:
        role === "candidate" ? careerGoal.trim() || undefined : undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Sign up failed.");
      return;
    }
    router.replace(
      role === "employer"
        ? "/employers/onboarding"
        : "/candidate/onboarding",
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !loginPassword) {
      setError("Username/email and password are required.");
      return;
    }
    setSubmitting(true);
    // Dev/test admin convenience: ensure the seeded test account exists
    // before logging in (flag-gated — the dev seed route 404s in prod).
    if (isTestModeEnabled() && identifier.trim() === TEST_ADMIN_USERNAME) {
      try {
        await fetch("/api/dev/seed", { method: "POST" });
      } catch {
        /* ignore — login will surface a clear error if the seed failed */
      }
    }
    const result = await login(identifier.trim(), loginPassword);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed.");
      return;
    }
    // AuthProvider state will refresh; the redirect effect above handles routing.
  };

  return (
    <main className="bg-background text-foreground relative flex min-h-screen w-full items-center justify-center px-4">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-32 right-1/2 size-[640px] -translate-x-1/2 rounded-full bg-radial to-transparent blur-3xl transition-colors",
          accent.fade,
        )}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 self-start text-sm transition-colors"
        >
          <Compass className="text-brand size-4" />
          Career OS
        </Link>

        <div
          className={cn(
            "glass-4 rounded-2xl p-6 ring-1 transition-colors sm:p-8",
            accent.ring,
          )}
        >
          {/* Mode tabs */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="bg-card/40 border-border/60 mb-6 grid grid-cols-2 gap-1 rounded-lg border p-1 text-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={cn(
                "rounded-md px-3 py-2 font-medium transition-colors",
                mode === "signup"
                  ? cn("bg-background shadow-sm", accent.text)
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UserPlus className="mr-1 inline size-4" />
              Sign up
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={cn(
                "rounded-md px-3 py-2 font-medium transition-colors",
                mode === "login"
                  ? cn("bg-background shadow-sm", accent.text)
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LogIn className="mr-1 inline size-4" />
              Log in
            </button>
          </div>

          {mode === "signup" ? (
            <form className="flex flex-col gap-4" onSubmit={handleSignup}>
              <h1 className="text-2xl font-semibold tracking-tight">
                Create your Career OS account
              </h1>
              <p className="text-muted-foreground text-sm">
                Pick how you&apos;ll use Career OS. You can sign in later from
                any device — your saved data stays in your account.
              </p>

              {/* Role picker (drives the accent tint) */}
              <fieldset>
                <legend className="text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                  Account type
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <RoleCard
                    label="Candidate"
                    description="Build a Living Portfolio"
                    icon={<Compass className="size-4" />}
                    active={role === "candidate"}
                    accent="luminous"
                    onSelect={() => setRole("candidate")}
                  />
                  <RoleCard
                    label="Employer"
                    description="Discover talent on trajectory"
                    icon={<Briefcase className="size-4" />}
                    active={role === "employer"}
                    accent="clover"
                    onSelect={() => setRole("employer")}
                  />
                </div>
              </fieldset>

              <Field label="Username" htmlFor="signup-username" required>
                <input
                  id="signup-username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              <Field label="Email" htmlFor="signup-email" required>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              <Field
                label="Full name"
                htmlFor="signup-name"
                hint="optional, shown on your profile"
              >
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              {role === "employer" ? (
                <Field
                  label="Organization"
                  htmlFor="signup-org"
                  hint="optional, shown in invites"
                >
                  <input
                    id="signup-org"
                    type="text"
                    autoComplete="organization"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className={inputClasses(accent.border)}
                  />
                </Field>
              ) : (
                <Field
                  label="Career goal"
                  htmlFor="signup-goal"
                  hint="optional, helps personalize your dashboard"
                >
                  <input
                    id="signup-goal"
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className={inputClasses(accent.border)}
                  />
                </Field>
              )}

              <Field label="Password" htmlFor="signup-password" required>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              <Field
                label="Confirm password"
                htmlFor="signup-confirm"
                required
              >
                <input
                  id="signup-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              {error ? <ErrorRow message={error} /> : null}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className={cn("w-full", accent.bg)}
              >
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in with the account you created. Your data is restored
                from the server.
              </p>

              <Field
                label="Username or email"
                htmlFor="login-id"
                required
              >
                <input
                  id="login-id"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              <Field label="Password" htmlFor="login-password" required>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={inputClasses(accent.border)}
                />
              </Field>

              {error ? <ErrorRow message={error} /> : null}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className={cn("w-full", accent.bg)}
              >
                {submitting ? "Signing in…" : "Log in"}
              </Button>

              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-muted-foreground hover:text-foreground text-center text-xs transition-colors"
              >
                Don&apos;t have an account? Sign up
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function inputClasses(borderActive: string) {
  return cn(
    "glass-3 focus-visible:ring-2 mt-1.5 w-full rounded-md border border-transparent px-3 py-2 text-sm outline-none transition-colors",
    `focus-visible:${borderActive}`,
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={htmlFor}
        className="text-muted-foreground text-[11px] uppercase tracking-wider"
      >
        {label}
        {required ? <span aria-hidden> *</span> : null}
        {hint ? (
          <span className="text-muted-foreground/70 ml-2 normal-case tracking-normal">
            — {hint}
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="text-destructive inline-flex items-center gap-2 text-xs"
    >
      <AlertCircle className="size-3.5" aria-hidden />
      {message}
    </p>
  );
}

function RoleCard({
  label,
  description,
  icon,
  active,
  accent,
  onSelect,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  accent: "luminous" | "clover";
  onSelect: () => void;
}) {
  const tone =
    accent === "luminous"
      ? "border-luminous bg-luminous/10 text-luminous ring-luminous/40"
      : "border-clover bg-clover/10 text-clover ring-clover/40";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left text-sm transition-all",
        active
          ? cn("ring-2", tone)
          : "border-border/60 bg-card/40 hover:border-border",
      )}
      aria-pressed={active}
    >
      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {label}
      </span>
      <span className="text-muted-foreground text-[11px]">{description}</span>
    </button>
  );
}
