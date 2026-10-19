## ADDED Requirements

### Requirement: Respectful manual disconnect
The system SHALL require an explicit reason and offer Cancel and a preview of
the shared reason before manual disconnection. Reasons SHALL include a
non-disclosing choice. Personal explanations SHALL be optional, bounded to 500
characters and rendered as plain text. A non-disclosing choice MUST NOT persist
or deliver an optional explanation.

#### Scenario: Cancel or fail to save
- **WHEN** the user cancels before confirming
- **THEN** no disconnect request or receipt is created
- **WHEN** a confirmed save fails
- **THEN** success is not shown and the user's draft remains retryable while the chain remains available

#### Scenario: Review a private explanation
- **WHEN** the user selects a reason and supplies an optional explanation
- **THEN** the preview names the intended partner and displays the text that will be shared
- **AND** selecting Prefer not to share clears and excludes the explanation

### Requirement: Atomic and idempotent private receipts
The system SHALL persist one private recipient receipt atomically with reciprocal
manual disconnection under the lifecycle's ordered locks. Receipt uniqueness
SHALL follow a relationship generation. A new acceptance MUST replace that
generation, and a stale disconnect request MUST NOT disconnect the new chain.
Visible hearts SHALL clear without deleting or refunding the durable allowance.

#### Scenario: Lost response and retry
- **WHEN** the same disconnect is retried after saving
- **THEN** the chain stays disconnected and only one manual recipient receipt exists

#### Scenario: Reconnect while an old request is in flight
- **WHEN** a fresh invitation reconnects reused rows and an old-generation disconnect arrives
- **THEN** the old request is rejected and the new relationship remains connected
- **AND** prior receipts remain independent of the reused rows

#### Scenario: Receipt persistence fails
- **WHEN** the receipt cannot be persisted
- **THEN** reciprocal disconnection is rolled back and no success is returned

### Requirement: Durable private delivery and neutral automatic reasons
The system SHALL deliver pending receipts only to their authenticated recipient,
independently of active connection/habit queries. Receipt dismissal SHALL require
an explicit recipient action and be idempotent. Archive and other lifecycle
detach paths SHALL capture neutral system receipts before relationships disappear.
Deleting either participant account SHALL remove the receipt and personal text.
Receipts MUST NOT disclose supporter identities or private partner habit details.

#### Scenario: Recipient returns offline or has no active chains
- **WHEN** a recipient reconnects after their partner disconnected
- **THEN** their private reason is available even with no active relationship
- **AND** visiting Chain alone does not dismiss it

#### Scenario: Automatic archive or private edit
- **WHEN** an attached habit is archived, made private or permanently removed
- **THEN** each affected active direction receives one neutral system receipt
- **AND** existing heart allowances remain consumed for any surviving recipient habit

#### Scenario: Isolation and deletion
- **WHEN** an unrelated account lists receipts or attempts dismissal
- **THEN** it cannot read or change another recipient's receipt
- **WHEN** either participant deletes their account
- **THEN** the receipt and any optional personal explanation are deleted by cascade
