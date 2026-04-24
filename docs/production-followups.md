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

