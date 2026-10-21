## ADDED Requirements

### Requirement: Foreground refresh without overlapping resource reads

The client SHALL coalesce browser resume bursts and share pending reads per current
session/resource. Automatic hidden/offline refresh SHALL defer until foreground
recovery without marking expired calendar/support data current.

#### Scenario: Focus and visibility return together
- **WHEN** focus, pageshow, visibility and reconnect fire during one resume burst
- **THEN** subscribers receive one refresh notification and each pending resource read is shared
- **AND** a habit change during a Mero read schedules one subsequent fresh read

#### Scenario: Account midnight passes while hidden
- **WHEN** a habit or Chain deadline expires while hidden/offline
- **THEN** its data is stale and no automatic fetch starts until visible/online recovery
- **AND** existing confirmed-calendar and session guards remain enforced

### Requirement: Bounded waiting and explicit recovery

API requests SHALL have bounded waits and accurate pending-request tracking.
Timeouts SHALL NOT automatically replay writes or report unconfirmed success.
Temporary session verification failures SHALL retain credentials for explicit retry.

#### Scenario: API remains unavailable
- **WHEN** an API request stalls beyond its deadline
- **THEN** loading settles with retry guidance and the current draft remains available
- **AND** an uncertain mutation asks the user to refresh before retrying

#### Scenario: Recover a persisted session
- **WHEN** verification temporarily fails and the user retries the connection
- **THEN** concurrent retries share verification and invalid credentials still sign out
- **AND** confirmed authentication continues through the existing guarded invite path while habits load separately

#### Scenario: Dismiss a waiting notice
- **WHEN** the user dismisses a notice while multiple requests remain pending
- **THEN** dismissal hides the notice without decrementing the pending-request count

#### Scenario: Transient gateway failure on a safe read
- **WHEN** an API GET or HEAD returns 502, 503, 504 or 524 within its request budget
- **THEN** the client retries at most once after a short delay within the remaining budget
- **AND** cancellation cancels the delayed retry, while writes are never replayed
- **AND** an exhausted request offers concise retry guidance without assuming a cold-start cause

### Requirement: Honest access measurements and hosting decision

Measurements SHALL distinguish operator-labeled idle/warm attempts, route,
network, HTTP status/revision/contract and separate database/provider probes.
They SHALL omit credentials, private records and response bodies. Hosting SHALL
remain unchanged until representative evidence supports a bounded alternative.

#### Scenario: An idle version request returns a loading page
- **WHEN** a version probe returns HTTP 200 without the expected revision/contract
- **THEN** the report marks it unsuccessful rather than recording API readiness
- **AND** no latency improvement or successful authentication is inferred
