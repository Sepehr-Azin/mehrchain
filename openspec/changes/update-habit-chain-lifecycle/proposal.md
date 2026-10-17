# Change: Apply the T03 habit and Chain lifecycle

## Why

The roadmap requires archiving a habit after two fully missed account dates, with
atomic Chain disconnection and invite invalidation. Current archive/restore and
the old three-day DORMANT flow can leave stale relationships usable.

## Authorization and status

The owner requested implementation of T03 on October 17, 2026, with changes left
uncommitted for review and without running builds or tests. This records that
authorized scope. Runtime acceptance and migration rehearsal remain pending.

## What Changes

- Reconcile inactivity on habit/Chain reads and actions using T02's account calendar.
- Serialize lifecycle, completion, invitation and support writes using ordered habit locks.
- Archive only overdue unfinished habits; detach both relationship directions and cancel pending attached invites atomically.
- Restore with a fresh inactivity anchor and zero current streak, preserving history and original dates.
- Require a fresh invite and explicit acceptance after archive; reuse disconnected unique rows on acceptance only.
- Keep archived effort visible in Journey and explain archive/restore consequences.

## Impact

- Affected specs: habit-chain-lifecycle (new specification).
- Affected code: commitments, Chain, Prisma release migration, shared response types, frontend stores and archive UI.
- Deployment requires the additive nullable inactivityAnchorAt column and Prisma Client regeneration.
- T04's heart semantics and T05's durable disconnect reason remain separate work.
