"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InfoHint } from "@/components/ui/InfoHint";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/lib/context/AuthContext";
import { clearAllAppCache } from "@/lib/storage/appCache";

/**
 * Privacy / session controls. Sign out and "clear local cache" only
 * affect THIS device — the database keeps every saved record. (Account
 * deletion is the only path that removes data; see DeleteAccountSection.)
 */
export function PrivacySection() {
  const router = useRouter();
  const { logout } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [cleared, setCleared] = useState(false);

  const onSignOut = async () => {
    await logout();
    setConfirmSignOut(false);
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-3">
      <InfoHint className="text-muted-foreground block text-sm">
        Signing out or clearing the local cache only affects this device. Your
        saved data stays safely in your account and is restored next time you
        sign in — it is never deleted unless you choose to delete your account.
      </InfoHint>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setConfirmSignOut(true)}>
          <LogOut className="size-4" />
          Sign out
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            clearAllAppCache();
            setCleared(true);
          }}
        >
          <RefreshCw className="size-4" />
          Clear local cache
        </Button>
        {cleared ? (
          <span className="text-clover inline-flex items-center gap-1 text-xs">
            <CheckCircle2 className="size-4" />
            Local cache cleared
          </span>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={confirmSignOut}
        title="Sign out?"
        description="Your saved data will remain in your account; this device session will be cleared."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={onSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
