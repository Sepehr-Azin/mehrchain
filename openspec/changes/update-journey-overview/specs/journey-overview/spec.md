## ADDED Requirements

### Requirement: Progress-first Journey hierarchy

Journey SHALL present a compact title and three summary statistics before its
main activity calendar, a single grouped history list, archived habits and
discoverable rules. Cumulative completions SHALL remain explicitly visible even
if moved out of the summary. Explicit archive navigation and returners with no
active habits SHALL retain direct access to Restore.

#### Scenario: Review progress or return after absence

- **WHEN** an owner opens Journey normally
- **THEN** the progress overview precedes archive management and detailed rules
- **AND** calendar/history retain active and archived effort under existing account-calendar rules
- **WHEN** the owner follows an archive deep link or has only archived habits
- **THEN** an accessible direct path reaches the expanded archive and explicit Restore actions

### Requirement: Defined summary

The summary SHALL show Active habits, Best current streak on one active
habit, and Active Chains. Active Chains SHALL count unique visible accepted connection IDs
under shared Chain availability rules, exclude pending invitations, and link to
Chain. It SHALL NOT imply distinct people or earned achievements.

#### Scenario: Multiple links and an optional solo path

- **WHEN** two accepted available habit links involve the same partner
- **THEN** the Chain statistic counts two connections, not two people
- **AND** repeated rows with the same connection ID do not increase that count
- **WHEN** no confirmed available Chains exist
- **THEN** zero is neutral and personal history remains fully usable

### Requirement: Independent Chain data state

Journey SHALL distinguish loading, unavailable and stale Chain data from
confirmed zero, retain available habit history and offer retry for failed data.

#### Scenario: Partial refresh failure

- **WHEN** Chain data fails to refresh while habit history is available
- **THEN** Journey retains the history and distinguishes unavailable/stale Chain data from confirmed zero with a retry path

### Requirement: Optional quiet support

Optional received support SHALL use anonymous current recipient-date aggregates
once per own habit, without a lifetime-like total or supporter comparison. It
SHALL retain existing expiry and unavailable-link rules and omit stale support.

#### Scenario: Duplicate aggregates and recipient midnight

- **WHEN** several connection rows repeat one own habit's received-heart aggregate
- **THEN** optional support includes that aggregate once and clears expired support at the recipient date boundary
- **AND** one heart omits a visual numeral while multiple hearts have a count and accessible description

### Requirement: Calendar-linked dated history

Journey SHALL distinguish cumulative habit completions from unique dates with a
completion in the viewed month. Selecting a saved calendar date SHALL filter the
same grouped history list with an accessible return to recent entries. Initial
recent history SHALL show at most five entries, with View more only when more
loaded entries exist. Selection SHALL use account day keys, preserve distinct
habit IDs and archived history, and SHALL NOT invent events from cumulative totals.

#### Scenario: Two habits on one date

- **WHEN** two habits each have one saved completion on the same account date
- **THEN** the completion total includes two and the monthly calendar counts one date
- **AND** selecting that date shows both distinct habit entries

#### Scenario: Legacy history, empty dates and accessible navigation

- **WHEN** a legacy cumulative total exceeds available dated history
- **THEN** the total remains visible and the list contains only actual saved dated entries
- **WHEN** an owner selects a date without saved entries using keyboard or touch
- **THEN** the list shows a neutral empty state and offers Back to recent
- **AND** future dates cannot create completions or catch-up obligations
