"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { httpAdapter as api } from "@/lib/api/httpAdapter";
import { useAuth } from "@/lib/context/AuthContext";
import { currentScopedKey, CACHE_BASE } from "@/lib/storage/appCache";
import type { ContextStatus } from "@/lib/types/contextStatus";

// ── Types ───────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
}
export interface Award {
  id: string;
  title: string;
  year: string;
  description?: string;
}
export interface Project {
  id: string;
  title: string;
  description: string;
  link?: string;
}
export interface Experience {
  id: string;
  role: string; // the problem/project title when kind="project"
  company: string;
  period: string;
  detail?: string;
  // Structured merge (Experience ∪ Projects ∪ Problems solved)
  kind?: "role" | "project";
  contribution?: "" | "lead" | "assistant" | "participant";
  approach?: string;
  impact?: string;
  skillsUsed?: string[];
  link?: string;
}
export interface PortfolioData {
  headline: string;
  summary: string;
  skills: string[];
  certificates: Certificate[];
  awards: Award[];
  projects: Project[];
  experiences: Experience[];
  bio: string;
  lastUpdated: string | null;
  totalAdditions: number;
}

const initialPortfolio: PortfolioData = {
  headline: "",
  summary: "",
  skills: [],
  certificates: [],
  awards: [],
  projects: [],
  experiences: [],
  bio: "",
  lastUpdated: null,
  totalAdditions: 0,
};

const newId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ── Nested-collection persistence (projects/certificates/awards/experiences)
// Round-trips to the dedicated `/api/me/portfolio/[collection]` routes.
type NestedCollection =
  | "projects"
  | "certificates"
  | "awards"
  | "experiences";

async function postPortfolioItem(
  collection: NestedCollection,
  payload: unknown,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`/api/me/portfolio/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { id?: string }; error?: { message?: string } }
      | null;
    if (!res.ok || body?.ok === false) {
      return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, id: body?.data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error." };
  }
}

async function deletePortfolioItem(
  collection: NestedCollection,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `/api/me/portfolio/${collection}/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; error?: { message?: string } }
      | null;
    if (!res.ok || body?.ok === false) {
      return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error." };
  }
}

