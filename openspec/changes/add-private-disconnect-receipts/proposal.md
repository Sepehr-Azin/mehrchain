# Change: Implement T05 private disconnect reasons

## Why

Disconnect currently removes both active relationship rows without leaving the
partner a durable explanation. T05 requires a respectful choice, a sharing preview
and a private receipt that survives an offline recipient's return.

## Authorization and status

The owner requested T05 implementation on October 19, 2026, left uncommitted in
Changes for personal review, without builds or tests. This records that authorized
scope. Implementation and regression scenarios are prepared; runtime validation,
migration rehearsal and deployment remain pending. No database was changed.

## What Changes

- Expand the existing disconnect menu with an explicit reason, Cancel, optional
  bounded explanation and a preview. Include Prefer not to share.
- Save one recipient receipt atomically with reciprocal manual disconnection.
- Save neutral system receipts when lifecycle cleanup, archive, private edits or
  permanent habit deletion detach a relationship.
- Give each acceptance a new generation token so retries cannot disconnect a
  newly accepted relationship that reuses the same database row.
- Deliver pending receipts independently of active relationships. Dismiss only
  after an explicit recipient action; normal Chain visits do not acknowledge them.
- Retain quiet anonymous support and the durable daily allowance unchanged.

## Impact

- Affected specs: private-disconnect-receipts (new).
- Affected code: shared contracts, Chain API/service/cards, lifecycle/habit deletion,
  Prisma schema/readiness and focused regression scenarios.
- Additive release migration adds generation tokens and a private receipt table.
  Both participant foreign keys cascade on account deletion; no habit/connection
  foreign key removes a receipt after a relationship is deleted or reused.
- Manual DELETE now requires a reason and the reviewed generation. Coordinate
  schema/client/backend/frontend rollout with old writers stopped.
