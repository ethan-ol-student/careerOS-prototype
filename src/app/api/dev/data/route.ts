import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { devModeGuard, loadTestContext } from "@/lib/dev/testApi";
import {
  DEV_SKILLS,
  devPortfolioScalars,
  devProjects,
  devExperiences,
  devCertificates,
  devAwards,
  devChapters,
  devCandidateNotifications,
  devEmployerNotifications,
  devMessages,
} from "@/lib/dev/testDataSeed";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const Schema = z.object({
  action: z.enum([
    "candidate.portfolio.fill",
    "candidate.portfolio.empty",
    "candidate.skills.fill",
    "candidate.skills.empty",
    "candidate.chapters.fill",
    "candidate.chapters.empty",
    "candidate.notifications.fill",
    "candidate.notifications.read",
    "candidate.notifications.empty",
    "employer.saved.fill",
    "employer.saved.empty",
    "employer.notifications.fill",
    "employer.notifications.read",
    "employer.notifications.empty",
    "employer.messages.fill",
    "employer.messages.empty",
    "employer.invites.fill",
    "employer.invites.accept",
    "employer.invites.empty",
  ]),
});

const NO_MARKET =
  "No marketplace candidates found — run `npm run db:seed` first.";

/**
 * POST /api/dev/data — seed or clear mock data for the test account.
 * Dev only. Every write is scoped to the test account's own profiles.
 */
