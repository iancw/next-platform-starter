## Context

The app already has two building blocks relevant to backups:

1. Database access is configured through `NETLIFY_DATABASE_URL`, and repo-local scripts already use `.env.local` plus Node entrypoints under `scripts/*.mjs`.
2. OCI Object Storage uploads are already supported through [`lib/oci/objectStorage.js`](/Users/ian.will/dev/src/github.com/iancw/om-recipes/lib/oci/objectStorage.js), which constructs a client from OCI API-key environment variables.

What is missing is a repeatable operator workflow that produces a restorable database snapshot and stores it in object storage. A backup script is a cross-cutting change because it touches operational tooling, object storage integration, documentation, and local/runtime prerequisites.

Constraints:

- Use the existing Postgres database identified by `NETLIFY_DATABASE_URL`.
- Reuse the existing OCI credentials and object-storage client path already in the repo.
- Keep the first version operator-run from the repo; do not require adding a scheduled service in this change.
- Produce a dump format that is suitable for restore tooling rather than an application-level JSON export.
- Avoid holding the full dump in memory before upload.

## Goals / Non-Goals

**Goals:**
- Provide a single repo command that creates a PostgreSQL backup and uploads it to a configured OCI bucket.
- Ensure each successful run writes to a unique, timestamped object key.
- Fail clearly when required env vars or local prerequisites are missing.
- Leave operators with enough output to confirm which backup object was created.

**Non-Goals:**
- Automate recurring schedules, retention, or pruning of old backups.
- Implement restore automation in this change.
- Encrypt dumps beyond the storage-layer protections already provided by OCI and the environment where the script runs.
- Add a database-independent export format.

## Decisions

### 1. Implement the backup flow as a repo script plus npm script entrypoint

**Decision:** Add a new script under `scripts/backup-database-to-object-storage.mjs` and expose it through `package.json`.

**Rationale:** This repo already uses script entrypoints for database and operational workflows. Keeping backups in the same shape makes the command discoverable, allows local `.env.local` loading, and avoids introducing a second deployment surface for a one-off operator task.

**Alternative considered:** A server action or route handler. That would expose backup behavior through the running app and increase the blast radius of a privileged operation that should remain operator-only.

### 2. Use `pg_dump` to create a custom-format dump in a temporary file before upload

**Decision:** The script will invoke `pg_dump` against `NETLIFY_DATABASE_URL`, write a custom-format dump (`-Fc`) to a temporary file, and upload that file to object storage.

**Rationale:** `pg_dump` is the correct tool for producing a restorable Postgres backup, including schema and data. Writing to a temporary file avoids buffering the entire dump in memory and makes it straightforward to inspect file size, compute the final object key, and clean up after success or failure.

**Alternative considered:** Querying data through the app's database client and serializing it to JSON. That is not a complete backup and would lose restore fidelity for schema, indexes, and database-native state.

**Alternative considered:** Streaming `pg_dump` output directly to OCI without a temp file. That is possible, but it complicates retry/error handling and local verification for a first implementation.

### 3. Reuse existing OCI credentials and add backup-specific bucket selection

**Decision:** The script will use the existing OCI client env vars already required by `lib/oci/objectStorage.js`, plus a new required `OCI_DB_BACKUP_BUCKET` env var and an optional `OCI_DB_BACKUP_PREFIX`.

**Rationale:** The repo already has one supported way to authenticate with OCI. Reusing it keeps the credential model consistent while separating backup destination selection from the image-upload buckets used elsewhere in the app.

**Alternative considered:** Reusing one of the existing image buckets. That couples unrelated data lifecycles and makes retention and access control harder to reason about.

### 4. Backup object names will be timestamped and include the database name

**Decision:** Successful backups will upload to an object key shaped like `<prefix>/YYYY/MM/DD/<timestamp>-<database>.dump`, where the prefix defaults to `db-backups` and the database name is sanitized from the connection URL.

**Rationale:** Timestamped keys prevent overwrites, preserve ordering, and keep bucket contents navigable. Including the database name makes the object recognizable if the same bucket is ever used for more than one environment or database.

**Alternative considered:** A flat key like `latest.dump`. That makes accidental overwrites likely and removes historical snapshots unless versioning is guaranteed externally.

### 5. Success criteria are dump creation, upload completion, and operator-visible confirmation

**Decision:** The script will exit non-zero on any preflight, dump, or upload failure. On success it will print the bucket, object key, dump size, and timestamp. Temporary files will be removed in both success and failure paths.

**Rationale:** Backup workflows must fail loudly and unambiguously. Printing the uploaded location gives operators immediate confirmation without requiring a second tool invocation.

**Alternative considered:** Silent success with only process exit status. That is technically workable but weak for manual operations where people need to record what was produced.

## Risks / Trade-offs

- [Operator environment lacks `pg_dump`] → Validate tool availability before starting the upload workflow and fail with a clear actionable error.
- [Large databases increase dump time and temp disk usage] → Use a temp file rather than memory and document that the command should run in an environment with enough local disk.
- [Upload succeeds but retention is unmanaged] → Keep retention out of scope for this change and rely on bucket lifecycle policies or later automation.
- [Backup bucket misconfiguration causes false starts] → Validate required bucket/env configuration before invoking `pg_dump`.
- [Manual workflow may be skipped operationally] → This change establishes the mechanism first; scheduling and policy enforcement can follow separately.

## Migration Plan

1. Add the new backup script and package entrypoint.
2. Document required environment variables and local prerequisites, including `pg_dump`.
3. Validate the workflow in a configured environment by running the script once and confirming the object lands in the target bucket.
4. Rollback strategy: remove or stop using the script entrypoint; no database migration is involved.

## Open Questions

- Should the first implementation also upload a sidecar metadata file (for example JSON with size and checksum), or is console output sufficient for initial operator verification?
- Do we want an optional flag to keep the local dump file instead of always cleaning up the temp artifact after upload?
