# Change: T07 daily rules and a kind return

## Why

The daily lifecycle and permanent collection already exist, but their explanations
and return/history views do not consistently expose the account calendar or next action.

## Authorization and status

The owner requested T07 implementation directly, left uncommitted in Changes,
without builds or tests. This records the authorized roadmap scope and does not
introduce a separate approval step. Execution and human acceptance remain pending.

## What Changes

- Shared discoverable daily rules in setup/edit, Dashboard and Journey.
- Contextual one-miss, archive, heart and earned-color guidance without overlays.
- Account-calendar history, explicit cumulative totals and per-habit streak labels.
- Visible invitation continuation through signup/login; optional private motivation
  and a complete solo path. Preserve explicit acceptance and T05 reason/receipt UI.

## Impact

- Frontend presentation and date normalization only; no API/schema/migration change.
- Integrates existing T02–T06 contracts; no new reward or lifecycle semantics.
- T05/T06 release prerequisites remain independent and unverified.
