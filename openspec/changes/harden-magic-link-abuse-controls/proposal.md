## Why

The public magic-link request endpoint currently accepts unauthenticated POSTs and sends a sign-in email for any valid address with no abuse controls. That makes the login flow a spam relay and cost amplifier once the app is public, and it can also be used to flood a target mailbox with unwanted sign-in emails.

## What Changes

- Add server-side abuse protections to the magic-link request flow before a token is created or email is sent
- Enforce request throttling using both client network signals and normalized email address so repeated attempts are constrained even when one identifier rotates
- Introduce a challenge step for suspicious or high-volume requests instead of allowing unlimited anonymous submissions
- Return user-safe outcomes that do not leak account existence while still giving the UI enough information to communicate cooldown or retry states
- Record enough abuse-control metadata to support enforcement, observability, and later tuning

## Capabilities

### New Capabilities

- `magic-link-abuse-controls`: Abuse-resistant magic-link request handling, including throttling, escalation to a challenge, and safe responses for public login traffic

### Modified Capabilities

- (none - no existing specs to update)

## Impact

- **Auth route**: `app/auth/request-link/route.js`
- **Auth flow**: `lib/auth.js`
- **Login UI**: `app/login/page.jsx`
- **DB schema**: new persistence for magic-link request abuse tracking and cooldown windows
- **Ops/config**: new environment-backed settings for throttle windows, burst limits, and challenge enforcement
- **Email delivery**: sign-in mail is sent only after abuse checks pass
