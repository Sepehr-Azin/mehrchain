## ADDED Requirements

### Requirement: Permanent first milestone
The system SHALL earn the first permanent color slot only from one habit's 21 consecutive completed account dates and SHALL preserve earned state after inactivity, archive or habit deletion.

#### Scenario: First qualifying habit
- **WHEN** a habit reaches day 21
- **THEN** the account earns its first slot permanently
- **AND** two shorter streaks or accepted partners alone cannot replace that milestone

### Requirement: Shared optional progress paths
The system SHALL count at most one collection day per account date strictly after unlocking and one accepted partner per distinct account, and SHALL grant capacity using 1 + max(floor(days / 21), ceil(partners / 2)) after the first milestone.

#### Scenario: Both paths reach the same target
- **WHEN** an unlocked account has 21 collection days and one accepted partner
- **THEN** its capacity is two rather than three
- **AND** gaps preserve cumulative progress and reconnecting the same partner adds none

### Requirement: Private confirmed collection
The system SHALL persist validated named colors and selection per authenticated account, allow free replacement/selection and default glow, and import eligible account-scoped legacy preferences only into an uninitialized collection.

#### Scenario: Failed save or stale session
- **WHEN** a save fails or a response belongs to an earlier account/session
- **THEN** it cannot replace the current confirmed appearance or discard the current draft

#### Scenario: Legacy eligibility is untrusted
- **WHEN** a locked account has a local custom color
- **THEN** local state does not unlock a slot and remains available for later eligible import
- **AND** an initialized server collection cannot be overwritten by another device's import

### Requirement: Transactional durable source evidence
The system SHALL record progress atomically with confirmed source actions, backfill only reliable server evidence and retain earned counters independently of habit and relationship deletion.

#### Scenario: Duplicate and concurrent source events
- **WHEN** several habits complete on the same account date or a partner reconnects through another habit
- **THEN** unique source keys and account serialization prevent duplicate progress
- **AND** failure to record progress rolls back the source action

### Requirement: Consistent Mero appearance
The system SHALL apply the confirmed selected color to the current 3D Mero and fallback without changing its fixed name, motion safeguards or control contrast.

#### Scenario: WebGL unavailable
- **WHEN** the model uses the static fallback
- **THEN** it retains the confirmed account color and accessible fixed Mero identity
