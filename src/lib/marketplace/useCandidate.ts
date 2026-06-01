"use client";

import { useEffect, useState } from "react";
import type { Candidate } from "@/lib/candidates/types";
import type { ContextStatus } from "@/lib/types/contextStatus";

/**
 * Resolve a single marketplace candidate by id from the DB-backed API
 * (`/api/marketplace/[id]`).
 *
 * This replaces the old synchronous `findCandidateById` (which only knew
 * the static mock array) on the profile / contact / chat pages, so those
 * surfaces work for BOTH seeded demo candidates AND real candidates
 * projected into the catalog (`real-<userId>`). That's what makes "View
 * Profile", "Invite", and "Chat" function on real people — the final
 * link in the both-sides bridge.
 */
export function useMarketplaceCandidate(id: string): {
  candidate: Candidate | null;
  status: ContextStatus;
  /** True when the API definitively reported the candidate doesn't exist. */
  notFound: boolean;
} {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [status, setStatus] = useState<ContextStatus>("loading");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset to loading for the new id before the async fetch.
    setStatus("loading");
    setNotFound(false);
    setCandidate(null);
    (async () => {
      try {
        const res = await fetch(`/api/marketplace/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: Candidate }
          | null;
        if (cancelled) return;
        if (res.status === 404 || (body && body.ok === false)) {
          setNotFound(true);
          setStatus("error");
          return;
        }
        if (!res.ok || !body?.ok || !body.data) {
          setStatus("error");
          return;
        }
        setCandidate(body.data);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { candidate, status, notFound };
}
