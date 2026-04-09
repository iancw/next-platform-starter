## 1. Data Model

- [x] 1.1 Add prepare/finalize binding fields to `images` for the prepared recipe reference, prepared original object key, and finalization marker
- [x] 1.2 Add any required indexes or constraints to keep the prepared object binding unique and queryable
- [x] 1.3 Generate the migration for the additive `images` schema changes

## 2. Prepare Flow

- [x] 2.1 Update `prepareRecipeUploadAction` to persist the prepared recipe binding and generated object key on the newly created image row
- [x] 2.2 Keep the prepare response backward-compatible while treating the persisted image binding as the source of truth for finalize

## 3. Finalize Flow Hardening

- [x] 3.1 Refactor `finalizeRecipeUploadAction` to load the prepared image binding and uploader from the database instead of trusting posted `recipeId`, `authorId`, or `objectKey`
- [x] 3.2 Enforce authorization by requiring the authenticated user to own the prepared image record before finalize can proceed
- [x] 3.3 Verify the original upload exists at the persisted object key and reject missing or size-mismatched objects before any attachment writes
- [x] 3.4 Finalize the image URL update, sample-image insertion, and finalization marker in a single transaction with retry-safe behavior

## 4. Client Contract

- [x] 4.1 Update the upload client/server action call site to stop depending on caller-supplied binding identifiers during finalize
- [x] 4.2 Preserve the existing user-visible upload flow and success/error handling after the finalize API contract is tightened

## 5. Regression Coverage

- [x] 5.1 Add tests for unauthorized finalize attempts against another user's prepared image
- [x] 5.2 Add tests proving tampered recipe or object identifiers cannot rebind a prepared upload
- [x] 5.3 Add tests for missing-object and size-mismatch finalize failures
- [x] 5.4 Add a retry/idempotency test showing repeated finalize calls do not duplicate recipe-sample associations or change the stored binding
