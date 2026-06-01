/**
 * Password hashing helpers. Wraps bcryptjs so we never touch the
 * library directly in route handlers — keeps the surface easy to
 * audit and easy to swap (argon2id later if we want).
 */

import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
