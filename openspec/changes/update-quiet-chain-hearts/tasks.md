## Implementation

- [x] Add/backfill the unique sender/recipient-habit/day allowance and schema readiness probe.
- [x] Send idempotently after lifecycle/ownership checks and preserve T03 detach behavior.
- [x] Return own-habit anonymous received counts and recipient-calendar sent state.
- [x] Refresh/expire frontend support using server boundaries and guard pending/session races.
- [x] Simplify Chain cards and own-habit received support; remove obsolete reactions/clutter.
- [x] Update focused regression scenarios and prepare the migration/review handoff.

## Owner validation (not run at owner's request)

- [ ] Regenerate Prisma Client, build/typecheck and run focused regression specs.
- [ ] Rehearse the populated-copy migration, backfill preservation and snapshot recovery.
- [ ] Verify real PostgreSQL concurrent sends/duplicate links and lifecycle races.
- [ ] Verify Tehran/DST midnight, reload, PWA resume, failures and account switching.
- [ ] Review mobile/desktop/zoom, keyboard details/disconnect and anonymous count accessibility.
- [ ] Run OpenSpec strict validation when the CLI is available.
