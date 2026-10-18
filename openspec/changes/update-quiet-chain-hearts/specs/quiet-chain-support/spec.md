## ADDED Requirements

### Requirement: Idempotent recipient-day heart allowance
The system SHALL permit at most one heart per authenticated sender, recipient
habit and recipient account calendar date, independent of connection count.
Retried sends SHALL return sent state without undoing or multiplying support.
The system MUST validate ownership and reconcile both habit lifecycles before a
send, and reject unavailable, disconnected, private or archived endpoints.

#### Scenario: Duplicate links and simultaneous retries
- **WHEN** the same sender sends through several links to one recipient habit on the same recipient date
- **THEN** one allowance and at most one visible received heart are persisted
- **AND** every successful retry reports sent=true with the original send timestamp

#### Scenario: Recipient midnight differs from sender midnight
- **WHEN** the recipient's date advances while the sender's date stays the same
- **THEN** a fresh daily allowance is available and yesterday's received support is excluded

#### Scenario: Archive, private edit or disconnect wins the race
- **WHEN** either endpoint becomes unavailable before a waiting send obtains the ordered habit locks
- **THEN** the send fails and does not restore the relationship or persist a heart

#### Scenario: Reconnect on the same recipient date
- **WHEN** a sent link is disconnected and a new invitation is accepted on the same recipient date
- **THEN** cleared received support is not restored and the consumed allowance remains consumed

### Requirement: Anonymous own-habit support summary
The system SHALL expose only an aggregate received heart count for the viewer's
own habit, without identifying supporters or exposing partner popularity/streaks.
Visible received support SHALL exclude detached, private and archived links and
expire at the recipient habit's next day boundary. One heart SHALL appear without
a numeral; multiple hearts SHALL show a numeral with an accessible count label.

#### Scenario: Several supporters and repeated connection rows
- **WHEN** two different people support one own habit and one person has duplicate links
- **THEN** the own-habit summary shows a heart with 2 and an accessible two-heart description
- **AND** no partner card identifies who sent support or displays a received count

#### Scenario: Reload, stale cache and foreground return
- **WHEN** an open PWA crosses a server-reported own or partner boundary, resumes, or reconnects
- **THEN** support is refreshed and expired snapshots cannot show yesterday's count or grant a send
- **AND** failed refresh remains visible with a retry action

### Requirement: Quiet Chain cards
The system SHALL keep Chain cards to partner/habit identification, one current
state, a single heart action and accessible secondary details/disconnect.
Invitations SHALL remain discoverable, while active relationships remain separate
from archived habit history. The system SHALL omit reminders, a separate
congratulations action, named support messages and unfinished feature placeholders.

#### Scenario: Pending send and failure
- **WHEN** a user sends a heart and the request is pending or fails
- **THEN** duplicate controls for that target remain pending until confirmation
- **AND** failure does not show a saved heart and permits a retry without a success toast

#### Scenario: Goal reached and keyboard options
- **WHEN** a partner habit reaches its finite goal or the user opens options using the keyboard
- **THEN** the same heart action remains available within the daily allowance
- **AND** linked habit details and disconnect remain reachable with Escape returning focus