interface PortfolioContextValue {
  portfolio: PortfolioData;
  isHydrated: boolean;
  status: ContextStatus;
  error: string | null;
  setHeadline: (v: string) => void;
  setSummary: (v: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  /** Reconcile the local skills view to the authoritative claim names after
   *  the Skill Radar mutated them elsewhere (server already persisted). */
  syncSkills: (names: string[]) => void;
  addCertificate: (c: Omit<Certificate, "id">) => void;
  removeCertificate: (id: string) => void;
  addAward: (a: Omit<Award, "id">) => void;
  removeAward: (id: string) => void;
  addProject: (p: Omit<Project, "id">) => void;
  removeProject: (id: string) => void;
  addExperience: (e: Omit<Experience, "id">) => void;
  removeExperience: (id: string) => void;
  resetPortfolio: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(
  undefined,
);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(initialPortfolio);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Auth-keyed hydration: re-runs on login/logout so a fresh sign-in
  // gets data without a manual reload (providers mount at the root).
  const { user, status: authStatus } = useAuth();
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  // Debounce server patches so headline typing doesn't fire per-keystroke.
  const pendingRef = useRef<Partial<PortfolioData> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!userId || userRole !== "candidate") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auth-keyed reset
      setPortfolio(initialPortfolio);
      setStatus("idle");
      setError(null);
      setIsHydrated(true);
      return;
    }
     
    setStatus("loading");
    try {
      const cached = localStorage.getItem(currentScopedKey(CACHE_BASE.portfolio));
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<PortfolioData>;
        setPortfolio({ ...initialPortfolio, ...parsed });
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await api.getCandidateProfile();
        if (cancelled) return;
        if (!result.ok) {
          setStatus("error");
          setError(result.error.message);
          setIsHydrated(true);
          return;
        }
        setPortfolio(result.data.portfolio);
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.portfolio), JSON.stringify(result.data.portfolio));
        } catch {
          /* ignore */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load portfolio.");
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, userRole]);

  const flushPatch = useCallback(async () => {
    const patch = pendingRef.current;
    pendingRef.current = null;
    if (!patch || Object.keys(patch).length === 0) return;
    try {
      const result = await api.patchPortfolio(patch);
      if (!result.ok) {
        // Surface the failure — the optimistic edit isn't persisted.
        setStatus("error");
        setError(result.error.message);
        return;
      }
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Couldn't save your portfolio.",
      );
    }
  }, []);

  const queueServerPatch = useCallback(
    (patch: Partial<PortfolioData>) => {
      pendingRef.current = { ...(pendingRef.current ?? {}), ...patch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushPatch, 400);
    },
    [flushPatch],
  );

  const touch = (p: PortfolioData): PortfolioData => ({
    ...p,
    lastUpdated: new Date().toISOString(),
    totalAdditions: p.totalAdditions + 1,
  });

  const persistCache = (p: PortfolioData) => {
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.portfolio), JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  const setHeadline = useCallback(
    (v: string) => {
      setPortfolio((p) => {
        const next = touch({ ...p, headline: v.slice(0, 120) });
        persistCache(next);
        return next;
      });
      queueServerPatch({ headline: v.slice(0, 120) });
    },
    [queueServerPatch],
  );

  const setSummary = useCallback(
    (v: string) => {
      setPortfolio((p) => {
        const next = touch({ ...p, summary: v.slice(0, 600) });
        persistCache(next);
        return next;
      });
      queueServerPatch({ summary: v.slice(0, 600) });
    },
    [queueServerPatch],
  );

  const addSkill = useCallback(
    (skill: string) => {
      const v = skill.trim().slice(0, 50);
      if (!v) return;
      setPortfolio((p) => {
        if (p.skills.includes(v)) return p;
        const next = touch({ ...p, skills: [...p.skills, v] });
        persistCache(next);
        queueServerPatch({ skills: next.skills });
        return next;
      });
    },
    [queueServerPatch],
  );

  const removeSkill = useCallback(
    (skill: string) => {
      setPortfolio((p) => {
        const next = { ...p, skills: p.skills.filter((s) => s !== skill) };
        persistCache(next);
        queueServerPatch({ skills: next.skills });
        return next;
      });
    },
    [queueServerPatch],
  );

  const syncSkills = useCallback((names: string[]) => {
    // The Skill Radar's /api/me/skills write already mirrored these into
    // CandidateProfile.skills server-side — here we only refresh the local
    // paint cache so the portfolio view isn't stale (no second server write).
    setPortfolio((p) => {
      if (p.skills.length === names.length && p.skills.every((s, i) => s === names[i])) {
        return p; // already in sync — avoid a needless re-render
      }
      const next = { ...p, skills: names };
      persistCache(next);
      return next;
    });
  }, []);

  // Certificates, awards, projects, experiences round-trip to the
  // dedicated `/api/me/portfolio/[collection]` routes. Each add is
  // optimistic then reconciled to the server id; a failed write rolls
  // the item back and surfaces an error, so the UI never shows an
  // unsaved item as saved.

  const addCertificate = useCallback((c: Omit<Certificate, "id">) => {
    const tempId = newId("cert");
    setPortfolio((p) => {
      const next = touch({
        ...p,
        certificates: [...p.certificates, { ...c, id: tempId }],
      });
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await postPortfolioItem("certificates", c);
      if (!res.ok) {
        setPortfolio((p) => {
          const next = {
            ...p,
            certificates: p.certificates.filter((x) => x.id !== tempId),
          };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't save certificate.");
        return;
      }
      if (res.id) {
        setPortfolio((p) => {
          const next = {
            ...p,
            certificates: p.certificates.map((x) =>
              x.id === tempId ? { ...x, id: res.id! } : x,
            ),
          };
          persistCache(next);
          return next;
        });
      }
      setError(null);
    })();
  }, []);
  const removeCertificate = useCallback((id: string) => {
    let removed: Certificate | undefined;
    setPortfolio((p) => {
      removed = p.certificates.find((c) => c.id === id);
      const next = { ...p, certificates: p.certificates.filter((c) => c.id !== id) };
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await deletePortfolioItem("certificates", id);
      if (!res.ok && removed) {
        const item = removed;
        setPortfolio((p) => {
          if (p.certificates.some((c) => c.id === item.id)) return p;
          const next = { ...p, certificates: [...p.certificates, item] };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't remove certificate.");
        return;
      }
      if (res.ok) setError(null);
    })();
  }, []);

  const addAward = useCallback((a: Omit<Award, "id">) => {
    const tempId = newId("award");
    setPortfolio((p) => {
      const next = touch({ ...p, awards: [...p.awards, { ...a, id: tempId }] });
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await postPortfolioItem("awards", a);
      if (!res.ok) {
        setPortfolio((p) => {
          const next = { ...p, awards: p.awards.filter((x) => x.id !== tempId) };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't save award.");
        return;
      }
      if (res.id) {
        setPortfolio((p) => {
          const next = {
            ...p,
            awards: p.awards.map((x) => (x.id === tempId ? { ...x, id: res.id! } : x)),
          };
          persistCache(next);
          return next;
        });
      }
      setError(null);
    })();
  }, []);
  const removeAward = useCallback((id: string) => {
    let removed: Award | undefined;
    setPortfolio((p) => {
      removed = p.awards.find((a) => a.id === id);
      const next = { ...p, awards: p.awards.filter((a) => a.id !== id) };
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await deletePortfolioItem("awards", id);
      if (!res.ok && removed) {
        const item = removed;
        setPortfolio((p) => {
          if (p.awards.some((a) => a.id === item.id)) return p;
          const next = { ...p, awards: [...p.awards, item] };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't remove award.");
        return;
      }
      if (res.ok) setError(null);
    })();
  }, []);

  const addProject = useCallback((pr: Omit<Project, "id">) => {
    const tempId = newId("proj");
    setPortfolio((p) => {
      const next = touch({ ...p, projects: [...p.projects, { ...pr, id: tempId }] });
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await postPortfolioItem("projects", pr);
      if (!res.ok) {
        setPortfolio((p) => {
          const next = { ...p, projects: p.projects.filter((x) => x.id !== tempId) };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't save project.");
        return;
      }
      if (res.id) {
        setPortfolio((p) => {
          const next = {
            ...p,
            projects: p.projects.map((x) => (x.id === tempId ? { ...x, id: res.id! } : x)),
          };
          persistCache(next);
          return next;
        });
      }
      setError(null);
    })();
  }, []);
  const removeProject = useCallback((id: string) => {
    let removed: Project | undefined;
    setPortfolio((p) => {
      removed = p.projects.find((pr) => pr.id === id);
      const next = { ...p, projects: p.projects.filter((pr) => pr.id !== id) };
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await deletePortfolioItem("projects", id);
      if (!res.ok && removed) {
        const item = removed;
        setPortfolio((p) => {
          if (p.projects.some((pr) => pr.id === item.id)) return p;
          const next = { ...p, projects: [...p.projects, item] };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't remove project.");
        return;
      }
      if (res.ok) setError(null);
    })();
  }, []);

  const addExperience = useCallback((e: Omit<Experience, "id">) => {
    const tempId = newId("exp");
    setPortfolio((p) => {
      const next = touch({
        ...p,
        experiences: [...p.experiences, { ...e, id: tempId }],
      });
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await postPortfolioItem("experiences", e);
      if (!res.ok) {
        setPortfolio((p) => {
          const next = {
            ...p,
            experiences: p.experiences.filter((x) => x.id !== tempId),
          };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't save experience.");
        return;
      }
      if (res.id) {
        setPortfolio((p) => {
          const next = {
            ...p,
            experiences: p.experiences.map((x) =>
              x.id === tempId ? { ...x, id: res.id! } : x,
            ),
          };
          persistCache(next);
          return next;
        });
      }
      setError(null);
    })();
  }, []);
  const removeExperience = useCallback((id: string) => {
    let removed: Experience | undefined;
    setPortfolio((p) => {
      removed = p.experiences.find((e) => e.id === id);
      const next = { ...p, experiences: p.experiences.filter((e) => e.id !== id) };
      persistCache(next);
      return next;
    });
    void (async () => {
      const res = await deletePortfolioItem("experiences", id);
      if (!res.ok && removed) {
        const item = removed;
        setPortfolio((p) => {
          if (p.experiences.some((e) => e.id === item.id)) return p;
          const next = { ...p, experiences: [...p.experiences, item] };
          persistCache(next);
          return next;
        });
        setStatus("error");
        setError(res.error ?? "Couldn't remove experience.");
        return;
      }
      if (res.ok) setError(null);
    })();
  }, []);

  const resetPortfolio = useCallback(() => {
    setPortfolio(initialPortfolio);
    pendingRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(currentScopedKey(CACHE_BASE.portfolio));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      portfolio,
      isHydrated,
      status,
      error,
      setHeadline,
      setSummary,
      addSkill,
      removeSkill,
      syncSkills,
      addCertificate,
      removeCertificate,
      addAward,
      removeAward,
      addProject,
      removeProject,
      addExperience,
      removeExperience,
      resetPortfolio,
    }),
    [
      portfolio,
      isHydrated,
      status,
      error,
      setHeadline,
      setSummary,
      addSkill,
      removeSkill,
      syncSkills,
      addCertificate,
      removeCertificate,
      addAward,
      removeAward,
      addProject,
      removeProject,
      addExperience,
      removeExperience,
      resetPortfolio,
    ],
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside PortfolioProvider");
  return ctx;
}
