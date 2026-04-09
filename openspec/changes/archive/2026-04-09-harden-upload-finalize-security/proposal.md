## Why

The upload finalize action currently trusts caller-supplied `recipeId`, `authorId`, and `objectKey` more than it should. A caller who bypasses the browser flow can attach an uploaded image to the wrong recipe or point an image row at an existing storage object they did not upload, which is a release-blocking authorization flaw.

## What Changes

- Bind upload finalization to server-issued upload state created during the prepare step instead of trusting posted identifiers on finalize
- Require the finalize step to derive the effective author and recipe association from server-owned records and the authenticated user
- Reject finalize requests when the object key, image row, or target recipe does not match the prepared upload
- Prevent callers from attaching images to recipes they do not own through direct server action invocation
- Preserve the current upload UX while tightening the contract between prepare, direct object upload, and finalize

## Capabilities

### New Capabilities
- `secure-upload-finalization`: Server-authorized finalization of prepared uploads, including binding storage objects and recipe image associations to the authenticated uploader

### Modified Capabilities

## Impact

- **Upload server actions**: [`app/upload/actions.js`](/Users/ian.will/dev/src/github.com/iancw/om-recipes/app/upload/actions.js) will enforce a stronger prepare/finalize trust boundary
- **Data model**: upload preparation state may need to persist additional server-owned binding data so finalize can validate recipe, image, and object ownership
- **Object storage integration**: finalize must verify the uploaded object against the prepared key rather than any caller-supplied key
- **Authorization rules**: recipe sample image creation must only succeed for recipes the uploader is allowed to modify
