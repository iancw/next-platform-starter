## ADDED Requirements

### Requirement: Magic-link requests SHALL require a verified abuse challenge
The system SHALL verify a server-issued abuse-challenge token before it creates a magic-link token or sends a sign-in email for an anonymous magic-link request.

#### Scenario: Verified challenge allows request processing
- **WHEN** a caller submits a valid email address and a valid challenge token to the magic-link request endpoint
- **THEN** the system may continue to throttle evaluation and normal magic-link delivery
- **THEN** the system creates and sends a magic link only if no other abuse rule blocks the request

#### Scenario: Missing or invalid challenge blocks email delivery
- **WHEN** a caller submits a magic-link request without a valid challenge token
- **THEN** the system rejects the request
- **THEN** the system does not create a magic-link token
- **THEN** the system does not send a sign-in email

### Requirement: Magic-link requests SHALL be throttled by email and client network identity
The system SHALL enforce server-side limits for repeated magic-link requests using both the normalized email address and the client network identity so mailbox flooding and bulk email abuse are constrained.

#### Scenario: Repeated requests for one email hit cooldown
- **WHEN** a caller requests a magic link for the same normalized email address again before the configured cooldown expires
- **THEN** the system rejects the request as throttled
- **THEN** the system does not create a new magic-link token
- **THEN** the system does not send another sign-in email

#### Scenario: One client exceeds network burst limit
- **WHEN** requests from the same client network identity exceed the configured burst limit within the configured time window
- **THEN** the system rejects additional magic-link requests from that network identity as throttled
- **THEN** the system does not create new magic-link tokens for those rejected requests

### Requirement: Magic-link abuse responses SHALL remain privacy-safe
The system SHALL return public outcomes for magic-link requests that do not reveal whether the submitted email address already belongs to an existing account, while still surfacing a retryable cooldown state for legitimate users.

#### Scenario: Success path does not reveal account existence
- **WHEN** a caller submits a valid, non-throttled magic-link request
- **THEN** the public response confirms that the request was accepted without indicating whether the email matched an existing user before the request

#### Scenario: Throttled path provides retry guidance without enumeration
- **WHEN** a caller submits a request that is blocked by abuse controls
- **THEN** the public response indicates that the caller must wait or retry later
- **THEN** the response does not disclose whether the email address exists in the system

### Requirement: Magic-link abuse decisions SHALL be recorded for enforcement and tuning
The system SHALL record each magic-link request attempt with hashed abuse identifiers, challenge outcome, final decision, and timestamp so future requests can be evaluated against recent history and operators can tune thresholds.

#### Scenario: Accepted request is written to the abuse ledger
- **WHEN** a magic-link request passes challenge verification and throttling checks
- **THEN** the system records an abuse-ledger row for the attempt before or during final processing
- **THEN** the stored identifiers are hashed rather than persisted as raw email or raw client IP

#### Scenario: Rejected request is still written to the abuse ledger
- **WHEN** a magic-link request is rejected because of challenge failure or throttling
- **THEN** the system records the rejected attempt in the abuse ledger with the rejection reason
- **THEN** the stored identifiers are hashed rather than persisted as raw email or raw client IP
