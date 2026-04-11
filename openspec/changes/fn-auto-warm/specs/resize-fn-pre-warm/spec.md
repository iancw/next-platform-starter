## ADDED Requirements

### Requirement: Warm invocation sent when Upload button becomes enabled
After an image is dropped and the Upload button would become enabled — meaning EXIF parsing succeeded, no duplicate image was found, and no matching recipe exists — the client SHALL send a single fire-and-forget warm-up POST request to `/upload/warm-fn`.

#### Scenario: Warm request sent after all checks pass
- **WHEN** a valid image is dropped, EXIF parses successfully, the duplicate check returns no duplicate, and the recipe match check returns no match
- **THEN** a POST request is sent to `/upload/warm-fn` exactly once for that image session

#### Scenario: Warm request not sent for invalid EXIF
- **WHEN** a file is dropped but EXIF parsing finds no valid recipe (e.g. missing color profile)
- **THEN** no POST request is sent to `/upload/warm-fn`

#### Scenario: Warm request not sent for duplicate image
- **WHEN** a file is dropped and the duplicate check identifies it as already uploaded
- **THEN** no POST request is sent to `/upload/warm-fn`

#### Scenario: Warm request not sent for matching recipe
- **WHEN** EXIF parses successfully but the recipe match check finds a full, no-wb, or color-tone match
- **THEN** no POST request is sent to `/upload/warm-fn`

#### Scenario: Warm request sent at most once per image session
- **WHEN** the component re-renders after the warm-up has been dispatched (e.g. user types in the author field)
- **THEN** no additional POST requests are sent to `/upload/warm-fn`

#### Scenario: Warm request can fire again after image is removed and replaced
- **WHEN** the user clicks Remove image and then drops a new valid image that passes all checks
- **THEN** a new POST request is sent to `/upload/warm-fn` for the new image

### Requirement: Warm-up API route requires authentication
The POST `/upload/warm-fn` route SHALL require a valid authenticated session. Unauthenticated requests SHALL receive a 401 response and SHALL NOT invoke the OCI function.

#### Scenario: Authenticated user triggers warm invocation
- **WHEN** an authenticated user's client POSTs to `/upload/warm-fn`
- **THEN** the server invokes the OCI resize function with an empty payload and returns 204

#### Scenario: Unauthenticated request rejected
- **WHEN** a request without a valid session POSTs to `/upload/warm-fn`
- **THEN** the server returns 401 and does not invoke the OCI function

### Requirement: OCI function returns early on empty payload
The OCI resize function SHALL detect an empty JSON object payload (`{}`) and return immediately with `{"ok": true, "warm": true}` and HTTP 200, without parsing bucket/object fields or making any OCI Object Storage calls.

#### Scenario: Empty payload triggers early return
- **WHEN** the function is invoked with an empty JSON object `{}`
- **THEN** it returns `{"ok": true, "warm": true}` with status 200
- **AND** no OCI Object Storage client is created and no download or upload is attempted

### Requirement: Warm-up errors are silently suppressed
The warm-up invocation SHALL NOT affect the upload flow. If the OCI function returns an error, the route handler SHALL log the error server-side and return 204. The client SHALL discard the response and SHALL NOT surface any warm-up failure to the user.

#### Scenario: OCI function returns error during warm invocation
- **WHEN** the OCI resize function returns a non-2xx response for a warm invocation
- **THEN** the route handler logs the error and returns 204
- **AND** the upload form continues to work normally

#### Scenario: Client ignores warm request response
- **WHEN** the warm-up POST resolves or rejects
- **THEN** no state changes occur in the upload component and no UI feedback is shown
