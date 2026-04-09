## 1. Backup Script Setup

- [x] 1.1 Add a `scripts/backup-database-to-object-storage.mjs` entrypoint that loads local env configuration and exposes a package script for operators
- [x] 1.2 Validate required backup configuration, including `NETLIFY_DATABASE_URL`, OCI credentials, `OCI_DB_BACKUP_BUCKET`, and optional prefix handling

## 2. Dump Generation

- [x] 2.1 Implement `pg_dump` execution against the configured database using a restorable custom-format dump written to a temporary file
- [x] 2.2 Derive a unique timestamped object key that includes the configured prefix and a sanitized database name
- [x] 2.3 Capture dump metadata such as byte size and ensure temporary dump files are cleaned up on both success and failure paths

## 3. Object Storage Upload

- [x] 3.1 Reuse or extend the OCI object-storage helper so the backup script can upload the generated dump file to the configured bucket
- [x] 3.2 Make the script fail with a non-zero exit when dump generation or upload fails, without printing a false success message
- [x] 3.3 Print the uploaded bucket, object key, and backup metadata after a successful upload

## 4. Regression Coverage And Docs

- [x] 4.1 Add automated tests for backup key generation and failure handling around missing configuration, dump-tool failure, and upload failure
- [x] 4.2 Update `README.md` with backup usage, required environment variables, and the `pg_dump` prerequisite
