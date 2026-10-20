## ADDED Requirements

### Requirement: Discoverable daily rules

The frontend SHALL explain account-timezone midnight, once-per-date completion,
Endless and Custom completed-day goals, and automatic archive after two fully
missed dates during habit setup. Help SHALL remain discoverable without replaying onboarding.

#### Scenario: Create or edit a habit

- **WHEN** an owner chooses a goal or edits a habit
- **THEN** daily rules identify the account timezone and distinguish completed days from consecutive streaks
- **AND** private motivation remains optional and secondary

### Requirement: A clear return action

The frontend SHALL use confirmed lifecycle state for missed-day guidance and
SHALL preserve explicit restore, new-invite acceptance, quiet support and permanent earned slots.

#### Scenario: One fully missed date

- **WHEN** an unfinished active habit has one fully missed date
- **THEN** its next action remains Complete today with no catch-up debt
- **AND** guidance explains that the next completion starts the streak at one while earlier completions remain

#### Scenario: Return after weeks

- **WHEN** the confirmed account has archived habits
- **THEN** Dashboard links directly to their Restore actions in Journey
- **AND** restore preserves history and earned colors without reconnecting old Chains

### Requirement: Consistent dated effort

Journey SHALL retain active and archived effort, label cumulative completions and
the best current per-habit streak explicitly, and render completion dates and today
using the persisted account calendar instead of the device timezone.

#### Scenario: Travel or a legacy account

- **WHEN** the device timezone differs from the account timezone
- **THEN** saved day keys remain unchanged and legacy timestamp history uses the account timezone (UTC for legacy accounts)
- **AND** same-named habits retain distinct activity entries

### Requirement: Optional invitation continuation

The frontend SHALL retain an incoming invite through signup/login in the guarded
internal return URL and SHALL require explicit acceptance afterwards. Solo use
SHALL remain complete without connecting a partner.

#### Scenario: Invite-led signup or login

- **WHEN** an unauthenticated visitor opens a Chain invite
- **THEN** signup/login explains that the invite will reopen afterwards
- **AND** successful authentication returns to that invite without automatic connection
