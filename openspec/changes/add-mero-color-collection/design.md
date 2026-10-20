## Decisions

- Store private progress, per-account date deduplication, accepted-partner identity
  deduplication and named color slots independently of habit/connection lifetimes.
- Source actions lock habits/relationships as before, then affected account rows in
  sorted order. Collection APIs lock only account rows. Counter updates commit in
  the source transaction; unique keys make duplicate events harmless.
- Capacity is zero until earned, otherwise 1 + max(floor(days / 21), ceil(partners / 2)).
  Selection 0 means the always-available default. Saved slots can be replaced freely.
- Deleting a partner removes its identifying deduplication row but never decrements
  another account's historical counter. No habit FK can erase earned collection days.
- Backfill the earliest 21-date run per single habit from canonical server log keys,
  distinct subsequent account dates, and distinct persisted accepted connection pairs.
  Missing/deleted historical evidence cannot be reconstructed. Local eligibility is ignored.
- Only eligible, uninitialized collections accept valid account-scoped local imports.
  Explicit server edits/default selection win. Locked candidates stay local for retry.
- Frontend confirms writes before applying appearance and invalidates old account,
  token and request-version responses. No cached/local reward state unlocks controls.

## Migration and release

New 20261020000000_mero_color_collection migration follows T05. It creates new
tables only, reading original rows without changing them. Stop old source writers
before migration/backfill and keep them stopped until the matching generated-client
backend is deployed: old writers cannot record new reward events. Take a current
restorable backup and rehearse the entire actually pending chain on a populated
copy through scripts/release-migrate.cjs. Inspect preservation, historical islands,
deduplication, account cascades, repeat deploy and recovery. Deploy matching frontend
and refresh PWAs. Do not drop earned tables or edit applied migration SQL on rollback;
use a compatible correction or rehearsed snapshot recovery with writers stopped.

No build, tests, Prisma generation/validation, database operation or deployment is
performed by this implementation session. Runtime/concurrency acceptance stays pending.
