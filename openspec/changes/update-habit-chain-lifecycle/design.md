## Context

T02 provides persisted account timezones, calendar-date arithmetic and serialized
daily completions. Chain currently uses connection age and UTC with a three-day
DORMANT state. Relationships have separate reciprocal rows and a unique key on
(userId, partnerId, userCommitmentId). Invites are shareable with multiple people.

## Decisions

- Put lifecycle coordination in a small shared Nest module, imported by Chain and
  Commitments without introducing a dependency cycle.
- Lock all affected habit IDs in sorted order before reading their state. Reconcile
  using server time captured after lock acquisition; completion and invitation
  acceptance use the same locks. Lock affected relationship rows in sorted order.
- Return validation exceptions from action callbacks before any action writes,
  and throw them after the transaction commits. This preserves automatic archive
  when an overdue completion/invite/support action is rejected. Database failures
  still roll back the entire transaction.
- Use max(lastCompletedDate, inactivityAnchorAt ?? startDate) as the inactivity
  anchor. The partial anchor date and current unfinished date do not count as
  misses. Restore sets the anchor and current streak to zero; same-day completion
  protection still uses the original lastCompletedDate. An active restore retry
  neither resets the streak nor moves the anchor.
- Exempt reached finite goals. Continuing or extending a reached goal starts a
  fresh inactivity anchor so a delayed choice does not immediately archive it.
- Archive and privatizing detach all attached directions and cancel pending
  attached invites. Re-publicizing/restoring never revives either.
- Revalidate both habit owners, visibility and archive status during acceptance.
  Keep shareable invites pending. Reuse disconnected unique rows with all heart,
  activity, nudge and archive fields reset; reject conflicting active rows.
- Derive Chain state from the partner habit's account calendar; no new FADING or
  DORMANT state is emitted. Preserve legacy database enum values for compatibility.
- Return active/archive habits together from sync, and exclude unavailable cached
  endpoints from the frontend Chain. Journey includes archived completion history.
- An hourly sweep is an optimization. Request paths independently catch up after
  server sleep. No cron execution is required for enforcing the rules.

## Migration and recovery

Use only the isolated release chain; add a nullable TIMESTAMP(3) column without
rewriting any existing data. NULL uses historical start/completion dates. Before
deploy, follow docs/database_migration_procedure.md and the T03 review handoff:
backup, rehearse on a populated disposable copy, compare old fields/counts, verify
repeat deploy and restore the snapshot. Regenerate Prisma Client after migration.
For rollback, stop writes, restore the verified snapshot if needed and redeploy
the previous compatible backend. No database operations were executed here.

## Validation limits

Unit scenarios were updated/prepared but not executed at the owner's request.
Real PostgreSQL race checks, PWA acceptance and populated-copy migration rehearsal
remain for the owner. No build, typecheck or test result is claimed.
