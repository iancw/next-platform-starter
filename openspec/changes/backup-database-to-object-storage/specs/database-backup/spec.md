## ADDED Requirements

### Requirement: Operator backup command SHALL create and upload a restorable database dump
The system SHALL provide an operator-run command that creates a PostgreSQL dump from the configured application database and uploads that dump to a configured OCI Object Storage bucket.

#### Scenario: Backup command succeeds with valid configuration
- **WHEN** an operator runs the backup command with a valid `NETLIFY_DATABASE_URL`, valid OCI credentials, and a configured backup bucket
- **THEN** the system creates a PostgreSQL dump artifact from the target database
- **THEN** the system uploads that dump artifact to the configured OCI Object Storage bucket
- **THEN** the system reports the uploaded backup location to the operator

### Requirement: Backup uploads SHALL use unique timestamped object keys
Each successful backup SHALL be stored under a unique object key that preserves historical snapshots and SHALL not overwrite a prior backup from an earlier run.

#### Scenario: Repeated runs produce distinct backup objects
- **WHEN** an operator runs the backup command more than once against the same database
- **THEN** each successful run uploads to a different object key
- **THEN** the generated object key includes a timestamped path segment

#### Scenario: Configured prefix is applied to object naming
- **WHEN** an operator configures a backup key prefix
- **THEN** the uploaded backup object key is created under that prefix

### Requirement: Backup command SHALL fail before claiming success on invalid prerequisites
The backup workflow SHALL validate required configuration and local dependencies, and it SHALL exit with a failure without reporting a successful backup when dump generation or upload cannot complete.

#### Scenario: Required configuration is missing
- **WHEN** the backup command is run without the required database URL, OCI configuration, or backup bucket setting
- **THEN** the system exits with an error explaining the missing prerequisite
- **THEN** the system does not report a successful backup upload

#### Scenario: Database dump generation fails
- **WHEN** the dump tool is unavailable or the database dump command fails
- **THEN** the system exits with an error
- **THEN** the system does not report a successful backup upload

#### Scenario: Object storage upload fails
- **WHEN** the database dump is created but the object storage upload fails
- **THEN** the system exits with an error
- **THEN** the system does not report a successful backup upload
