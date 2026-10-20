# T07 review handoff

Prepared October 20, 2026 (Asia/Tehran). Implemented at the owner's request and
left uncommitted in Changes. The working tree was clean at the start; T06 already
existed in local commit `ddee9ff`. Its remote/deployment state was not queried.

## Implemented

- Shared daily rules at onboarding setup, new/edit habit and invite quick-create;
  collapsed help remains available on Dashboard and Journey. Account midnight,
  reminder independence, Endless/Custom completed-day targets, partial-date
  exemptions, one-miss streak reset and two-miss archive/disconnect match T02/T03.
- An unfinished one-miss card explains today's step without catch-up debt. Heart
  hints explain quiet support and recipient-day expiry without sender names.
- Dashboard offers a direct archive-list link when confirmed archives exist.
  Journey opens it on entry after a long absence or that link, uses an accessible
  toggle, and offers one Restore per habit. Confirmed restore links to Dashboard;
  a reached finite target still requires Continue/Archive. Stale state disables
  Restore while the existing app-level refresh/retry flow remains available.
- Journey refreshes active/archive/calendar together using the existing sync API.
  Its cumulative total sums confirmed `currentDay` once per habit, matching Profile;
  the best current streak means one active habit, never a global streak.
- History preserves YYYY-MM-DD keys and older English date-only strings. Zoned
  ISO timestamps are interpreted in the persisted account timezone (UTC for
  legacy accounts). Invalid/ambiguous unzoned values are omitted from the dated
  view, without changing saved data or fabricating dates to fill cumulative totals.
  Multiple completions on one date occupy one calendar cell; different habits
  with the same name keep distinct activity IDs. Grid arithmetic uses UTC date
  coordinates to avoid device DST, while today comes from the server account date.
  Existing slash/colon Tailwind class bindings in the calendar are expressed via
  `ngClass`, fixing a template syntax problem exposed during formatting.
- Earned unfilled color slots link to Profile; archived effort links to the same
  permanent collection. Existing T06 milestone/shared-path wording remains.
- Existing guarded `returnUrl` carries the invite through signup, OTP verification,
  email login and both Google paths. A shared internal-invite check drives the
  continuation hint and post-login navigation. This does not accept an invite;
  expired/unavailable invitations still fail in the existing Chain flow.
- Private motivation is optional, collapsed and starts empty. Solo use stays
  complete; old nudge/reminder onboarding copy now describes the actual heart
  action. T05's explicit disconnect reason, preview and private inbox remain intact.

No backend/API/schema/dependency changes or migration are introduced. The local
T07 definition in `scripts/sync-roadmap-tasks.cjs` is aligned for later owner sync;
the script was not run and historical JSON tracking snapshots were not edited.

## Verification boundary

Only source review, local Prettier formatting and Git diff/whitespace review were
performed. Regression **source** covers date normalization, account-month/today,
same-named habit entries/cumulative totals and guarded invite continuation. No
build, test suite, typecheck, OpenSpec validation, Prisma command, database action,
live HTTP/UI/PWA check, deployment, commit, push or external synchronization ran.

## Owner acceptance still pending

1. Run selected frontend build/tests/typecheck and OpenSpec validation. No passing
   command result is claimed by this handoff.
2. New user: rules are understandable at creation; Endless and Custom work alone;
   an empty private reason is valid and never appears in another account's data.
3. One miss: Complete today remains available and confirms streak 1, retaining
   cumulative effort. Two fully missed dates/weeks away: archives stay saved,
   Restore is explicit, same-day completion cannot duplicate and old links stay
   disconnected. A reached finite goal offers Continue/Archive after restore.
4. Compare Dashboard, Profile and Journey totals before/after completion/archive/
   restore. Confirm historic UTC accounts, timezone/device changes, account midnight,
   month/year boundaries, same-named habits and legacy/missing dated history.
5. Follow a real invitation through new signup/verification, email/Google login,
   retries and reload. Confirm the exact invite reopens, no automatic acceptance,
   expired/private/archived/self-invite errors, explicit dismissal and solo use.
6. Check anonymous hearts, next-color guidance, permanent earned slots and private
   disconnect receipts after absence. Verify mobile/short-window/keyboard/zoom,
   both themes, installed-PWA update and stale/offline/failed-save recovery.

T05/T06 still require their own reviewed schema/client/migration/release gates.
T07 does not validate those releases; deploy matching artifacts only after the
owner completes the relevant [T05](t05_review_handoff.md) and
[T06](t06_review_handoff.md) prerequisites. T08 measurements and T09 integrated
acceptance remain open.
