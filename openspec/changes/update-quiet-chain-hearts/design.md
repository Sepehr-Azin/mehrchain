## Decisions

The unique key in chain_hearts is (senderId, recipientCommitmentId, dayKey).
The recipient's persisted account IANA zone determines dayKey. The T03 lifecycle
transaction locks both habit IDs in order, reconciles availability, then locks
reciprocal connection rows before inserting the allowance. All sends to a single
recipient habit serialize on that habit; createMany(skipDuplicates) provides the
database uniqueness guard as well. Retried sends return the persisted timestamp
and sent=true without writing the connection again.

Keep connection heartSent/heartSentAt as visibility fields. T03 already clears
them on detach and new acceptance. Received counts deduplicate active incoming
rows by sender, filter timestamps by the recipient's date and require both habits
to be public and unarchived. The allowance ledger survives disconnect, archive
and restore, so those actions cannot grant a second heart on the same date. A
reconnected card can show that today's allowance was used without resurrecting a
cleared received heart. Permanent sender/recipient deletion cascades the ledger.

Each outgoing connection response repeats its viewer's own-habit received count,
own calendar and partner calendar. The partner calendar governs sending, while
the own calendar governs received support. Never return the incoming rows or a
per-partner receipt. The frontend takes the own-habit aggregate once, rather than
summing repeated connection rows. Counts are not displayed beside partner cards
or used for sorting. The old boolean heartReceived is removed.

Frontend requests for the same target share a pending promise and update only
after confirmation. Reads are deduplicated; a mutation/session generation rejects
late snapshots. Cached support is initially stale, and a monotonic timer uses the
earliest server-relative own/partner boundary, subtracting request duration.
Expired/failed snapshots hide received counts and disable sending until refresh.
The existing Chain page polling skips hidden documents; foreground/online and
boundary refresh are also available while viewing the dashboard. No support
success toast is emitted. Failures remain retryable beside the relevant action.

## Migration and recovery

Apply 20261018000000_idempotent_chain_hearts after the existing baseline, daily
hearts, account-calendar and habit-lifecycle migrations. The additive table has
ownership cascade foreign keys, a composite primary key and a recipient/day index.
Backfill all persisted true/non-null connection hearts by interpreting their
TIMESTAMP(3) as UTC instants, converting to the recipient zone and grouping
duplicate links with the earliest timestamp. Existing rows and fields are intact.

Before deployment, follow docs/database_migration_procedure.md and the T04
handoff: snapshot, rehearse on a populated disposable copy, compare old data,
verify backfill/key/cascades, repeat deploy and rehearse recovery. Pause old writers
during migration/deployment; an old toggle backend must not run alongside the new
ledger-backed writer. Generate Prisma Client and deploy matching backend/frontend.
Prefer snapshot recovery plus the previous backend over dropping a populated
allowance table and potentially permitting additional same-day sends.
