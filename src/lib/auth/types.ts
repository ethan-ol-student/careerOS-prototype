/**
 * Shared shapes used by both the auth API routes and the
 * frontend AuthContext.
 */

export type AuthRole = "candidate" | "employer";

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: AuthRole;
  isJudge: boolean;
}

export interface SessionPayload {
  userId: string;
  role: AuthRole;
  isJudge?: boolean;
  /** Session-revocation counter captured at sign time (see session.ts).
   *  Absent on tokens issued before revocation existed → treated as 0. */
  sessionVersion?: number;
}
