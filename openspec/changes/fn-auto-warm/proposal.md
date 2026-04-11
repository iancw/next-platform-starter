## Why

The OCI image resize function is invoked on-demand during upload finalization, but cold-start latency can make the process feel slow. Since we know the user is about to upload as soon as they drop a valid image and the duplicate/recipe checks come back clean, we can fire a warm invocation early — before they even click Upload — to reduce the odds of hitting a cold container.

## What Changes

- After EXIF parsing completes successfully and the Upload button is enabled (valid recipe, no duplicate, no matching recipe), the client fires a fire-and-forget warm-up request to the server.
- A new API route accepts the warm-up request, requires authentication, and invokes the OCI resize function with an empty payload (no image).
- The resize function is expected to return quickly when given an empty payload, warming the container without doing real work.
- Warm-up errors are silently swallowed — this is best-effort and must not affect the upload flow.
- The warm-up is sent at most once per dropped image (not re-sent on re-render or partial state changes).

## Capabilities

### New Capabilities
- `resize-fn-pre-warm`: Client-triggered server route that sends a warm invocation to the OCI resize function when upload conditions are met, before the user clicks Upload.

### Modified Capabilities
<!-- No spec-level behavior changes to existing capabilities. -->

## Impact

- `app/upload/RecipeUpload.jsx` — new `useEffect` to detect when Upload button is enabled and fire warm-up
- `app/upload/warm-fn/route.js` — new authenticated POST route handler
- `lib/oci/functionsInvoke.js` — new `warmImageResizeFunction` export (empty payload invoke)
