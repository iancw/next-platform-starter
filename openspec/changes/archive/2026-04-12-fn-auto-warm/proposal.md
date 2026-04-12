## Why

The OCI image resize function is invoked on-demand during upload finalization, but cold-start latency can make the process feel slow. Since we know the user is about to upload as soon as they drop a valid image and the duplicate/recipe checks come back clean, we can fire a warm invocation early — before they even click Upload — to reduce the odds of hitting a cold container.

## What Changes

- When an authenticated user loads the upload page, the server fires a fire-and-forget warm invocation to the OCI resize function using Next.js `after()`.
- No client-side trigger, no dedicated API route — the warm call is initiated from the `page.jsx` server component, which already has the user session.
- The resize function returns quickly when given an empty payload, warming the container without doing real work.
- Warm-up errors are silently swallowed — this is best-effort and must not affect the upload flow.

## Capabilities

### New Capabilities
- `resize-fn-pre-warm`: Server-triggered warm invocation sent to the OCI resize function whenever an authenticated user loads the upload page.

### Modified Capabilities
<!-- No spec-level behavior changes to existing capabilities. -->

## Impact

- `app/upload/page.jsx` — import `after` and `warmImageResizeFunction`; fire warm call in background when user is present
- `lib/oci/functionsInvoke.js` — `warmImageResizeFunction` export (empty payload invoke) — no change needed
- `app/upload/warm-fn/route.js` — deleted (no longer called)
- `app/upload/RecipeUpload.jsx` — remove `warmSentRef`, warming `useEffect`, and ref reset in `handleRemoveImage`
