## Implementation

- [x] Add generation tokens, durable private receipts and production schema probes.
- [x] Validate explicit manual reason, optional bounded text and generation.
- [x] Capture the recipient receipt atomically under the existing ordered locks.
- [x] Add neutral lifecycle receipts and preserve the daily-heart allowance.
- [x] Add recipient-only pending receipt listing and idempotent dismissal.
- [x] Add compact reason/preview/Cancel UI and private updates independent of active cards.
- [x] Guard pending requests, retries, account switches and input during polling/failure.
- [x] Update focused regression scenarios and document migration/review handoff.

## Owner validation (not run at owner's request)

- [ ] Regenerate Prisma Client; run owner-selected build/typecheck/regression checks.
- [ ] Rehearse populated-copy migration, field preservation, cascades and snapshot recovery.
- [ ] Verify actual PostgreSQL concurrent disconnect/archive/reaccept races and atomic rollback.
- [ ] Verify offline return, repeated requests, multiple links, dismissal and account deletion.
- [ ] Review keyboard, mobile/desktop PWA, plain-text preview, long notes and failure/retry UX.
- [ ] Run OpenSpec strict validation when available; deploy through the reviewed release procedure.
