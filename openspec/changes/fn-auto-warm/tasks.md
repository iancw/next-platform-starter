## 1. OCI Invoke Layer

- [x] 1.1 Add `warmImageResizeFunction` to `lib/oci/functionsInvoke.js` — invokes the function with an empty `{}` payload using the same client setup as `invokeImageResizeFunction`, errors swallowed internally

## 2. API Route

- [x] 2.1 Create `app/upload/warm-fn/route.js` with a `POST` handler that calls `requireUser()`, invokes `warmImageResizeFunction`, catches and logs any error, and always returns `204 No Content`

## 2a. OCI Function — Warm-up Early Return

- [x] 2a.1 Update `oci-functions/image-resize-fn/func.py` handler to detect an empty payload (`payload == {}`) and return early with `{"ok": True, "warm": True}` and status 200, before any parsing or OCI client calls. Add a corresponding test in `test_func.py` asserting that `handler(ctx, data=b'{}')` returns status 200 with `ok: True` and does not attempt any OCI calls.

## 3. Client Trigger

- [x] 3.1 Add `warmSentRef` (`useRef(false)`) to `RecipeUpload.jsx` to track whether the warm-up has been sent for the current image session
- [x] 3.2 Reset `warmSentRef.current = false` in `handleRemoveImage`
- [x] 3.3 Add a `useEffect` in `RecipeUpload.jsx` that fires when `recipe`, `duplicateMatch`, `matchingRecipe`, `isCheckingDuplicate`, `isCheckingMatch`, and `imageFiles` change — when all upload-button-enabled conditions are met and `warmSentRef.current` is false, set `warmSentRef.current = true` and call `fetch('/upload/warm-fn', { method: 'POST' }).catch(() => {})`
