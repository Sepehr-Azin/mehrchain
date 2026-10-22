## ADDED Requirements

### Requirement: Minimal habit forms and private motivation

The frontend SHALL use short functional labels and validation without long daily-rule
panels or repeated explanatory navigation. Optional private Why SHALL remain visible
and empty in new onboarding, create, edit and Chain quick-create forms. Placeholders
SHALL NOT be submitted as user motivation; editing SHALL retain the saved reason.
The established onboarding introduction about companionship, the meaning of
MehrChain and how Chains work SHALL retain its explanatory cards and copy; the
removal applies to the recently added expandable rule/help panels.

#### Scenario: Read the onboarding introduction

- **WHEN** a newcomer advances through the introduction
- **THEN** the companionship, MehrChain meaning and Chain explanation cards remain visible
- **AND** the removed daily-rules accordion is not reintroduced

#### Scenario: Create or edit a habit

- **WHEN** an owner chooses a goal or edits a habit
- **THEN** the optional Why control is visible without expanding details
- **AND** existing account-calendar and completed-day goal behavior is unchanged

### Requirement: A clear return action

The frontend SHALL use confirmed lifecycle state for missed-day guidance and
SHALL preserve explicit restore, new-invite acceptance, quiet support and permanent earned slots.

#### Scenario: One fully missed date

- **WHEN** an unfinished active habit has one fully missed date
- **THEN** its next action remains Complete today with no catch-up debt
- **AND** guidance explains that the next completion starts the streak at one while earlier completions remain

#### Scenario: Return after weeks

- **WHEN** the confirmed account has archived habits
- **THEN** Journey's archived list offers Restore, with trash at the right edge of its action row
- **AND** Dashboard does not add an archived-return banner or redundant Restore navigation
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
