# T06 review handoff

Prepared October 20, 2026 (Asia/Tehran). The owner selected scenario C, requested
the precise roadmap contract before implementation, and requested uncommitted
Changes for personal review. No build, tests, typecheck, OpenSpec validation,
Prisma generation/validation, migration, database connection, deployment, commit,
push or external issue/board synchronization was performed. Source formatting
and Git whitespace/diff review are the only executed checks in this session.
The local T06 task definition in `scripts/sync-roadmap-tasks.cjs` is aligned with
the new contract; the script was not executed and historical JSON snapshots remain unchanged.

## Product contract

- First slot: one habit's 21 consecutive account dates; shorter streaks and Chain
  activity cannot bypass the gate. Earned slots and colors never expire.
- After that date, a real completion on any habit adds one collection day per
  account/date. The unlock date is excluded. Multiple habits never multiply the
  day's progress. Gaps preserve it. This is cumulative progress, not a global streak.
- Real mutual Chain acceptance counts once per distinct partner account, in both
  directions, even before the gate. Invites, public habits and hearts do not count.
  Reconnects/multiple habits with the same account add nothing.
- Capacity after the gate is `1 + max(floor(days / 21), ceil(partners / 2))`.
  Thus slot 2 takes 21 later completion dates OR one accepted partner; slot 3 takes
  42 dates OR three partners, then 63 OR five, etc. Routes share targets, not additive
  rewards. Social participation is optional; only the next two targets are shown.
- Each earned slot stores one editable/replacable six-digit hex and 1–30-character
  trimmed plain-text color name. One active slot; selection 0 is the free default.
  Names belong to colors, never to Mero. Color edits do not change text/control colors.

## Implementation and concurrency

`mero_progress` stores the permanent gate, counters, selection, initialization
marker and a real-sent-support badge flag. `mero_collection_days` deduplicates
account dates; `mero_accepted_partners` deduplicates partner identities;
`mero_colors` keys slots by authenticated owner. There are no habit/connection
foreign keys that erase rewards on deletion. Account deletion cascades all owned
rows. Partner deletion removes the identifying deduplication record but does not
subtract another account's earned counter. New account identities cannot be proven
to be distinct people; there is no anti-Sybil guarantee.

Source writes retain existing ordered habit/relationship locks, then serialize on
affected accounts in sorted order using `FOR NO KEY UPDATE`. This mode is compatible
with source foreign-key KEY SHARE locks. Collection APIs take only account locks,
never habit locks. Reward writes are inside the completion/acceptance transaction;
failures propagate and roll the source transaction back. Unique source keys provide
deduplication; real PostgreSQL concurrent source/deletion behavior remains owner-run
acceptance, not something proved by mocked unit scenarios.

Authenticated routes are GET `/api/mero/collection`, PUT `/api/mero/colors/:slot`
(save and apply), PATCH `/api/mero/selection`, POST `/api/mero/import`. DTOs reject
unknown properties, invalid names/hex, negative/fractional selections and unearned
slots. Queries take ownership only from the authenticated user. Responses contain
only that account's collection/progress, use private/no-store headers, and the
frontend GET bypasses service-worker caching.

Frontend uses confirmed responses to apply appearance. Session/token/request-version
guards invalidate old reads/writes and account changes clear displayed ownership.
Drafts survive failed saves/background reads; an async initial read populates clean
inputs. Opening profile, habit-state changes, focus/visibility/online return and
explicit Refresh reload progress. A fresh session without a successful server read
uses the default appearance and retry state; offline cached eligibility never unlocks
controls. Collections synchronize on refresh, not through new push infrastructure.

Only valid `mehrchain_mero_customization_v1_<userId>` legacy colors are candidates.
Locked candidates remain locally for retry; unscoped guest data and all local
eligibility are ignored. Eligible import is conditional under the account lock:
an explicit server edit/default selection or an earlier import prevents later
device imports from overwriting preferences. A lost import response is safe to retry.

The selected hex updates the real Three.js luminous belly/flipper materials and
halo, and the CSS fallback/outer glow. Selecting default restores the original
warm palette. Shared scene drawing applies each target's color independently;
animation, motion reduction, lazy loading and device policy remain intact.

## Historical backfill and limits

New additive isolated migration:
`apps/mehrchain-backend/prisma/release-migrations/20261020000000_mero_color_collection/migration.sql`.

