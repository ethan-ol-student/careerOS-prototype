-- Session revocation counter. Bumped on logout to invalidate all issued
-- JWTs for a user (the signed token carries the version; a stale version
-- is rejected in getAuthUser). Defaults to 0 so existing tokens stay valid.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
