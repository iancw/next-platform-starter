## 1. Schema And Config

- [ ] 1.1 Add an `auth_magic_link_requests` ledger table and supporting indexes to `db/schema.ts` for hashed email, hashed client IP, challenge outcome, decision, and timestamps
- [ ] 1.2 Generate the Drizzle migration for the new abuse-ledger table
- [ ] 1.3 Add auth-abuse configuration helpers for challenge keys, abuse-hash secret, email cooldown, IP burst limit, and IP window settings
- [ ] 1.4 Add helper utilities to normalize client identifiers and compute secret-backed hashes for email and IP values

## 2. Challenge Verification

- [ ] 2.1 Add a server-side challenge verification module with a provider adapter for the selected captcha service and explicit failure handling
- [ ] 2.2 Update the login form in `app/login/page.jsx` to render the challenge widget and submit the challenge token with the magic-link form
- [ ] 2.3 Update login-page messaging so challenge failures and missing tokens surface a safe retry message

## 3. Auth Flow Enforcement

- [ ] 3.1 Update `app/auth/request-link/route.js` to capture the challenge token, normalize the caller IP, and pass abuse-control inputs into the auth service
- [ ] 3.2 Refactor `lib/auth.js` so abuse checks run before `createMagicLink()` and OCI email delivery
- [ ] 3.3 Implement sliding-window throttle evaluation for per-email cooldown and per-IP burst limits using the abuse ledger
- [ ] 3.4 Record accepted and rejected attempts in the abuse ledger with hashed identifiers, challenge outcome, and final decision
- [ ] 3.5 Add a dedicated public throttle/error code path that preserves generic success semantics and avoids account-enumeration leakage

## 4. Verification And Rollout

- [ ] 4.1 Add unit tests for config parsing, identifier hashing, challenge verification handling, and throttle decision logic
- [ ] 4.2 Add auth-flow tests covering valid requests, invalid challenge tokens, repeated-email cooldown, and IP burst throttling with assertions that blocked requests do not create tokens or send mail
- [ ] 4.3 Document the new environment variables and operational expectations for deploying the protected magic-link flow
