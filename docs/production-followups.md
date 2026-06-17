# Production Follow-Ups

## Ticket: Replace In-Memory Rate Limiting With Shared Store

- **Priority:** High
- **Owner:** Backend / Platform
- **Target areas:** `apps/web/lib/rate-limit.ts`, submit/login server actions

### Problem

Current rate limiting uses an in-memory map (`globalThis`), so limits reset on process restart and are not shared across instances. In production this weakens abuse protection for submission and auth endpoints.

### Scope

- Introduce a shared store-backed limiter (Redis/Upstash or equivalent).
- Keep existing scope/key model (`scope:key`) so behavior stays consistent.
- Add per-endpoint keys for:
  - submit show
  - account login/signup
  - promoter login/signup/forgot-password
  - moderator/admin login
- Preserve current user-facing behavior (`error=rate` redirects) while improving backend enforcement.

### Acceptance Criteria

- Rate limits are enforced consistently across multiple app instances.
- Limits survive restarts.
- Existing flows still return the same user-visible error states.
- Add tests for allow/block and retry window behavior.

## Ticket: Track Upstream Next.js PostCSS Advisory

- **Priority:** Medium
- **Owner:** Frontend / Platform
- **Target areas:** `apps/web/package.json`, `package-lock.json`

### Problem

`npm audit` still reports `GHSA-qx2v-qp2m-jg93` through `next -> postcss`. This app is already on `next@15.5.18`, and the full stable Next 15 and 16 lines currently still declare `postcss@8.4.31`, so there is no non-breaking project-level upgrade that removes the advisory today.

### Scope

- Track upstream Next.js releases for a dependency bump away from `postcss@8.4.31`.
- Re-run `npm audit --omit=dev` after each framework upgrade attempt.
- Remove this follow-up once a stable Next release clears the advisory.

### Acceptance Criteria

- A stable Next.js release is available that no longer bundles vulnerable PostCSS.
- The app upgrades to that release without regressions.
- `npm audit --omit=dev` no longer reports the `next/postcss` advisory.
