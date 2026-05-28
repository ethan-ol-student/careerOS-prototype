"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { PortfolioSection } from "@/lib/portfolio/data";
import type { ContextStatus } from "@/lib/types/contextStatus";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface PortfolioItem {
  content: string;
  addedAt: string;
}

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
  role: string;
  company: string;
  period: string;
  detail?: string;
}

export interface PortfolioData {
  /** Short one-liner headline shown at the top of the CV. */
  headline: string;
  /** Multi-sentence professional summary. */
  summary: string;
  /** Simple skill chips on the CV. */
  skills: string[];
  certificates: Certificate[];
  awards: Award[];
  projects: Project[];
  experiences: Experience[];

  /** Legacy section data — retained so existing components keep compiling. */
  bio: string;
  legacySkills: PortfolioItem[];
  legacyExperiences: PortfolioItem[];
  aspirations: PortfolioItem[];
  reflections: PortfolioItem[];

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
  legacySkills: [],
  legacyExperiences: [],
  aspirations: [],
  reflections: [],

  lastUpdated: null,
  totalAdditions: 0,
};

const STORAGE_KEY = "career-os-portfolio";
const newId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

interface PortfolioContextValue {
  portfolio: PortfolioData;
  isHydrated: boolean;
  /** Lifecycle status — see `ContextStatus`. */
  status: ContextStatus;
  /** Optional human-readable error message when `status === "error"`. */
  error: string | null;

  // CV-builder API
  setHeadline: (v: string) => void;
  setSummary: (v: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addCertificate: (c: Omit<Certificate, "id">) => void;
  removeCertificate: (id: string) => void;
  addAward: (a: Omit<Award, "id">) => void;
  removeAward: (id: string) => void;
  addProject: (p: Omit<Project, "id">) => void;
  removeProject: (id: string) => void;
  addExperience: (e: Omit<Experience, "id">) => void;
  removeExperience: (id: string) => void;

  /** Legacy — kept for ConversationPanel. */
  addItem: (section: PortfolioSection, content: string) => void;
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PortfolioData>;
        setPortfolio({ ...initialPortfolio, ...parsed });
      }
      setStatus("ready");
    } catch (err) {
      console.warn("Portfolio hydration failed:", err);
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Portfolio hydration failed",
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch (err) {
      console.warn("Portfolio save failed:", err);
    }
  }, [portfolio, isHydrated]);

  const touch = (p: PortfolioData): PortfolioData => ({
    ...p,
    lastUpdated: new Date().toISOString(),
    totalAdditions: p.totalAdditions + 1,
  });

  const setHeadline = useCallback((v: string) => {
    setPortfolio((p) => touch({ ...p, headline: v.slice(0, 120) }));
  }, []);
  const setSummary = useCallback((v: string) => {
    setPortfolio((p) => touch({ ...p, summary: v.slice(0, 600) }));
  }, []);
  const addSkill = useCallback((skill: string) => {
    const v = skill.trim().slice(0, 50);
    if (!v) return;
    setPortfolio((p) =>
      p.skills.includes(v) ? p : touch({ ...p, skills: [...p.skills, v] }),
    );
  }, []);
  const removeSkill = useCallback((skill: string) => {
    setPortfolio((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  }, []);
  const addCertificate = useCallback((c: Omit<Certificate, "id">) => {
    setPortfolio((p) =>
      touch({
        ...p,
        certificates: [...p.certificates, { ...c, id: newId("cert") }],
      }),
    );
  }, []);
  const removeCertificate = useCallback((id: string) => {
    setPortfolio((p) => ({
      ...p,
      certificates: p.certificates.filter((c) => c.id !== id),
    }));
  }, []);
  const addAward = useCallback((a: Omit<Award, "id">) => {
    setPortfolio((p) =>
      touch({ ...p, awards: [...p.awards, { ...a, id: newId("award") }] }),
    );
  }, []);
  const removeAward = useCallback((id: string) => {
    setPortfolio((p) => ({
      ...p,
      awards: p.awards.filter((a) => a.id !== id),
    }));
  }, []);
  const addProject = useCallback((pr: Omit<Project, "id">) => {
    setPortfolio((p) =>
      touch({
        ...p,
        projects: [...p.projects, { ...pr, id: newId("proj") }],
      }),
    );
  }, []);
  const removeProject = useCallback((id: string) => {
    setPortfolio((p) => ({
      ...p,
      projects: p.projects.filter((pr) => pr.id !== id),
    }));
  }, []);
  const addExperience = useCallback((e: Omit<Experience, "id">) => {
    setPortfolio((p) =>
      touch({
        ...p,
        experiences: [...p.experiences, { ...e, id: newId("exp") }],
      }),
    );
  }, []);
  const removeExperience = useCallback((id: string) => {
    setPortfolio((p) => ({
      ...p,
      experiences: p.experiences.filter((e) => e.id !== id),
    }));
  }, []);

  /** Legacy hook — preserved so ConversationPanel still compiles. */
  const addItem = useCallback(
    (section: PortfolioSection, content: string) => {
      setPortfolio((p) => {
        const ts = new Date().toISOString();
        const next = touch({ ...p });
        if (section === "bio") {
          return { ...next, bio: content };
        }
        const item: PortfolioItem = { content, addedAt: ts };
        if (section === "skill") {
          return { ...next, legacySkills: [...p.legacySkills, item] };
        }
        if (section === "experience") {
          return { ...next, legacyExperiences: [...p.legacyExperiences, item] };
        }
        if (section === "aspiration") {
          return { ...next, aspirations: [...p.aspirations, item] };
        }
        return { ...next, reflections: [...p.reflections, item] };
      });
    },
    [],
  );

  const resetPortfolio = useCallback(() => {
    setPortfolio(initialPortfolio);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Portfolio reset failed:", err);
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
      addCertificate,
      removeCertificate,
      addAward,
      removeAward,
      addProject,
      removeProject,
      addExperience,
      removeExperience,
      addItem,
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
      addCertificate,
      removeCertificate,
      addAward,
      removeAward,
      addProject,
      removeProject,
      addExperience,
      removeExperience,
      addItem,
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
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used inside PortfolioProvider");
  }
  return context;
}
