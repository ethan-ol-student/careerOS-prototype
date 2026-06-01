import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/currentUser";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie } from "@/lib/auth/session";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";
import type { AuthRole } from "@/lib/auth/types";

/**
 * Account-level user fields shared by both roles (name / username /
 * email). Scoped to the session user — a caller can only edit or
 * delete their OWN account. Role is intentionally NOT editable here
 * (no insecure role switching).
 */
const PatchSchema = z
  .object({
    name: z.string().max(120).optional(),
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, . _ -")
      .optional(),
    email: z.string().email().max(120).optional(),
  })
  .strict();

function toRole(role: "CANDIDATE" | "EMPLOYER"): AuthRole {
  return role === "CANDIDATE" ? "candidate" : "employer";
}

/** PATCH /api/account — update safe user fields for the session user. */
export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    const json = await request.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid account update.",
      );
    }
    const data = parsed.data;

    // Uniqueness checks (exclude the current user).
    if (data.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } });
      if (taken && taken.id !== user.id) {
        return failFromCode("conflict", "That email is already in use.", 409);
      }
    }
    if (data.username) {
      const taken = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (taken && taken.id !== user.id) {
        return failFromCode("conflict", "That username is taken.", 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
      },
    });

    return ok({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        name: updated.name,
        role: toRole(updated.role),
      },
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const DeleteSchema = z.object({ password: z.string().min(1).max(200) });

/**
 * DELETE /api/account — permanently delete the session user's account.
 * Requires password re-entry. Cascades to all owned rows (profiles,
 * portfolio, chapters, notifications, conversations, …) via the
 * schema's `onDelete: Cascade`, then clears the session cookie.
 */
export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    const json = await request.json().catch(() => null);
    const parsed = DeleteSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        "Your password is required to delete your account.",
      );
    }
    if (!user.passwordHash) {
      return failFromCode("validation", "This account has no password set.", 400);
    }
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return failFromCode("forbidden", "Incorrect password.", 403);
    }

    await prisma.user.delete({ where: { id: user.id } });
    await clearSessionCookie();

    return ok({ deleted: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
