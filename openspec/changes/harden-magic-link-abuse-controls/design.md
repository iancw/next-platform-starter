## Context

The current login flow is intentionally simple: `app/login/page.jsx` posts an email address to `app/auth/request-link/route.js`, which immediately calls `sendMagicLinkEmail()` in `lib/auth.js`. That function validates the address, creates a magic-link token row, and sends email without any request throttling, bot challenge, or abuse ledger.

That is acceptable for a private or low-traffic deployment, but it becomes a public-abuse primitive as soon as the route is discoverable. The fix needs to cover more than one module: login UI, request route, auth service, persistence, configuration, and tests. It also needs to preserve the product constraint that the login page stays easy to use and does not reveal whether an email already maps to a user record.

Stack constraints: Next.js App Router, server actions/routes in Node, Drizzle ORM with Postgres, and environment-driven operational settings. There is no existing captcha or generic rate-limiter subsystem in the repo.

## Goals / Non-Goals

**Goals:**
- Block anonymous scripted abuse before token creation and email delivery
- Enforce throttling on both normalized email and client network identity
- Require a verification challenge for magic-link requests made from the public login page
- Preserve privacy-safe user-facing responses that do not disclose account existence
- Store enough request outcome data to tune thresholds and investigate abuse later

**Non-Goals:**
- Building a reusable global rate-limiting framework for every endpoint in the app
- Replacing email-based login with passwords, OAuth, or invite-only auth
- Solving deliverability issues inside the OCI mail provider
- Adding a full moderation dashboard in this change

## Decisions

### 1. Enforce abuse checks before token creation and mail send

**Decision:** Introduce a dedicated preflight step inside the magic-link request flow so challenge verification and throttling happen before `createMagicLink()` or OCI email delivery is invoked.

**Rationale:** The security issue is not only the public route, but the fact that expensive side effects happen unconditionally. The guard must sit in the same server-side path that currently creates the token and sends mail so the protections cannot be bypassed by posting directly to the route.

**Alternative considered:** UI-only challenge enforcement. Rejected because the route would still accept handcrafted POSTs and remain abusable.

### 2. Use a DB-backed abuse ledger keyed by hashed email and hashed client IP

**Decision:** Add an `auth_magic_link_requests` table that stores one row per request attempt with hashed normalized email, hashed client IP, challenge result, final decision, and timestamp. Throttling will read recent rows in sliding windows to enforce:
- a short per-email cooldown to stop mailbox flooding
- a broader per-IP burst limit to stop cost amplification across many addresses

**Rationale:** Postgres is already the system of record and is available in every deployment. A single-purpose ledger keeps the implementation local to the app, makes incidents observable, and avoids taking a new distributed dependency just to protect one route.

**Alternative considered:** In-memory or edge-local rate limiting. Rejected because it does not survive process restarts, does not compose across instances, and provides no audit trail.

### 3. Hash abuse identifiers with a dedicated secret

**Decision:** Store hashed forms of normalized email and client IP using a dedicated secret-backed digest rather than raw identifiers.

**Rationale:** The app needs stable keys for throttling, but it does not need raw PII in an abuse log. Secret-backed hashing reduces the blast radius of the new table while still allowing consistent matching across requests.

**Alternative considered:** Store raw email/IP for simpler debugging. Rejected because it expands sensitive-data storage for a control path whose primary purpose is abuse prevention.

### 4. Require a public challenge token and verify it server-side through a provider adapter

**Decision:** The login form will include a challenge widget and submit its token with the email form. Server-side auth code will verify that token through a small provider adapter, with Cloudflare Turnstile as the initial implementation.

**Rationale:** Rate limiting alone still allows botnets or low-and-slow spam. A challenge materially raises the cost of automated abuse. Using a provider adapter keeps the auth flow decoupled from one vendor while allowing a concrete first implementation.

**Alternative considered:** Only require a challenge after suspicious traffic is detected. Rejected for this change because the current login form is a plain server-rendered POST and a conditional challenge flow adds extra state-management complexity before the route is even protected.

### 5. Use privacy-safe public outcomes with explicit cooldown signaling

**Decision:** Keep success responses generic and continue avoiding account-enumeration leaks. Add a dedicated public error code for throttled requests so the UI can tell the user to wait and retry without indicating whether the email belongs to an existing account.

**Rationale:** The product needs usable feedback when a legitimate user hits a cooldown, but the route must not reveal user existence or internal enforcement details.

**Alternative considered:** Always redirect with `sent=1` even on throttling. Rejected because it hides rate-limit behavior from legitimate users and encourages repeated retries.

### 6. Make thresholds environment-configurable with conservative defaults

**Decision:** Introduce env-backed configuration for challenge keys, abuse-hash secret, per-email cooldown, per-IP burst limit, and the length of the IP sliding window.

**Rationale:** Abuse tolerance changes across deployments and after launch. Thresholds need tuning without code edits, while defaults should still be safe for a public app.

**Alternative considered:** Hard-code fixed thresholds in `lib/auth.js`. Rejected because it makes production tuning slow and encourages ad hoc code changes during incidents.

## Risks / Trade-offs

Public challenge adds friction to login → Use a lightweight widget, keep success/failure messaging concise, and only require one challenge token per request.

IP-based throttling can penalize shared networks or mobile NATs → Combine IP limits with a separate email cooldown so one noisy network does not permanently block all users, and keep IP windows short.

DB-backed counting adds extra reads/writes on login → Limit the ledger to one insert per attempt plus indexed time-window queries on hashed identifiers; this is acceptable for the current traffic profile.

Challenge provider outage can degrade login availability → Fail closed when challenge verification is required, but make the provider configuration explicit so operators can diagnose or temporarily disable it deliberately rather than silently weakening the endpoint.

## Migration Plan

1. Add the new abuse-ledger table and indexes with a Drizzle migration.
2. Add environment variables for challenge verification and abuse-hash configuration in deployment environments.
3. Ship server-side enforcement first, together with the login-form challenge field, so the public route is never exposed without matching verification.
4. Validate in staging that successful requests create ledger rows, throttled requests do not send mail, and login UX shows the new cooldown state correctly.
5. Roll back by disabling the route change and migration together only if needed; the new table is additive and does not affect existing auth data.

## Open Questions

- Which exact Turnstile mode fits the desired UX best: visible widget or managed/invisible challenge?
- Should successful requests from the same email invalidate older unused magic links immediately, or is that a separate hardening change?
- Do operators want lightweight logging/metrics in app logs only, or should this change also expose an admin-visible abuse report later?
