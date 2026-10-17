## ADDED Requirements

### Requirement: Habit inactivity archive

The system SHALL archive only an unfinished habit after two fully missed
consecutive dates in its owner's persisted account timezone. The partial creation
or restore date and current unfinished date SHALL NOT count as missed dates.
Reconciliation SHALL run on reads and actions regardless of cron/server sleep.

#### Scenario: Monday completion followed by two missed dates

- **WHEN** a habit was completed Monday and Tuesday and Wednesday pass without its completion
- **THEN** at Thursday local midnight its next read/action archives it, preserves cumulative progress/history and prevents a new completion until restore
- **AND** other habits, app visits and their completions do not alter that decision

#### Scenario: One missed date

- **WHEN** only Tuesday has fully passed after Monday's completion
- **THEN** the habit remains active Wednesday and the next completion starts the streak at one

#### Scenario: Completed finite goal awaits a choice

- **WHEN** a finite habit has reached its goal and the owner has not chosen Continue or Archive
- **THEN** inactivity does not archive it
- **AND** choosing Continue or extending its goal establishes a fresh inactivity anchor

### Requirement: Atomic archive and connection eligibility

Manual and automatic archive SHALL atomically disconnect all attached reciprocal
Chain rows and cancel attached pending invites. Archived or private habits and
disconnected links SHALL NOT create connections or receive new support. Privacy
changes SHALL detach existing relationships and invalidate invites too.

#### Scenario: Multi-partner archive

- **WHEN** a habit with several partners is archived
- **THEN** all rows referencing that habit in either direction are disconnected and pending attached invites are cancelled in the same transaction
- **AND** unrelated habits, relationships and histories remain intact

#### Scenario: Archive competes with acceptance or support

- **WHEN** archive, completion, support or invitation acceptance overlap
- **THEN** ordered habit locks serialize the operations and acceptance revalidates both owners and habits inside its transaction
- **AND** a rejected stale action does not roll back an overdue automatic archive

### Requirement: Explicit restore and reconnection

Restore SHALL preserve original dates, logs, history and cumulative progress,
reset the current streak, and establish a fresh inactivity anchor. Restore SHALL
NOT reactivate old connections or invites. Explicit new acceptance SHALL be able
to reuse disconnected unique connection rows without carrying old support state.

#### Scenario: Return after a long absence

- **WHEN** the owner restores an archived habit
- **THEN** its partial restore date is excluded from missed dates and its saved progress remains
- **AND** an active restore retry does not move the anchor or reset progress
- **AND** the earlier same-day completion still prevents another completion on that date

#### Scenario: Reconnect after restore

- **WHEN** both habits are active/public and a new invitation is explicitly accepted
- **THEN** reciprocal rows are created or disconnected unique rows are reused with support/activity fields reset
- **AND** old cancelled invites and conflicting active relationships cannot be used

### Requirement: Archive presentation and preserved journey

The frontend SHALL apply confirmed archive/restore responses, retain archived
effort in Journey, and explain that restoring requires a new invitation to reconnect.

#### Scenario: Automatic archive arrives on sync

- **WHEN** a foreground or day-boundary refresh returns an automatically archived habit
- **THEN** active and archived collections update together and the unavailable local Chain endpoint is hidden
- **AND** Journey retains its dated completion history and offers Restore
