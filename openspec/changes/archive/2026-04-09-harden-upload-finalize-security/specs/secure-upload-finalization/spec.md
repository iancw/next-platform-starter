## ADDED Requirements

### Requirement: Prepare upload state SHALL bind an image to one recipe and one storage object
The system SHALL persist the prepare-time upload binding for each image upload so finalize can recover the intended recipe association and original-object identity without trusting client-supplied values.

#### Scenario: Prepare creates a new recipe upload binding
- **WHEN** an authenticated user prepares an upload for a recipe that does not already exist
- **THEN** the system records the created image's uploader, the created recipe identifier, and the generated original-bucket object key as server-owned prepare state

#### Scenario: Prepare creates a matched recipe upload binding
- **WHEN** an authenticated user prepares an upload that matches an existing recipe
- **THEN** the system records the created image's uploader, the matched recipe identifier, and the generated original-bucket object key as server-owned prepare state

### Requirement: Finalize SHALL authorize against prepared server state
The system SHALL finalize an upload only when the authenticated user owns the prepared image record, and it SHALL derive the effective recipe association from the persisted prepare state instead of caller-supplied recipe or author identifiers.

#### Scenario: Finalize rejects another user's image
- **WHEN** a caller invokes finalize for an image record that was prepared by a different authenticated user
- **THEN** the system rejects the request as unauthorized
- **THEN** the system does not update the image row or create a recipe-sample association

#### Scenario: Finalize does not trust tampered binding identifiers
- **WHEN** a caller invokes finalize with altered recipe, author, or object identifiers for an image they prepared
- **THEN** the system uses the persisted prepare-time recipe binding and object key, or rejects the request if the prepared state is invalid
- **THEN** the system does not attach the image to an arbitrary recipe chosen by the caller

### Requirement: Finalize SHALL verify the prepared original object before attachment
Before a prepared upload is attached to a recipe, the system SHALL verify that the prepared original-bucket object exists at the persisted object key and SHALL reject the finalize request if the object is missing or its size conflicts with the supplied file metadata.

#### Scenario: Prepared object is missing
- **WHEN** finalize runs and the prepared object does not exist in the original bucket
- **THEN** the system rejects the finalize request
- **THEN** the system leaves the image unattached to any recipe

#### Scenario: Prepared object size does not match
- **WHEN** finalize runs and the prepared object's size differs from the submitted original file size
- **THEN** the system rejects the finalize request with a size-mismatch error
- **THEN** the system does not persist permanent image URLs or recipe attachment rows

### Requirement: Finalization SHALL be single-binding and retry-safe
Once an image upload has been finalized, the system SHALL preserve its prepared recipe/object binding and SHALL prevent duplicate or rebound recipe-sample associations on repeated finalize requests.

#### Scenario: Browser retries finalize after success
- **WHEN** the client submits finalize again for an image that has already been finalized successfully
- **THEN** the system returns the existing finalized result or another success-equivalent response
- **THEN** the system does not create an additional recipe-sample association or change the stored object binding

#### Scenario: Caller attempts to rebind after finalization
- **WHEN** a caller retries finalize for a previously finalized image while supplying a different recipe or object identity
- **THEN** the system preserves the original finalized binding
- **THEN** the system does not move the image to a different recipe or object
