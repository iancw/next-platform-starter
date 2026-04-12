## Context

The OCI image resize function is invoked server-side during `finalizeRecipeUploadAction`. On a cold start the function container must boot before it can process the image, which adds noticeable latency. Users navigate to the upload page before they interact with any form elements, which gives us a predictable server-side moment to fire a warm invocation — before the user has even dropped an image.

## Goals / Non-Goals

**Goals:**
- Reduce cold-start latency perceived by users by pre-warming the resize function when the upload page loads.
- Keep the warm-up entirely transparent: no UI feedback, no effect on upload success/failure.
- Require authentication: only fire for users who are already signed in.

**Non-Goals:**
- Guaranteeing the function will be warm by the time Upload is clicked (this is best-effort).
- Warming for unauthenticated visitors.
- Changing any aspect of the actual resize invocation during finalization.

## Decisions

### Warm payload via a dedicated `warmImageResizeFunction` export

The existing `invokeImageResizeFunction` validates that `sourceBucket` and `objectName` are present and throws without them. Rather than relaxing that contract, a separate `warmImageResizeFunction` sends an empty JSON object (`{}`) as the payload. The OCI function detects the empty payload and returns early with `{"ok": true, "warm": true}` without doing any real work, warming its container in the process. Keeping the two call sites separate avoids adding conditional logic to the production resize path.

### Server component `after()` rather than a client trigger

The original design fired the warm-up from a client `useEffect` when upload conditions were met (valid image, no duplicate, no recipe match). This was replaced with a server-side call using Next.js `after()` in the upload `page.jsx`:

- The page server component already runs `getSession()` and has the user object — no additional auth round-trip needed.
- `after()` runs the callback after the response has been sent, making it true fire-and-forget with zero impact on page load time.
- Page load fires earlier and more reliably than waiting for EXIF parsing and async checks to complete, giving the container more lead time to warm.
- Removes the need for a dedicated API route, a client `useRef`, and a `useEffect` dependency array.

Errors are swallowed inside `warmImageResizeFunction`; no unhandled rejections, no user-visible impact.

## Risks / Trade-offs

- [The function may still be cold at upload time] → Acceptable: the warm-up shortens the expected cold-start window, not eliminates it. Existing retry logic in `invokeResizeWithRetry` still handles transient failures.
- [Warm invocations fired on every authenticated page load, not just when the user is about to upload] → Acceptable: the warm call is cheap (empty payload, early return in the function), and the upload page is low-traffic enough that this is not a concern.
- [OCI function returns a non-2xx for empty payload] → `warmImageResizeFunction` swallows all errors. No user-visible impact.