export async function POST(request: Request) {
  const blocked = devModeGuard();
  if (blocked) return blocked;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "Unknown data action.");
    }
    const { action } = parsed.data;
    const ctx = await loadTestContext();
    const profileId = ctx.candidateProfileId;
    const employerId = ctx.employerProfileId;

    const sampleCandidateIds = async (take: number) =>
      (
        await prisma.candidate.findMany({
          take,
          orderBy: { matchScore: "desc" },
          select: { id: true },
        })
      ).map((c) => c.id);

    let message = "Done.";

    switch (action) {
      // ── Candidate: portfolio ──────────────────────────────────────
      case "candidate.portfolio.fill": {
        await prisma.$transaction([
          prisma.project.deleteMany({ where: { profileId } }),
          prisma.experience.deleteMany({ where: { profileId } }),
          prisma.certificate.deleteMany({ where: { profileId } }),
          prisma.award.deleteMany({ where: { profileId } }),
          prisma.candidateProfile.update({
            where: { id: profileId },
            data: {
              ...devPortfolioScalars(),
              totalAdditions: 6,
              lastUpdated: new Date(),
            },
          }),
          prisma.project.createMany({
            data: devProjects().map((p) => ({ ...p, profileId })),
          }),
          prisma.experience.createMany({
            data: devExperiences().map((e) => ({ ...e, profileId })),
          }),
          prisma.certificate.createMany({
            data: devCertificates().map((c) => ({ ...c, profileId })),
          }),
          prisma.award.createMany({
            data: devAwards().map((a) => ({ ...a, profileId })),
          }),
        ]);
        message = "Portfolio filled.";
        break;
      }
      case "candidate.portfolio.empty": {
        await prisma.$transaction([
          prisma.project.deleteMany({ where: { profileId } }),
          prisma.experience.deleteMany({ where: { profileId } }),
          prisma.certificate.deleteMany({ where: { profileId } }),
          prisma.award.deleteMany({ where: { profileId } }),
          prisma.candidateProfile.update({
            where: { id: profileId },
            data: {
              headline: "",
              summary: "",
              bio: "",
              skills: [],
              totalAdditions: 0,
              lastUpdated: null,
            },
          }),
        ]);
        message = "Portfolio cleared.";
        break;
      }

      // ── Candidate: skills ─────────────────────────────────────────
      case "candidate.skills.fill": {
        await prisma.candidateProfile.update({
          where: { id: profileId },
          data: { skills: DEV_SKILLS, lastUpdated: new Date() },
        });
        message = "Skills filled.";
        break;
      }
      case "candidate.skills.empty": {
        await prisma.candidateProfile.update({
          where: { id: profileId },
          data: { skills: [] },
        });
        message = "Skills cleared.";
        break;
      }

      // ── Candidate: chapters ───────────────────────────────────────
      case "candidate.chapters.fill": {
        await prisma.chapterEvent.deleteMany({ where: { profileId } });
        await prisma.chapterEvent.createMany({
          data: devChapters().map((c) => ({ ...c, profileId })),
        });
        message = "Timetable filled.";
        break;
      }
      case "candidate.chapters.empty": {
        await prisma.chapterEvent.deleteMany({ where: { profileId } });
        message = "Timetable cleared.";
        break;
      }

      // ── Candidate: notifications ──────────────────────────────────
      case "candidate.notifications.fill": {
        await prisma.candidateNotification.deleteMany({ where: { profileId } });
        await prisma.candidateNotification.createMany({
          data: devCandidateNotifications().map((n) => ({ ...n, profileId })),
        });
        message = "Notifications added (unread).";
        break;
      }
      case "candidate.notifications.read": {
        await prisma.candidateNotification.updateMany({
          where: { profileId, read: false },
          data: { read: true },
        });
        message = "Notifications marked read.";
        break;
      }
      case "candidate.notifications.empty": {
        await prisma.candidateNotification.deleteMany({ where: { profileId } });
        message = "Notifications cleared.";
        break;
      }

      // ── Employer: saved ───────────────────────────────────────────
      case "employer.saved.fill": {
        const ids = await sampleCandidateIds(3);
        if (ids.length === 0) return ok({ message: NO_MARKET });
        for (const candidateId of ids) {
          await prisma.employerSavedCandidate.upsert({
            where: { employerId_candidateId: { employerId, candidateId } },
            create: { employerId, candidateId },
            update: {},
          });
        }
        message = `Saved ${ids.length} candidates.`;
        break;
      }
      case "employer.saved.empty": {
        await prisma.employerSavedCandidate.deleteMany({ where: { employerId } });
        message = "Saved candidates cleared.";
        break;
      }

      // ── Employer: notifications ───────────────────────────────────
      case "employer.notifications.fill": {
        const [sampleId] = await sampleCandidateIds(1);
        await prisma.employerNotification.deleteMany({ where: { employerId } });
        await prisma.employerNotification.createMany({
          data: devEmployerNotifications(sampleId ?? null).map((n) => ({
            ...n,
            employerId,
          })),
        });
        message = "Notifications added (unread).";
        break;
      }
      case "employer.notifications.read": {
        await prisma.employerNotification.updateMany({
          where: { employerId, read: false },
          data: { read: true },
        });
        message = "Notifications marked read.";
        break;
      }
      case "employer.notifications.empty": {
        await prisma.employerNotification.deleteMany({ where: { employerId } });
        message = "Notifications cleared.";
        break;
      }

      // ── Employer: messages ────────────────────────────────────────
      case "employer.messages.fill": {
        const [candidateId] = await sampleCandidateIds(1);
        if (!candidateId) return ok({ message: NO_MARKET });
        let convo = await prisma.chatConversation.findUnique({
          where: { employerId_candidateId: { employerId, candidateId } },
        });
        if (!convo) {
          convo = await prisma.chatConversation.create({
            data: { employerId, candidateId },
          });
        }
        await prisma.chatMessage.deleteMany({
          where: { conversationId: convo.id },
        });
        await prisma.chatMessage.createMany({
          data: devMessages().map((m) => ({ ...m, conversationId: convo!.id })),
        });
        message = "Conversation seeded.";
        break;
      }
      case "employer.messages.empty": {
        await prisma.chatConversation.deleteMany({ where: { employerId } });
        message = "Conversations cleared.";
        break;
      }

      // ── Employer: invites ─────────────────────────────────────────
      case "employer.invites.fill": {
        const ids = await sampleCandidateIds(3);
        if (ids.length === 0) return ok({ message: NO_MARKET });
        for (const candidateId of ids) {
          await prisma.employerInvitedCandidate.upsert({
            where: { employerId_candidateId: { employerId, candidateId } },
            create: { employerId, candidateId },
            update: {},
          });
        }
        message = `Invited ${ids.length} candidates.`;
        break;
      }
      case "employer.invites.accept": {
        const [candidateId] = await sampleCandidateIds(1);
        if (!candidateId) return ok({ message: NO_MARKET });
        await prisma.employerInvitedCandidate.upsert({
          where: { employerId_candidateId: { employerId, candidateId } },
          create: { employerId, candidateId },
          update: {},
        });
        await prisma.employerNotification.create({
          data: {
            employerId,
            kind: "invite-accepted",
            title: "Invite accepted",
            body: "A candidate accepted your invite and is open to chatting.",
            candidateId,
          },
        });
        message = "Invite + acceptance seeded.";
        break;
      }
      case "employer.invites.empty": {
        await prisma.employerInvitedCandidate.deleteMany({ where: { employerId } });
        message = "Invites cleared.";
        break;
      }
    }

    return ok({ message });
  } catch (err) {
    return failFromUnknown(err);
  }
}
