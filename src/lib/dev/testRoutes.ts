/**
 * Catalog of app routes for the Page Tester. PURE data (client-safe).
 * Paths containing `:id` are dynamic and get a real sample candidate id
 * substituted by the switcher at click time.
 */

export type TestRouteGroup =
  | "Public"
  | "Candidate"
  | "Employer"
  | "Dynamic"
  | "System"
  | "Dev";

export interface TestRoute {
  label: string;
  /** May contain `:id` for dynamic routes. */
  path: string;
  group: TestRouteGroup;
  /** Needs a candidate id substituted into `:id`. */
  dynamic?: boolean;
  /** Short note shown under the label (e.g. caveats). */
  note?: string;
}

export const TEST_ROUTES: TestRoute[] = [
  // Public
  { label: "Landing page", path: "/", group: "Public" },
  { label: "Auth (sign in / up)", path: "/auth", group: "Public" },
  { label: "Role chooser onboarding", path: "/onboarding", group: "Public" },

  // Candidate
  { label: "Candidate onboarding", path: "/candidate/onboarding", group: "Candidate" },
  { label: "Candidate dashboard", path: "/candidate/dashboard", group: "Candidate" },
  { label: "Living Portfolio", path: "/candidate/portfolio", group: "Candidate" },
  { label: "Life Chapter Designer", path: "/candidate/chapters", group: "Candidate" },

  // Employer
  { label: "Employer onboarding", path: "/employers/onboarding", group: "Employer" },
  { label: "Employer Marketplace", path: "/employers/marketplace", group: "Employer" },
  { label: "Saved Candidates", path: "/employers/saved", group: "Employer" },
  { label: "Employer Notifications", path: "/employers/notifications", group: "Employer" },

  // Dynamic (need a candidate id)
  {
    label: "Candidate profile",
    path: "/candidates/:id",
    group: "Dynamic",
    dynamic: true,
  },
  {
    label: "Employer contact / invite",
    path: "/employers/contact/:id",
    group: "Dynamic",
    dynamic: true,
  },
  {
    label: "Employer chat",
    path: "/employers/chat/:id",
    group: "Dynamic",
    dynamic: true,
  },

  // System
  {
    label: "Not Found (404)",
    path: "/__this-route-does-not-exist__",
    group: "System",
    note: "Triggers the global not-found page.",
  },

  // Dev
  { label: "Test mode panel", path: "/dev/test-mode", group: "Dev" },
];

export const TEST_ROUTE_GROUPS: TestRouteGroup[] = [
  "Public",
  "Candidate",
  "Employer",
  "Dynamic",
  "System",
  "Dev",
];

/** Substitute a sample candidate id into a dynamic route path. */
export function resolveRoutePath(
  route: TestRoute,
  sampleCandidateId: string | null,
): string {
  if (!route.dynamic) return route.path;
  const id = sampleCandidateId ?? "c-amelia-tan";
  return route.path.replace(":id", id);
}
