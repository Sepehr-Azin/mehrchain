# Change: T11 Journey overview and history hierarchy

## Why

The owner's screenshot gives Sparks equal weight to habits and streak, without
explaining what it measures. Current source has already replaced it with
Completions, but puts archive/help ahead of the overview. Journey needs a compact
progress overview followed by understandable history and a discoverable return path.

## Status

The owner subsequently requested T11 implementation, left uncommitted in Changes
for their review, with no build or test execution and owner-managed GitHub sync.
Implementation follows the proposed Active Chains third card, with recipient-today
hearts as a quiet secondary line. Source implementation is complete; build, test
execution, interactive/PWA acceptance and release remain pending. The full
analysis, page order, metric definitions and acceptance status are in
[roadmap T11](../../../docs/development_roadmap.md#t11--refocus-journey-on-progress-history-and-optional-support).

## What Changes

- Show Active habits / Best current streak / Active Chains as the summary.
- Retain cumulative completions explicitly beside the calendar; any received
  support is a secondary anonymous recipient-today message under T04's contract.
- Move archive/help below the main history, keeping direct archive access for returners.
- Compact the calendar and connect date selection to a single grouped history list.
- Preserve loading, failure, account-calendar, archived effort and solo-use behavior.

## Impact

- Affected proposed capability: `journey-overview`; no canonical specs directory exists yet.
- Integrates `explain-daily-return`'s dated effort/restore rules,
  `update-quiet-chain-hearts`' support contract and `fix-mero-first-frame`'s focused headers.
  Those pending proposals retain their existing contracts; T11 adds presentation requirements.
- Updated code: Journey component/template/styles/spec, calendar and its spec,
  and Journey skeleton. Existing Chain service contracts/selectors are consumed unchanged.
- Reuse frontend contracts; no API, database, reward or lifecycle change proposed.
- Existing release blockers and T05/T06 schema gates retain precedence.
