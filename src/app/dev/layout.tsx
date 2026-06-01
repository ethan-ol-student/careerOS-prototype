import { notFound } from "next/navigation";
import { isTestModeEnabled } from "@/lib/dev/testMode";

/**
 * Server-side gate for ALL `/dev/*` routes. When test mode is disabled
 * (i.e. always, in production) this renders the global 404 — the dev
 * surface is indistinguishable from a non-existent route.
 */
export default function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isTestModeEnabled()) {
    notFound();
  }
  return <>{children}</>;
}
