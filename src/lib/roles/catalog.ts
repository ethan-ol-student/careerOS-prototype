"use client";

import type { TargetJob } from "@/lib/jobs/data";

/**
 * Client access to the role-catalog taxonomy (/api/roles) + adapters so
 * the saved role (Current Role for senior/exec, first Desired Role for
 * standard tracks) can drive Skill Radar / Career Intelligence as a
 * synthetic TargetJob — the pure engines accept any TargetJob shape.
 */

export interface CatalogRole {
  id: string;
  category: string;
  title: string;
  skills: string[]; // lower-case normalized
}

let cache: Promise<CatalogRole[]> | null = null;

export function fetchRoleCatalog(): Promise<CatalogRole[]> {
  if (!cache) {
    cache = fetch("/api/roles", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => (j?.ok ? (j.data.roles as CatalogRole[]) : []))
      .catch(() => {
        cache = null; // allow a retry on the next call
        return [];
      });
  }
  return cache;
}

/** `[INDUSTRY] - [JOB ROLE]` — the standardized display label. */
export const roleLabel = (r: CatalogRole) => `${r.category} - ${r.title}`;

/** Adapt a catalog role into the engines' TargetJob contract. */
export function roleToTargetJob(r: CatalogRole): TargetJob {
  return {
    id: r.id,
    title: r.title,
    company: r.category,
    location: "Anywhere",
    duration: "Role target",
    field: r.category,
    requiredSkills: r.skills.slice(0, 8),
    baseMatch: 0,
  };
}

/** The role a candidate's modules should compare against, per track. */
export function savedRoleIdFor(ai: {
  careerStage?: string | null;
  currentRoleId?: string | null;
  desiredRoleIds?: string[] | null;
}): string | null {
  const seniorExec = ["senior-career", "executive"].includes(ai.careerStage ?? "");
  if (seniorExec) return ai.currentRoleId ?? null;
  return ai.desiredRoleIds?.[0] ?? null;
}
