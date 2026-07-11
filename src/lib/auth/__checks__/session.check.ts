/**
 * Deterministic assertions for session signing + revocation.
 * Run: `npm run check:auth` (also in CI). No DB, no secrets — uses the
 * dev-fallback signing key (NODE_ENV !== production).
 */
import assert from "node:assert/strict";
import {
  signSession,
  verifySession,
  sessionMatchesVersion,
} from "../session";

async function run() {
  // 1) sign → verify round-trips the session version.
  const token = await signSession({
    userId: "u_1",
    role: "candidate",
    sessionVersion: 3,
  });
  const payload = await verifySession(token);
  assert.ok(payload, "valid token must verify");
  assert.equal(payload!.userId, "u_1");
  assert.equal(payload!.role, "candidate");
  assert.equal(payload!.sessionVersion, 3, "version must survive the round-trip");

  // 2) A tampered/garbage token verifies to null (fail closed).
  assert.equal(await verifySession("not-a-jwt"), null);

  // 3) Revocation logic: token version must equal the user's current version.
  assert.equal(sessionMatchesVersion(3, 3), true, "matching version → valid");
  assert.equal(sessionMatchesVersion(2, 3), false, "stale version → revoked");
  // Pre-revocation tokens carry no version → treated as 0.
  assert.equal(sessionMatchesVersion(undefined, 0), true, "legacy token vs fresh user");
  assert.equal(sessionMatchesVersion(undefined, 1), false, "legacy token vs bumped user");

  console.log("check:auth — session sign/verify/revocation OK");
}

run().catch((err) => {
  console.error("check:auth FAILED");
  console.error(err);
  process.exit(1);
});
