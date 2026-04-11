## Context

The OCI image resize function is invoked server-side during `finalizeRecipeUploadAction`. On a cold start the function container must boot before it can process the image, which adds noticeable latency. Users tend to spend a few seconds reviewing the detected recipe settings after dropping an image, which is idle time we can use to warm the function before they click Upload.

The upload page already performs two async checks after a file is dropped (duplicate image hash check, recipe settings match check). These checks define when the Upload button becomes enabled. If both checks pass — meaning the image is valid, unique, and represents a new recipe — the user is almost certainly about to click Upload. That is the ideal moment to send a warm-up invocation.

## Goals / Non-Goals

**Goals:**
- Reduce cold-start latency perceived by users by pre-warming the resize function before Upload is clicked.
- Keep the warm-up entirely transparent: no UI feedback, no effect on upload success/failure.
- Trigger at most once per dropped image to avoid hammering the function.

**Non-Goals:**
- Guaranteeing the function will be warm by the time Upload is clicked (this is best-effort).
- Warming on attach-as-community-sample flows or for invalid/duplicate images.
- Changing any aspect of the actual resize invocation during finalization.

## Decisions

### Warm payload via a new `warmImageResizeFunction` export

The existing `invokeImageResizeFunction` validates that `sourceBucket` and `objectName` are present and throws without them. Rather than relaxing that contract, a new `warmImageResizeFunction` function sends an empty JSON object (`{}`) as the payload. The OCI function is expected to detect the missing fields and return early without error, warming its container in the process. Keeping the two call sites separate avoids adding conditional logic to the production resize path.

### API route handler rather than server action

The warm-up is fire-and-forget from the client. A Next.js Route Handler (`POST /upload/warm-fn`) is a better fit than a server action here because:
- It can be called with `fetch` and the response ignored without waiting.
- It does not need to return a structured result or participate in form state.
- It is easy to call from a `useEffect` without React's server-action constraints.

Authentication is still required (via `requireUser`) so the endpoint cannot be hit anonymously.

### `useEffect` with a sent-flag ref

The client triggers the warm-up from a `useEffect` that watches the state variables that determine whether the Upload button is enabled and visible:
- `recipe` (valid EXIF parsed)
- `duplicateMatch` (no duplicate)
- `matchingRecipe` (no existing recipe match)
- `isCheckingDuplicate` / `isCheckingMatch` (async checks complete)
- `imageFiles` (image present)

A `useRef` (`warmSentRef`) is set to `true` after the warm-up fetch is dispatched and reset to `false` in `handleRemoveImage`. This ensures exactly one warm-up per image session regardless of re-renders.

The fetch is intentionally not awaited and errors are caught and discarded:
```js
fetch('/upload/warm-fn', { method: 'POST' }).catch(() => {});
```

## Risks / Trade-offs

- [The function may still be cold at upload time] → Acceptable: the warm-up shortens the expected cold-start window, not eliminates it. Existing retry logic in `invokeResizeWithRetry` still handles transient failures.
- [Unnecessary warm invocations if user removes image] → Mitigated: `warmSentRef` prevents re-firing, and `handleRemoveImage` resets it so a fresh image can trigger again.
- [OCI function returns a non-2xx for empty payload] → `warmImageResizeFunction` swallows all errors; the route handler returns 204 regardless. No user-visible impact.
- [Extra authenticated request visible in network tools] → Low concern; it is a small POST with no body. Users inspecting devtools will see it but it has no harmful side-effects.
