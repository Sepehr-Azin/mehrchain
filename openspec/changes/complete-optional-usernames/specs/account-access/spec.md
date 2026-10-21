## ADDED Requirements

### Requirement: Optional account username
The system SHALL allow authenticated owners to add, edit or remove a public
username, without changing stable IDs, email, habits, Chains or earned colors.
New saves SHALL use one canonical 3–20 ASCII letter/digit/underscore lowercase
contract with atomic case-insensitive database uniqueness. Availability SHALL
be advisory, bounded and treat an unchanged own name as available.

#### Scenario: Concurrent claims and removal
- **WHEN** two owners save the same normalized name
- **THEN** at most one succeeds and the other receives a useful conflict
- **AND** removing/editing a name invalidates that old identifier for this account

#### Scenario: Existing or Google-created account
- **WHEN** a legacy account is upgraded
- **THEN** its saved name is preserved with legacy provenance instead of a guessed origin
- **AND** new Google accounts have no generated public username; explicit saves are marked chosen

### Requirement: Identifier login and verified password setup
Login SHALL accept email or current username, optionally prefixed with @, plus
password. Google accounts SHALL have an email-verified password setup path before
the UI advertises password access. Recovery SHALL use expiring hashed single-use
codes, limited attempts/cooldown and generic unknown-account responses.

#### Scenario: Setup, expiry and replay
- **WHEN** a verified account confirms a current recovery code and valid password
- **THEN** the code is consumed atomically and existing sessions are invalidated
- **AND** expired, exhausted, replayed or registration-only codes cannot change the password

#### Scenario: Stale requests and failed saves
- **WHEN** account/session or draft changes while availability or save is pending
- **THEN** an older result cannot replace the new session or newer draft
- **AND** failed saves retain the input and allow explicit retry
