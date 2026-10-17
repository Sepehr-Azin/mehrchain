## Implementation

- [x] Use T02's calendar and a persisted nullable restore/continue inactivity anchor.
- [x] Share ordered habit locking across lifecycle, completion, edits, invites and support.
- [x] Reconcile overdue habits on reads/actions and use the same operation for manual archive.
- [x] Atomically detach reciprocal connections and cancel attached pending invites.
- [x] Revalidate both habits in acceptance and allow explicit reconnection through disconnected unique rows.
- [x] Replace the old three-day Chain flow with habit-derived two-day lifecycle behavior.
- [x] Preserve archived history in Journey and explain restore/reconnect behavior.
- [x] Prepare focused unit scenarios and a migration/acceptance handoff.

## Owner validation (not run at owner's request)

- [ ] Regenerate Prisma Client, build/typecheck and run focused tests.
- [ ] Rehearse additive migration and snapshot recovery on a populated disposable database.
- [ ] Verify real PostgreSQL concurrency, multi-partner isolation and manual/archive/restore/reconnect.
- [ ] Verify PWA day boundary, server sleep, stale views, finite goals and history preservation.
- [ ] Run OpenSpec strict validation when its CLI is available.
