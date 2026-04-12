## 1. OCI Invoke Layer

- [x] 1.1 Add `warmImageResizeFunction` to `lib/oci/functionsInvoke.js` — invokes the function with an empty `{}` payload using the same client setup as `invokeImageResizeFunction`, errors swallowed internally

## 2. OCI Function — Warm-up Early Return

- [x] 2.1 Update `oci-functions/image-resize-fn/func.py` handler to detect an empty payload (`payload == {}`) and return early with `{"ok": True, "warm": True}` and status 200, before any parsing or OCI client calls. Add a corresponding test in `test_func.py` asserting that `handler(ctx, data=b'{}')` returns status 200 with `ok: True` and does not attempt any OCI calls.

## 3. Server-side Trigger

- [ ] 3.1 In `app/upload/page.jsx`, import `after` from `next/server` and `warmImageResizeFunction` from `lib/oci/functionsInvoke.js`; inside the `user` branch (where `RecipeUpload` is rendered), add `after(() => warmImageResizeFunction().catch(() => {}))` before the return

## 4. Remove Client-side Trigger

- [ ] 4.1 Delete `app/upload/warm-fn/route.js`
- [ ] 4.2 In `app/upload/RecipeUpload.jsx`, remove the `warmSentRef` declaration (`useRef(false)`), the warming `useEffect` (the one that calls `fetch('/upload/warm-fn', ...)`), and the `warmSentRef.current = false` reset in `handleRemoveImage`
