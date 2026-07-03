# Google SSO — design note (no UI yet)

Status: **BUILT (Week 3).** Routes: `GET /api/auth/google/{start,callback}` +
`POST /api/auth/google/role` (first-login role select at `/auth/google/role`).
Helpers in `src/lib/auth/google.ts` (PKCE via node:crypto, id_token verified
against Google's JWKS via jose — no new dependency). The button on `/auth` is
gated by `NEXT_PUBLIC_ENABLE_GOOGLE_SSO`; server routes 404 unless
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set, so the whole feature is
inert until configured (the risk backup). The rest of this note remains the
design rationale.

## Principle

SSO is an *additional* way to obtain the **same session** password auth already
issues. The OAuth callback ends by calling the existing
`signSession()` + `setSessionCookie()` (`src/lib/auth/session.ts`) — the same
`jose` HS256 cookie (`career-os-session`, httpOnly, 7d). **Nothing downstream
changes**: `readSession()`, `getAuthUser()`, the shells, and every `/api/me*`
route keep working unchanged, because a session minted via Google is
byte-for-byte the same as one minted via password.

## Data model (already migrated)

```
OAuthAccount
  id, userId → User (cascade)
  provider          = "google"
  providerAccountId = Google `sub` (stable id)
  email             = email asserted by Google
  @@unique([provider, providerAccountId])
```

`User.passwordHash` is already optional, so an SSO-only account needs no
password. A user can have both a password and one or more `OAuthAccount` rows.

## Flow (to build in Week 4)

1. **Initiate** — `GET /api/auth/google` builds the Google consent URL and
   redirects. Generates a random `state` (CSRF) + PKCE `code_verifier`, stored
   in short-lived httpOnly cookies. Scope: `openid email profile`.
2. **Consent** — Google redirects back to the callback with `code` + `state`.
3. **Callback** — `GET /api/auth/google/callback`:
   - Verify `state` matches the cookie (reject otherwise → 403).
   - Exchange `code` (+ PKCE verifier) for tokens; verify the `id_token`
     signature and `aud`/`iss`; read `sub` + `email` + `email_verified`.
   - **Resolve the user (account linking):**
     1. `OAuthAccount` with `(provider, providerAccountId=sub)` exists → use its `User`.
     2. else a `User` with that **verified** email exists → create an
        `OAuthAccount` linking it (link by verified email only).
     3. else create a new `User` (role chosen later in onboarding) **+** its
        `OAuthAccount`.
   - **Mint the session:** `setSessionCookie(await signSession({ userId, role, isJudge }))`.
   - Redirect to the post-login destination (dashboard/onboarding, same logic as password login).

## Security

- `state` (CSRF) + **PKCE** required; reject on mismatch.
- Link an existing account **only** when `email_verified === true` — never link
  on an unverified email (account-takeover vector).
- Verify the `id_token` (signature, `iss=https://accounts.google.com`, `aud`,
  `exp`); never trust the userinfo endpoint alone.
- Reuse the existing CSRF middleware exemption model: these GET routes are
  navigations, not mutating `/api/*` calls.

## Env vars (add in Week 4)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=   # https://<staging|prod>/api/auth/google/callback
```

## Deferred

- The "Continue with Google" button + auth-page wiring → **Week 4**.
- Multi-provider (GitHub, etc.) — the `provider` column already generalizes;
  add rows, no schema change.
