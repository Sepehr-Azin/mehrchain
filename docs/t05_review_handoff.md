# T05 review handoff

Prepared October 19, 2026 (Asia/Tehran). Implementation remains uncommitted in
Changes as requested. No build, test, typecheck, OpenSpec validation, Prisma
generation, migration, database operation, commit, push or deployment was run.

## Behavior

The existing Chain menu now asks for an explicit reason, offers Cancel and shows
a private recipient preview. Personal text is optional and limited to 500
characters. Prefer not to share clears the text and stores no explanation.
Preview and receipt use Angular text interpolation.

Manual disconnection saves one partner receipt before clearing both directions
in the same transaction. Retries on the disconnected generation create no new
receipt. Every explicit acceptance resets a generation token so an old request
cannot disconnect a newly accepted chain, even when row IDs are reused.

Archive, automatic inactivity reconciliation, private edits and permanent habit
deletion capture neutral receipts for each affected active direction. They do
not reveal the reason for a habit becoming unavailable. Earlier disconnected
rows receive no fabricated history. Daily-heart allowance rows are not modified
by disconnection; cleared visible support cannot be revived by reconnecting.

Recipients see a compact Private chain updates section independently of active
cards. Pending receipts survive offline return and ordinary visits. Explicit
Dismiss is saved before removing an update; failed reads/dismissals remain
retryable. At most 50 pending receipts are fetched oldest first, and dismissal
refreshes the next pending batch. Receipt requests use session/read-version
guards. Personal explanations are not written to localStorage.

The receipt exposes partner identification and the recipient's own habit title,
not private partner habit details or supporter identities. Listing and dismissal
are recipient-scoped. Both participant user foreign keys cascade, removing all
receipt text on account deletion. No habit/connection FK removes receipts during
habit deletion or row reuse.

## Release prerequisites

New additive migration:
`apps/mehrchain-backend/prisma/release-migrations/20261019000000_chain_disconnect_receipts/migration.sql`.
It follows the October 18 allowance migration, adds/backfills generationId from
existing connection IDs and creates chain_disconnect_receipts with the unique
recipient-connection/generation key, pending-inbox index and two account cascades.
Existing columns, hearts, completion history and invitation data are unchanged.

Before release, follow [database migration procedure](database_migration_procedure.md):

1. Capture a restorable snapshot and privately compare every original row/field
   on a populated disposable copy. Include reciprocal active/disconnected chains,
   several partners, hearts and archived/private habits.
2. Stop old writers. Apply the reviewed isolated release chain through
   `node scripts/release-migrate.cjs deploy` on the verified target. Inspect token
   backfill, unique/index/check constraints and both cascades; verify preservation,
   repeat deploy, drift and snapshot recovery separately.
3. Regenerate Prisma Client from the canonical schema before the matching backend
   is built. Deploy matching backend/frontend and refresh installed PWAs. Startup
   refuses readiness without the new columns/table; it does not apply migrations.
4. Do not leave an old backend running during rollout: old creates lack the new
   required column and old accept/disconnect paths cannot enforce generations or
   save receipts. Old frontend bodyless DELETE requests now fail validation and
   require an app update. Both checked-in Pages proxies already forward DELETE
   bodies; actual deployed proxy/PWA behavior still needs owner verification.

Do not edit earlier applied migrations or drop a populated receipt table to
rollback. Rehearse a compatible correction/recovery with writes stopped.

## Owner acceptance

- Review reason preview, Cancel, keyboard focus/Escape, 500-character notes,
  HTML-like text rendered literally, no-disclosure behavior and failure/retry.
  Polling the same generation must retain an open draft; a new generation clears it.
- With two accounts, disconnect once, retry a lost response and return after
  being offline. Both sides lose the active pair; only the partner gets the manual
  reason once. Other relationships remain active. Visiting alone does not dismiss.
- Race manual disconnect against opposite-side disconnect, archive/private/hard
  delete, heart sending and explicit reacceptance on real PostgreSQL. Assert one
  outcome per generation, rollback on receipt failure and no deadlock/duplicate.
- Verify automatic archive/private/deletion receipts are neutral; inspect the
  daily-heart ledger and remaining own-habit aggregate. Same-day reconnection
  cannot refund a surviving habit's consumed allowance or revive visible support.
- Verify unrelated users cannot list/dismiss receipts, account switches cannot
  display stale responses, and deleting either participant cascades the stored
  reason/note. Inspect more than 50 pending receipts and repeat dismissal.
- Run the updated backend/frontend/DTO/readiness regression scenarios after
  Prisma generation, then the builds/checks selected by the owner. These source
  scenarios are not evidence of execution or database concurrency acceptance.
