## Context

The current upload flow is split across three systems:

1. `prepareRecipeUploadAction` authenticates the user, creates or matches a recipe, inserts an `images` row, and generates a direct-upload object key.
2. The browser uploads the JPEG directly to object storage using the returned PAR URL.
3. `finalizeRecipeUploadAction` verifies that some object exists at the caller-supplied key, updates the image row, inserts a `recipe_sample_images` row, and kicks off resize generation.

The security flaw is in step 3. Finalize currently trusts `recipeId`, `authorId`, and `objectKey` from the request body, even though the server already knew the intended values during prepare. That allows a direct caller to replay finalize with a different recipe or an unrelated object key from the original bucket.

Constraints:

- Keep the direct-to-object-storage upload flow and current user-visible UX.
- Preserve the current product behavior where a user may contribute a sample image to an existing matched recipe they did not author.
- Do not rely on client secrecy; any parameter returned to the browser can be replayed or modified.
- Keep finalize resilient to retried submissions and existing resize behavior.

## Goals / Non-Goals

**Goals:**
- Bind each prepared upload to one server-owned image record, one intended recipe, and one expected storage object key.
- Make finalize derive its effective author and recipe association from persisted server state plus the authenticated user.
- Reject finalize when the uploaded object does not match the prepared object or when the image does not belong to the current user.
- Prevent rebinding an image row to a different recipe or object after prepare.

**Non-Goals:**
- Redesign the upload UI or replace the direct PAR upload mechanism.
- Change recipe dedupe rules or who is allowed to contribute sample images to an existing recipe.
- Introduce moderation, antivirus scanning, or broader upload lifecycle cleanup beyond what is needed for secure finalization.

## Decisions

### 1. Persist the expected finalize binding on the `images` row

**Decision:** Store the prepare-time binding on the existing `images` record, including the expected `recipeId`, expected object key, and a finalized marker/timestamp.

**Rationale:** Each prepared upload already creates exactly one image row. Persisting the binding there keeps the security state in the same record that finalize already updates, avoids a second lifecycle table, and makes it straightforward to enforce one-time binding.

**Alternative considered:** A separate `upload_sessions` table. This would also work, but it adds a second record to create, query, and clean up for a one-to-one relationship that already has a natural home on `images`.

**Alternative considered:** A signed finalize token containing `recipeId` and `objectKey`. This removes the schema change but still relies on replayable client-held state and makes one-time-use semantics harder to enforce cleanly.

### 2. Finalize must derive authorization and target association from server state

**Decision:** Finalize will accept only the minimum caller input required to complete validation, then load the image row and its prepared binding from the database. The action will derive the effective uploader from the authenticated session and the image's author relationship, and it will derive the effective target recipe from the prepared record instead of trusting posted `recipeId` or `authorId`.

**Rationale:** The caller is not an authority on image ownership or recipe binding. The prepare step already authenticated the user and selected the recipe. Re-using that decision closes the direct-invocation hole without changing intended behavior for legitimate uploads to matched existing recipes.

**Alternative considered:** Keep the current finalize parameters and compare them to stored values. This is safer than the current behavior but retains unnecessary attack surface and makes the API easier to misuse in future edits.

### 3. Object verification must use the prepared object key and be single-binding

**Decision:** Finalize will ignore any caller-supplied object identity and verify object existence and size using the object key persisted during prepare. The image row's object key becomes immutable once set at prepare time, and finalize will refuse to overwrite a finalized binding.

**Rationale:** The root issue is that finalize can currently be pointed at any object already present in the bucket. Using only the prepared key restores the trust boundary: the server chooses the object name, the browser only uploads bytes to it.

**Alternative considered:** Continue accepting a posted object key but ensure it belongs to the same author prefix. That still allows rebinding to a different prepared object owned by the same author and is weaker than binding to the exact prepared key.

### 4. Finalize database writes should be transactional and idempotent

**Decision:** Updating the image's permanent URLs, recording finalization, and inserting the sample-image association should happen in one transaction. Repeated finalize calls for the same image should not create new associations or change the stored binding.

**Rationale:** The current flow mixes validation, row updates, and side effects across separate statements. A transaction makes the core state change atomic. Idempotent handling prevents duplicate browser submissions from turning into inconsistent bindings.

**Alternative considered:** Reject every second finalize attempt unconditionally. That is stricter, but it creates avoidable user-facing failures if the client retries after a network interruption.

## Risks / Trade-offs

- [Prepared uploads abandoned before finalize] → The system will accumulate some prepared-but-unfinalized image rows. That is acceptable for this security fix; cleanup can be handled separately if needed.
- [Schema change on a hot path] → Keep the new columns additive and nullable so deploy is backward compatible until code is switched over.
- [Existing clients calling finalize with old parameters] → Make the server tolerant during rollout by ignoring obsolete fields rather than requiring them.
- [Retry behavior around resize generation] → Limit the idempotent guarantee to the binding and DB writes; resize can remain best-effort after the transaction, as it is today.

## Migration Plan

1. Add additive columns on `images` for the prepared recipe binding, prepared object key, and finalization marker.
2. Update `prepareRecipeUploadAction` to persist those values when it creates the image row.
3. Update `finalizeRecipeUploadAction` to authenticate the uploader through the stored image/author relationship, derive the recipe/object binding from the image row, and finalize transactionally.
4. Deploy the code after the migration. Existing in-flight uploads prepared before the deployment can be allowed to fail fast and be retried through prepare, because the upload window is short-lived.
5. Rollback strategy: revert the application code first if needed; the additive columns can remain unused safely.

## Open Questions

- Should a second finalize call return the already-finalized payload or a specific "already finalized" response? Either is safe; returning the existing payload is friendlier for retries.
- Should the prepared object key be stored as a dedicated internal column, or should the system introduce a more general internal storage-path field that can be reused elsewhere later?
