import { Prisma, type Application } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/api/errors";

/**
 * Applications data-spine service.
 *
 * An Application is the (candidate, job) link; its history is an
 * append-only ApplicationEvent log. Status values are owned here (the
 * schema stores plain String per project convention).
 */

// TS is the source of truth for legal statuses.
export const APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "expired",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// Statuses still awaiting an employer decision — eligible to expire.
const NON_TERMINAL = new Set<ApplicationStatus>(["submitted", "reviewing"]);

// ponytail: fixed 30-day window. Make it a per-Job column if jobs ever
// need their own deadlines.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Employer-responsiveness signal, 0–100. Pure fn of status → unit-checkable.
// ponytail: status-only heuristic; fold in time-to-first-response if too coarse.
const SCORE_BY_STATUS: Record<ApplicationStatus, number> = {
  submitted: 10,
  reviewing: 40,
  interview: 70,
  offer: 100,
  rejected: 30,
  withdrawn: 0,
  expired: 0,
};

export function responseScore(status: ApplicationStatus): number {
  return SCORE_BY_STATUS[status] ?? 0;
}

export const ApplicationsService = {
  /** Apply to a job: create the Application + its "submitted" event atomically. */
  async apply(candidateProfileId: string, jobId: string) {
    try {
      return await prisma.application.create({
        data: {
          candidateProfileId,
          jobId,
          expiresAt: new Date(Date.now() + TTL_MS),
          events: { create: { type: "submitted", toStatus: "submitted" } },
        },
        include: { events: true },
      });
    } catch (err) {
      // Unique [candidateProfileId, jobId] → already applied. Friendly 409.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictError("You've already applied to this job.");
      }
      throw err;
    }
  },

  /** Move an application to a new status, logging a status_changed event. */
  async transition(applicationId: string, toStatus: ApplicationStatus) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundError("Application not found.");
    if (app.status === toStatus) return app; // no-op, no event
    return prisma.application.update({
      where: { id: applicationId },
      data: {
        status: toStatus,
        events: {
          create: {
            type: toStatus === "expired" ? "expired" : "status_changed",
            fromStatus: app.status,
            toStatus,
          },
        },
      },
      include: { events: true },
    });
  },

  /**
   * Expire-on-read: if a non-terminal application is past its deadline,
   * flip it to "expired" (writing an event) and return the updated row.
   * Otherwise returns the row untouched.
   */
  async expireOnRead<T extends Pick<Application, "id" | "status" | "expiresAt">>(
    application: T,
  ) {
    if (
      NON_TERMINAL.has(application.status as ApplicationStatus) &&
      application.expiresAt.getTime() < Date.now()
    ) {
      return this.transition(application.id, "expired");
    }
    return application;
  },
};
