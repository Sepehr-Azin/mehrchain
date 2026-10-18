# Change: Implement T04 quiet Chain support

## Why

The current heart toggle can undo a confirmed send on retry, expires at UTC
midnight and identifies the person who supported a habit. T04 calls for quiet,
anonymous daily support and compact Chain cards on the T02/T03 foundation.

## Authorization and status

The owner requested T04 implementation on October 18, 2026, left uncommitted in
Changes for review, without builds or tests. This records that authorized scope.
The implementation uses the roadmap's recommended limit: one sender per recipient
habit per recipient account date, regardless of the number of links. Runtime
acceptance and migration rehearsal remain pending.

## What Changes

- Make sending idempotent using a durable sender/recipient-habit/day allowance.
- Expire sent state and anonymous received counts using the recipient calendar.
- Preserve T03's removal of visible support on disconnect/archive/private edits;
  reconnecting cannot restore cleared support or reset the same-day allowance.
- Return only the viewer's own habit received count, never a named receipt or a
  partner's received count/streak. Remove the old per-partner heartReceived field.
- Show received support on own-habit summaries; use a numeral only above one.
- Keep partner/habit identification, one quiet current state, one heart action
  and accessible secondary details/disconnect. Remove congratulations, reminders
  and the Articles/Coming Soon placeholder.
- Refresh on server day boundaries, foreground return and reconnect; protect
  confirmed writes and account changes from late responses.

## Impact

- Affected specs: quiet-chain-support (new specification).
- Affected code: Chain API/service, shared types, Prisma schema/readiness,
  frontend Chain service/cards, dashboard habit support summary and focused specs.
- Additive release migration creates/backfills chain_hearts without rewriting
  existing connection or habit fields. Requires Prisma Client regeneration before
  the updated backend is built. No database operations are performed here.
- The legacy nudge endpoint rejects requests without persisting a reaction.
- T05's durable disconnect reason and T06's reward behavior remain separate tasks.
