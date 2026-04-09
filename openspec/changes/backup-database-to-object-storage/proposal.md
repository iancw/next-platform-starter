## Why

The app depends on a single live Postgres database, but the repo does not yet provide a repeatable way to capture restorable backups and store them outside the database service. We need an operator-run backup workflow so maintenance, migration, and incident recovery do not depend on ad hoc local dumps.

## What Changes

- Add a repo script that creates a PostgreSQL dump from the configured application database and uploads it to an OCI Object Storage bucket
- Add deterministic, timestamped backup object naming so repeated runs do not overwrite prior backups
- Validate backup prerequisites up front, including required database and OCI configuration and the presence of the dump tool
- Report the uploaded backup location and basic metadata so operators can confirm what was stored
- Document the backup command, required environment variables, and operational assumptions

## Capabilities

### New Capabilities
- `database-backup`: Operator-run database dump creation and upload of the resulting backup artifact to OCI Object Storage

### Modified Capabilities

## Impact

- **Scripts**: add a new backup script under [`scripts/`](/Users/ian.will/dev/src/github.com/iancw/om-recipes/scripts) and expose it through [`package.json`](/Users/ian.will/dev/src/github.com/iancw/om-recipes/package.json)
- **OCI integration**: reuse or extend [`lib/oci/objectStorage.js`](/Users/ian.will/dev/src/github.com/iancw/om-recipes/lib/oci/objectStorage.js) for backup uploads
- **Operations**: introduce backup-specific environment variables for bucket selection and optional key prefixing
- **Runtime dependency**: require `pg_dump` to be available in the operator environment that runs the script
- **Documentation**: update [`README.md`](/Users/ian.will/dev/src/github.com/iancw/om-recipes/README.md) with backup usage and prerequisites
