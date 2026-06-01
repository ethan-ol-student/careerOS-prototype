"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { ChatInterface } from "@/components/marketplace/ChatInterface";
import { useMarketplaceCandidate } from "@/lib/marketplace/useCandidate";

interface PageProps {
  params: Promise<{ candidateId: string }>;
}

/**
 * Employer ↔ candidate chat page. Resolves the candidate from the
 * DB-backed marketplace API so it works for real candidates (projected
 * mirror rows) as well as seeded demo candidates.
 */
export default function EmployerChatPage({ params }: PageProps) {
  const { candidateId } = use(params);
  const { candidate, status, notFound: missing } =
    useMarketplaceCandidate(candidateId);

  if (missing) notFound();

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto max-w-3xl">
          {status === "loading" || !candidate ? (
            <div className="glass-3 flex items-center justify-center gap-2 rounded-2xl p-10 text-sm">
              <Loader2 className="text-clover size-4 animate-spin" />
              <span className="text-muted-foreground">Loading conversation…</span>
            </div>
          ) : (
            <ChatInterface candidate={candidate} />
          )}
        </div>
      </main>
    </EmployerAppShell>
  );
}
