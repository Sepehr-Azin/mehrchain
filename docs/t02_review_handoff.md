# T02 review handoff

Implementation is left in the working tree for owner review. No build, test,
Prisma generation, database operation, commit or push was performed. Runtime
acceptance and migration rehearsal remain pending, as requested by the owner.

## Calendar and completion

- One backend calendar helper uses the account's persisted IANA timezone for
  completion, current streak and fully missed dates. Calendar-date distance does
  not assume that a DST day lasts 24 hours. The response includes the server time,
  current date and the actual next date boundary.
- Existing accounts keep UTC. New email/Google accounts capture the browser's
  timezone at creation, with UTC as the fallback for older clients. Invalid zones
  are rejected. Signing in, retrying unverified registration, travelling and
  changing device settings never change an existing account's timezone. There is
  no timezone-edit endpoint in this iteration; Profile explains this policy.
- `GET /commitments` retains its array response. The frontend uses the additive
  `GET /commitments/sync` response so even an empty account receives its calendar.
- Completion and goal edits share the habit row lock. A same-day retry returns
  the current saved state without another log, increment or notification. New
  logs contain the account date/timezone, with a database unique constraint on
  `(commitmentId, dayKey)`.
- Reads derive zero current streak after a fully missed date. The next completion
  starts at one; `currentDay`, history and logs remain cumulative. A partial
  creation date is excluded from fully missed dates.
- Custom goals stop accepting new completion days when reached. Continue changes
  the same habit to Endless; Archive uses the existing archive action. Neither
  choice resets progress. Continuing on the final completion date still leaves
  that date completed. An edited finite target cannot be below completed days.

## Refresh and failure behavior

- The store refreshes on the server's next boundary, visibility/focus return,
  page restoration and reconnect. Scheduling uses relative server time and a
  monotonic request duration, never the device wall clock to unlock a day.
- Cached daily status starts stale. A refresh failure retains saved information,
  shows a shared notice with manual retry on signed-in routes and retries after
  a minute. Daily completion/goal controls wait for fresh data. A write that
  crosses the known day boundary triggers a full refresh of the other cards.
- The old Service Worker API cache is removed; the store already keeps a
  user-scoped fallback. Sync, archived habits and session verification explicitly
  bypass even a previously installed worker, and those backend reads return
  `Cache-Control: private, no-store`. An offline cache response cannot count as a
  fresh server confirmation or restore a previous account's cached session.
- Refreshes are coalesced. A late read cannot replace a confirmed mutation; it
  schedules another refresh. Session changes discard prior replies, clear pending
  completion deduplication and cancel timers. Event handlers/timers are removed
  when the store is destroyed.
- Existing unit fixtures were updated for the additive calendar contract; tests
  were not run.

## Migration review and rehearsal

The additive SQL is in
`apps/mehrchain-backend/prisma/release-migrations/20261017000000_account_calendar/migration.sql`.
It belongs to the existing isolated release chain, not the historical migrations
directory. Existing release migrations are unchanged. Apply the new migration
before deploying this backend and regenerate Prisma Client from the new schema.

The SQL assigns UTC to existing users/logs and keys the earliest historical log
for each habit/UTC date. Surplus old duplicate logs retain a null key, so their
timestamps, notes and effort are preserved. Every new completion supplies a key.
It does not rewrite old completion timestamps, history arrays, streaks, progress
or existing `updatedAt` values, and does not invent logs for legacy history-only
dates. Same-day protection for those dates uses `lastCompletedDate` as before.

Before deployment, rehearse on a disposable populated copy with writes stopped:

1. Capture all table counts and existing columns of users, commitments and logs;
   keep a restorable snapshot. Include UTC records near midnight and any duplicate
   dates. Keep this private data outside version control.
2. Apply the release chain through the existing `scripts/release-migrate.cjs`
   wrapper. Compare every pre-existing field and row count with the snapshot.
   All must match. Check that each distinct `(commitmentId, UTC completedAt date)`
   has exactly one non-null key; only surplus duplicate logs should remain null.
3. Verify the new unique index and UTC defaults, repeat release deploy (no pending
   migrations), then regenerate Prisma Client and inspect schema drift.
4. Rehearse restoring the snapshot before moving to a real target. An old target
   without the release baseline still needs the expanded legacy procedure in
   `database_migration_procedure.md`; do not replay the old migrations or resolve
   the old baseline against a schema missing this new additive migration.

No populated-copy rehearsal or database verification was performed in this task.

## Owner acceptance

- Tehran: complete at 08:00, retry from another device, then complete at 00:01
  next date. Expect exactly one new log per local date and streak +1 each date.
- New York: spring/fall DST dates, including the repeated clock hour; also check
  December 31 to January 1 and a leap-day boundary. Each date gets one opportunity.
- Complete Monday, miss Tuesday: Wednesday's read shows streak zero; completing
  Wednesday shows one and adds one to cumulative progress. A habit created partway
  through Monday has no fully missed date at Tuesday midnight.
- Leave the installed PWA open across midnight, then repeat while suspended,
  offline and reconnecting. A failed refresh must stay visibly stale and offer
  retry. Moving the device clock forward must not unlock an extra day.
- Reach a small Custom goal, retry completion on the same date and the next date,
  then Continue or Archive. No extra event may be created past the goal; Continue
  retains all history and resumes with the normal daily restriction.
- Race goal edits with completion, refresh with a save, and sign-out/sign-in with
  delayed responses. Existing confirmed data must survive and accounts must remain
  isolated. Check both empty accounts and multiple habits.

T03's two-day auto-archive, restored inactivity anchor and Chain lifecycle rules,
and T04's recipient-local heart expiry remain their own tasks. Their existing
behavior was not replaced here.