It creates four tables and the partner-deletion index, with owner cascades, unique
keys and basic checks. The migration reads original tables without updating them.
Per-habit canonical non-null log day keys are grouped into consecutive-date islands;
the earliest 21st date across qualifying habits is the account's gate. Archived
habits qualify. Subsequent distinct account dates seed the collection-day ledger.
Real persisted connection pairs seed both deduplication directions, including
disconnected rows. The existing sent-heart ledger seeds the support badge.

Deleted logs/habits/relationships cannot be reconstructed; no reward history is
invented from local caches, app visits, old currentDay totals or unaccepted invites.
The migration preserves surplus null-key duplicate logs. Operators must stop on
unexpected invalid canonical keys or inconsistent data and inspect the populated
copy rather than silently assigning eligibility. Backfill/runtime counting uses
the existing fixed account calendar and never changes historical keys/zones.

## Release prerequisites

Follow [database procedure](database_migration_procedure.md) and preserve T05's
separate unverified release gate. Do not infer its deployment from the source branch.

1. Privately verify the real target/revision and applied migration history; identify
   the actually pending chain. Take a new restorable populated snapshot. Do not
   replay October 17/18 migrations or resolve the baseline again by assumption.
2. Rehearse that chain through the isolated release wrapper on a disposable populated
   copy. Compare every original row/field and existing calendar/lifecycle/support/
   receipt data. Include archived qualifying habits, a gap at day 20, duplicate null
   logs, two short streaks, multiple habits completed on the same date, pre-unlock
   dates, existing 42+ streaks, disconnected/reciprocal/repeated-partner pairs, real
   hearts and account deletions. Check computed gates/counters, PKs/FKs/checks/index,
   repeat deploy, schema drift and snapshot recovery separately.
3. Stop old writers before applying the reviewed migration/backfill via
   `node scripts/release-migrate.cjs deploy` on the verified target. Keep old source
   writers stopped until the matching backend is serving; otherwise their events
   are missing from the new permanent ledger. No automatic catch-up is claimed.
4. Generate Prisma Client from the canonical schema, build/deploy matching backend
   through the existing release command, deploy matching frontend and refresh PWAs.
   Startup now requires ten schema probes. Generation does not apply SQL migrations.
5. Record the actual matching deployed revision, readiness and existing timezone/auth
   contract separately from UI acceptance. On rollback, keep writers stopped and use
   a compatible corrective release or rehearsed snapshot recovery; do not drop earned
   tables, edit applied SQL or disable readiness checks to hide a mismatch.

## Owner acceptance (not executed)

- Day 20 locked; one habit's day 21 unlocks; two short streaks do not. A stored reward
  survives a later miss, manual/automatic archive, restore and permanent habit deletion.
- 21 later distinct account completion dates OR one accepted partner yields capacity
  2; 42 OR three yields 3. Reaching both targets yields no duplicate slot. Several
  habits on one date add one; missed dates preserve the counter; the unlock date adds
  none. Check midnight/DST using account dates, not device elapsed hours.
- First/third/fifth distinct partners advance both sides, including before unlocking;
  unaccepted invitations, private/public edits, support and partner activity do not.
  Reaccepting one partner on another habit adds none. Disconnect/deletion retains
  earned capacity; deleting a participant cascades private identity rows.
- Race completion/completion, completion/acceptance, acceptance/acceptance, source
  writes/account deletion and import/edit/selection on real PostgreSQL. Check no
  duplicate counters, partial source actions, cross-account colors or deadlocks;
  mocked regression scenarios do not validate database locking or migration SQL.
- Confirm failed/offline/timeout saves keep appearance and input, retry converges,
  dirty drafts survive refreshes, and old account/token/read/write replies cannot
  apply after switching accounts. Confirm device restore and competing imports.
- Test literal HTML-like names, blank/long/control-character names, malformed hex,
  null/extra fields, fractional/negative/unearned slots and owner isolation.
- Inspect collection/editor at narrow/short desktop windows, keyboard/zoom, both
  themes, black/white/bright hex values, and 3D/static/reduced-motion/WebGL-loss states.
  An earned empty slot is not an invented saved color. Default selection is free.
- Generate the new client, run the owner-selected backend/frontend suites/builds,
  and validate the new OpenSpec change. Source regressions cover shared targets,
  event deduplication, DTO/API isolation, readiness, failed drafts/stale sessions,
  legacy import and procedural material reset; no passing result is claimed here.
