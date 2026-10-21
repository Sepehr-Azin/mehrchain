# T17 optional username and verified password access — October 21, 2026

## Implemented locally

- Nullable usernames with authenticated Profile add/edit/remove. New saves use
  lowercase 3–20 English letters/digits/underscore; availability is debounced,
  cancellable, rate-limited and advisory. Both original uniqueness and a database
  `lower(username)` unique index enforce concurrent claims. Saves return a useful
  409 on collision. Blank removes; an unchanged own name remains available.
- Email/password signup accepts no username. Login keeps the existing `email`
  request key and accepts email, username or `@username`. Passwords are passed
  unchanged instead of trimming user-entered spaces. IDs and all ownership keys
  remain unchanged; removed/edited old names no longer resolve to that account.
- Existing names are preserved as `usernameSource: legacy`, because historical
  rows have no reliable marker distinguishing every generated Google name from
  a deliberately chosen name. No heuristic renames/deletes them. New Google
  accounts receive no generated handle; an explicit save records `chosen`.
- Google-generated random credentials are not advertised as usable passwords.
  A previously unverified signup converted by verified Google sign-in loses its
  untrusted signup password; a conditional write protects concurrent verification.
  `passwordSetAt` records deliberate signup/reset or successful legacy password
  login. An existing token with unknown credential provenance conservatively sees
  email setup; email/password login and Google identity remain available.
- Purpose-separated password setup/recovery endpoints and UI replace the former
  no-op reset screen. Only an already-verified account can use this flow. Codes
  are hashed, expire after 15 minutes, allow five attempts and are rate-limited
  with a per-account request cooldown. Failed attempts commit; valid consumption,
  password replacement and token-version increment share a locked transaction.
  Registration codes cannot change a password. Mail failure removes only that
  challenge, without silently falling back in production.
- Password reset invalidates existing sessions. Old tokens without a version
  remain valid at version zero; new sign-ins use the current version. Profile
  never returns credential hashes, reset challenges or token-version internals.
- Username and password UI reject stale session responses, preserve failed drafts
  and show confirmed saves only. Null-handle Chain partners use a display-name
  fallback. Personal Why, account timezone, invites, habits and earned colors
  are independent of the mutable username.

## Migration rehearsal and release boundary

Prepared `20261021000000_optional_usernames` in the isolated release chain.
It fails on a historical case collision rather than choosing an owner or changing
names. Its nullable column, provenance/password/session fields and password-reset
table are additive. Keep the expression index when managing this schema; do not
replace the database uniqueness guarantee with an availability lookup.

Applied only to the disposable T12 rehearsal child (`br-old-dew-b1xv76qz`), then
repeated deploy. Compared all original fields/row counts across its eleven
pre-existing application tables. Concurrent mixed-case claims produced exactly
one successful save and one unique-constraint rejection; multiple null names and
password-challenge deletion cascade were verified. Synthetic fixtures stayed on
that disposable branch. Private result: ignored `tmp/t17-rehearsal-result.json`.
The production database and recovery snapshot were not changed by T17.

No local build, unit suite, typecheck, Prisma Client generation, schema-diff or
strict OpenSpec validation was run. Regression source covers DTOs, uniqueness,
optional signup, unknown-account responses, expiry/attempts, password consumption,
session invalidation, debounced availability and stale/failed UI writes.
The backend test target now depends on Prisma Client generation, as the build
target already does; neither path applies SQL migrations automatically.

Before production delivery, review/build/check the committed candidate, take a
fresh restorable snapshot of the then-current populated target and repeat the
release rehearsal. Stop old writers, apply only the pending reviewed migration
through `node scripts/release-migrate.cjs deploy`, generate the matching client
and deploy matching backend/frontend. Readiness now has twelve required probes.
Do not mix old/new writers or roll back to an old client after null usernames and
password-version changes have been used; rehearse a compatible corrective release
or snapshot recovery with writes stopped.

T14 remains blocked by the owner's lack of a sending domain. Resend login alone
does not establish email delivery; no production signup/reset/setup mail success
is claimed. T09 must cover real delivered codes, replay/exhaustion/cooldown,
Google/email/username reload and another-device behavior on the final candidate.
