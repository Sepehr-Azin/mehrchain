# Change: T06 permanent named-color collection

## Why

Local-only color eligibility/preferences disappear across devices and conflate a
current streak with an earned milestone. The owner selected scenario C on October
20: permanent colors with optional habit or accepted-Chain progress paths.

## Authorization and status

The owner explicitly requested the roadmap contract first and implementation
immediately afterwards, left in Changes without builds, tests, commit or push.
This proposal records that authorized scope; it introduces no separate approval
step. Implementation is prepared locally in Changes; runtime validation and all
database/release actions remain unexecuted.

## What Changes

- First slot from one 21-day habit streak; permanent entitlement and saved colors.
- Afterwards, one collection day per account date with a completion, excluding
  the unlock date; every 21 dates advances a shared slot ladder without resets.
- Distinct accepted partners also advance that ladder at 1, 3, 5, etc. partners.
  Use the maximum path, not their sum; social participation remains optional.
- Authenticated collection editing/selection and safe eligible legacy import.
- Transactional permanent counters/deduplication and historical server backfill.
- Compact private collection, actual-event badges, and consistent 3D/fallback glow.

## Impact

- New capability: mero-color-collection. Source contract: docs/development_roadmap.md T06.
- Additive canonical Prisma schema and isolated release migration/readiness probes.
- Completion, Chain acceptance/support, profile/customization and shared Mero.
- No change to daily habit, timezone, finite goal, archive, heart or receipt rules.
