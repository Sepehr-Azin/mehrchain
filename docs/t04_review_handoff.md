# T04 review handoff

Implementation is left uncommitted in Changes for owner review. No build,
typecheck, test, Prisma generation, migration, database connection, commit or push
was run. Focused regression scenarios were updated/prepared but not executed.
Runtime/visual acceptance and migration rehearsal remain pending.

## Behavior and review decisions

- One sender can send one heart to one recipient habit per recipient account
  date, regardless of links. This implements the roadmap's recommended limit.
  Retrying or sending concurrently cannot toggle it off, change its timestamp or
  create another allowance. Ownership and T03 lifecycle checks still run first.
- Sent state follows the partner habit calendar; received support follows the
  own habit calendar. Both are server-authoritative and refreshed on boundaries,
  foreground return and reconnect. Device UTC dates no longer determine state.
- Received counts deduplicate senders across eligible incoming links. Only the
  own-habit aggregate is returned; no heartReceived boolean, incoming sender list,
  partner popularity count or partner streak is returned. Own support appears on
  dashboard habits and a habit summary above Chain cards. One heart has no visible
  numeral; multiple hearts have a numeral and all counts have an accessible label.
- Connection visibility fields are retained: disconnect/archive/private edits
  clear the link's support, and fresh acceptance does not revive it. The durable
  daily allowance remains consumed even after reconnecting on the same date.
- Chain cards retain partner/habit identification, one neutral current state,
  one heart action (also at a finite goal) and keyboard-accessible details and
  disconnect. The separate congratulations action, obsolete reminders and
  Articles/Coming Soon placeholder are removed. Legacy nudge requests fail
  without persisting a reaction. T05's reason receipt remains separate work.
- Requests for the same target share pending state; success appears only after
  confirmation. Failed sends retain a retryable inline error. Late reads cannot
  overwrite a confirmed write and replies from an old session are rejected.
  Cached/expired/failed support snapshots are hidden until refreshed. Existing
  Chain polling skips hidden documents; dashboard refreshes on return/boundaries.

## Migration and recovery

New additive SQL:
`apps/mehrchain-backend/prisma/release-migrations/20261018000000_idempotent_chain_hearts/migration.sql`.
Apply after `20261017100000_habit_lifecycle` through the isolated release wrapper.
It adds chain_hearts with composite primary key
`(senderId, recipientCommitmentId, dayKey)`, recipient/day index and cascade foreign
keys. It backfills persisted true/non-null connection hearts in the recipient
zone, grouping duplicate links with the earliest timestamp. Historical connection
and habit fields are unchanged. Already toggled-off/cleared historical sends
cannot be reconstructed; only persisted hearts are backfilled.

Before deploying, follow `database_migration_procedure.md` on a disposable
populated copy:

1. Capture a restorable snapshot, before-counts and all existing fields. Include
   true/false/null-time hearts, duplicate senders/links, UTC/Tehran/DST accounts,
   archived/private/disconnected habits and several partners. Keep data private.
2. Stop old writers, apply the reviewed chain and compare every original row and
   field. Compare ledger keys with distinct sender/target/recipient-date groups
   from persisted hearts; verify earliest timestamps, timezone conversion,
   primary key, index and both cascade constraints.
3. Repeat deploy (no pending migrations), verify drift separately and regenerate
   Prisma Client before building the matching backend. Startup probes table
   columns but does not verify migration checksums, uniqueness or backfill data.
4. Rehearse snapshot recovery and redeploy the previous compatible backend.
   Do not drop a populated ledger to roll back while new writes continue.
   Deploy matching backend/frontend with no old toggle writer running alongside.

No production operation or populated-copy rehearsal was performed.

## Owner acceptance

- Use real PostgreSQL for simultaneous sends from two devices, duplicate links
  and two distinct supporters: one per sender, count 2, no retry undo. Also race
  heart against archive, privatize and disconnect from both endpoints.
- Send around Tehran midnight and DST transitions, with different sender/recipient
  zones. Keep the PWA open, change the device clock, reload, go offline, resume and
  reconnect. Old received counts disappear; fresh sends follow the recipient day.
- Disconnect the sending pair and inspect the remaining own-habit aggregate.
  Restore/reinvite on the same date: old support stays cleared, allowance stays
  consumed; the next recipient date permits a fresh heart. Preserve unrelated
  links and their support. Reject stale/private/archived/disconnected targets.
- Slow/fail a send and a refresh; no filled heart or success toast before saving,
  pending disables duplicate actions, inline errors permit retry. Race a read
  against a successful send and switch accounts while responses are pending.
- Review empty/multi-partner layouts at 320/390 px, wide desktop PWA, both themes
  and 200% zoom. Check long names/titles, the one/many accessible heart label,
  keyboard details/Escape/disconnect and discoverable share/QR invitations.
- Run the updated Chain backend/frontend, habit-card and schema-readiness specs
  after Prisma generation, then the owner-selected builds/checks. Run OpenSpec
  strict validation if its CLI is available. No execution result is claimed here.
