# T03 review handoff

Changes are left uncommitted in the working tree for owner review. No build,
typecheck, test, Prisma generation, database operation, commit or push was run.
Implementation is prepared; acceptance is not claimed and roadmap boxes remain
pending until the owner verifies the behavior.

## Behavior

- Two fully missed account dates archive only the affected unfinished habit.
  Monday completion followed by Tuesday/Wednesday misses archives Thursday at
  local midnight, including the first request after server sleep. One missed date
  stays active; current streak restarts at one on its next completion.
- Creation and restore dates are partial grace dates. Restore preserves startDate,
  lastCompletedDate, logs, history and currentDay, resets currentStreak and stores
  a fresh inactivityAnchorAt. Retrying restore on an active habit is a no-op.
- A reached finite goal is exempt until the owner chooses. Continue or extending
  that goal establishes a fresh inactivity anchor.
- Both manual and automatic archive disconnect every attached Chain direction,
  clear sent support and cancel pending attached invites atomically. Making a
  habit private performs the same detachment without archiving the habit.
- Accepting an invite locks/revalidates both habits. Old cancelled links stay
  invalid after restore. A fresh acceptance may reuse disconnected unique rows,
  clearing old hearts, nudges, activity and archive state. Conflicting active rows
  are rejected. Shareable invites still support several different partners.
- Chain state follows the partner habit timezone and no longer emits the old
  FADING/DORMANT progression. Legacy enum values remain in the database. Reads,
  invite operations and support actions reconcile independently of the hourly sweep.
- Habit sync includes active and archived snapshots. Journey retains archived
  effort; archive copy explains preservation and reconnection. Restore waits for
  server confirmation and prevents duplicate clicks. Chain cache reads bypass
  the old Service Worker and confirmed unavailable own endpoints are discarded.
- T04's idempotent hearts/recipient-day expiry and T05's durable private disconnect
  receipts are unchanged separate tasks. No automatic reason event is introduced.

## Migration and recovery review

The additive migration is
`apps/mehrchain-backend/prisma/release-migrations/20261017100000_habit_lifecycle/migration.sql`.
Apply it after T02's account-calendar migration through the isolated release
wrapper; do not edit/replay the historical baseline. It adds one nullable
TIMESTAMP(3) column and does not backfill or rewrite old fields. NULL explicitly
retains the historical start/completion anchor. Generate Prisma Client before
running the updated backend.

Before deployment, stop writes on a disposable populated copy and follow
`database_migration_procedure.md`:

1. Capture a restorable snapshot, table counts and old commitment/log/relationship/
   invite fields. Include active, archived, private, goal-reached and multi-partner
   habits with historical dates. Keep private data outside Git.
2. Apply the reviewed release migration, compare every old field/count, confirm
   the new column is nullable and old rows are NULL. Repeat deploy with no pending
   migrations and regenerate Prisma Client; verify schema drift separately.
3. Run lifecycle scenarios only on the disposable copy. First reads intentionally
   archive already overdue unfinished habits and cancel their pending invites.
4. Restore the pre-change snapshot, verify old counts/fields, and rehearse backend
   rollback before applying to a real target. Stop writes/redeployment on failure.
   Snapshot recovery is preferred over dropping a column containing new anchors.

No populated-copy rehearsal or OpenSpec CLI validation was performed. The OpenSpec
CLI is not installed on this workspace's PATH.

## Owner acceptance

Prepared unit scenarios cover the calendar, grace anchor, goal exemption,
archive/rejection persistence, restore idempotency, eligibility, reconnect and
limited partner response fields. They have not been executed.

- Tehran and a DST timezone: Monday complete, miss Tuesday/Wednesday, read just
  before/after Thursday midnight. Repeat after server sleep. Also check an
  uncompleted newly created habit and a restored habit's partial date.
- Several own habits and several partners: archive one habit manually and
  automatically. Both directions of its attached links disconnect, pending
  invites cancel, all unrelated relationships/histories remain unchanged.
- Use real PostgreSQL to race archive/private edits against completion, acceptance
  and hearts from both sides; race both endpoints archiving and reciprocal
  invitations. Verify atomic results, ownership and absence of deadlocks.
- Restore after weeks, refresh repeatedly, retry restore, complete and cross the
  next boundaries. Streak begins at zero/one; original dates/progress remain.
  Restore on a previously completed date still prohibits duplicate completion.
- Old invite after archive/restore must fail. Create a new invite and accept from
  the same habits; verify no unique-key failure or old support state. Verify a
  different partner still accepts a shareable invite and an existing active
  relationship is never overwritten.
- Finish a Custom goal, wait several dates, then Continue, extend or Archive.
  Waiting never inactivity-archives; continuing/extension gets a fresh grace date.
- Keep the PWA open across midnight and resume/reconnect after absence. Active/
  archived lists and Chain match the server, Journey preserves archived dates,
  and failed restore keeps the archived card with a retryable error.
