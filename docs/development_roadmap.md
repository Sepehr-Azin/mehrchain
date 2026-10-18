# MehrChain — Next iteration

> Updated: **2026-10-18 (Asia/Tehran)**. No committed deadline.
> Goal: a small, reliable daily habit experience with quiet support and a kind return.
> The owner reports a mostly successful two-person signup/Chain pilot, with proxy and server warm-up friction. Multi-day behavior and full acceptance still need testing.
> T00–T03 implementation is complete and pushed, as confirmed by the owner on October 17. T04 is the next feature task. Deployment and runtime acceptance evidence remain separate from code completion.
> T04 implementation is now prepared in uncommitted Changes for owner review. No builds, tests or migrations were run; acceptance remains pending.
> GitHub issue synchronization is completed. Tasks T00–T09 are tracked in issues #55–#64 on GitHub and the project board.

## Product rules

People should have room to grow through choice, small steps and real support. A solo user gets a complete experience; Chain is optional. Keep progress private, avoid comparison and preserve earlier effort after absence.

- **Daily habits:** Endless or Custom N completed days. A new calendar date opens the next completion; creating a habit at 08:00 must not impose an 08:00 reset.
- **Per-habit streak:** no global streak. After one missed date, the next completion starts at 1; cumulative progress remains.
- **Two missed days:** archive that habit after two fully missed consecutive dates and disconnect its attached chains. Opening the app or completing another habit does not count. Restore preserves history and requires a new invitation to reconnect.
- **Quiet support:** one heart action, received support without names, a number when multiple hearts arrive. No reaction feed or partner streak comparison.
- **Respectful disconnect:** ask a reason, preview what is shared and deliver it privately to the partner. Include a non-disclosing choice.
- **Mero:** fixed name, static image/glow, no motion or tap effect. At day 21, allow a custom color and a name for that color.
- **Minimal UI:** one primary action per card, one completion check, secondary information in details. Desktop PWA content stays compact even in a maximized window.
- **Honest feedback:** confirm saves before showing success; preserve input and allow retry on failure. Use short English copy, accessible controls and restrained feedback.

Implemented in T02/T03: persisted account IANA timezone; no missed-day penalty for a partial creation/restore date; Custom counts completed days; finite goals offer Continue or Archive when reached. Existing accounts/history retain UTC, and signing in or changing device timezone does not change an account's zone. Recommended color reward: one habit reaches 21 consecutive days, permanently earning the color option; this remains a proposal to resolve in T06. T04's prepared implementation uses the recommended heart limit: one sender per recipient habit per recipient day, regardless of multiple links. This implementation choice is recorded for owner review, not a claim of separate prior approval. Preserve historical UTC records explicitly during migration.

## Implementation order

**T00 → T03 are implemented and pushed. Continue with T04**, followed by T05–T07 on that foundation. T08 can run independently; its latency work does not replace verifying the signup contract. T09 verifies the integrated result. Carry the outstanding T00–T03 checks below into release validation; verify the deployed signup blocker is resolved before inviting testers. Each task includes its own focused checks; acceptance does not wait until the end to discover basic defects.

`FE` = `apps/mehrchain-frontend/src/app`; `BE` = `apps/mehrchain-backend/src/app`. Task IDs map to GitHub issues [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64). Checked boxes record completed implementation, not proof of deployed acceptance. T04 awaits owner review/validation; T05–T09 remain pending implementation.

| Task | Issue | Implementation | Commit | Status | Acceptance evidence in repository |
| --- | --- | --- | --- | --- | --- |
| T00 | [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55) | Complete / pushed | `784d1ed` | ✅ Implementation Done | Focused tests and deployed auth flows not recorded |
| T01 | [#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56) | Complete / pushed | `cfaf0fd` | ✅ Implementation Done | Responsive/PWA and failure-state review not recorded |
| T02 | [#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57) | Complete / pushed | `9643bda` | ✅ Implementation Done | Migration rehearsal, daily-boundary and concurrency checks not recorded |
| T03 | [#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58) | Complete / pushed | `2f1cff1` | ✅ Implementation Done | Migration rehearsal, lifecycle/PWA and PostgreSQL race checks not recorded |
| T04 | [#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59) | Prepared / uncommitted | — | Owner review | Build, tests, migration and runtime review not run |
| T05 | [#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60) | Pending | — | 📋 Ready | Pending implementation |
| T06 | [#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61) | Pending | — | 📋 Ready | Pending implementation |
| T07 | [#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62) | Pending | — | 📋 Ready | Pending implementation |
| T08 | [#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63) | Pending | — | 📋 Ready | Pending implementation |
| T09 | [#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64) | Pending | — | 📋 Ready | Pending implementation |

The T00–T03 handoffs are historical implementation notes written before commit/push. Their working-tree/uncommitted wording is superseded by this status and the owner's confirmation; their unexecuted validation steps remain open unless later results are recorded.

### T00 — Restore signup by aligning the deployed timezone contract ([#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55))

**Priority:** **P0 for release verification.** Confirm the reported signup failure is resolved before inviting new testers.

**Status:** implementation complete and pushed in `784d1ed`. Release-build freshness, artifact revision reporting, production schema readiness checks and auth validation regression coverage are documented in the [T00 handoff](t00_review_handoff.md). Deployed acceptance remains unrecorded; pushing code alone does not establish that the signup blocker is resolved.

- [x] Retain the supported timezone DTOs and strict unknown-field validation; add focused HTTP regression coverage for email/Google timezone persistence, UTC fallback, invalid zones and existing accounts.
- [x] Add a fresh Prisma/backend release build, embedded artifact revision/timestamp, uncached `/api/version` and production schema readiness checks.
- [x] Update the isolated release-migration wrapper and document database/release verification.

**Outstanding release verification (not unfinished implementation):**

**Scope:** email registration and Google authentication, their request DTOs, Cloudflare Pages `/api/*` proxy, Render backend build/revision and the account-calendar database migration introduced by T02.

**Historical investigation evidence (October 17, before the T00 fix):** the signup screen reported `property timeZone should not exist`. Frontend code sent `timeZone` in both registration and Google requests; backend DTOs allowed it in `9643bda`. The investigated local backend bundle was dated October 6 and lacked the field in both DTOs. This established a stale local build; an older deployed backend remained a hypothesis, not a verified production finding. Direct online checks from that investigation failed to connect. The updated Render build generates Prisma Client and builds the backend but does not apply migrations.

- [ ] Reproduce the deployed failure and record the endpoint, HTTP status and validation response without credentials or tokens. Compare Pages and Render deployed revisions, Render build/start logs and the proxy target; establish which backend artifact actually serves requests.
- [ ] Verify the production database target and migration history. Back up and rehearse both `20261017000000_account_calendar` and `20261017100000_habit_lifecycle` on a disposable populated copy, preserving existing UTC history. Use the [database procedure](database_migration_procedure.md), [T02 handoff](t02_review_handoff.md), [T03 handoff](t03_review_handoff.md) and `scripts/release-migrate.cjs` for the reviewed release chain. Inspect all pending migrations in the selected revision before applying it; the current backend includes and requires T03's lifecycle schema.
- [ ] After the required schema is verified, generate Prisma Client, build and deploy the matching backend revision containing both timezone DTO changes. Check build-cache/artifact reuse if the served contract remains old. Preserve strict unknown-field validation and the account timezone behavior rather than hiding the mismatch by dropping `timeZone` or disabling validation globally.
- [ ] Run the added auth-contract and schema-readiness regression tests. Confirm a valid `timeZone` is accepted, omission retains UTC, unrelated fields are rejected and invalid IANA values fail validation.
- [ ] Run deployed email signup through verification, Google signup/login, existing-account login and profile retrieval through the Pages proxy. Confirm new-account timezone persistence, existing-account compatibility and registration after a PWA update. Record tested frontend/backend revisions and migration status.

**Acceptance:** the deployed email and Google flows no longer reject the supported `timeZone` field; a new Tehran account retains its account timezone and existing accounts/history remain intact. Required migrations are applied, the running backend matches the reviewed revision, and no missing-column errors replace the validation failure. Real deployed flow results are recorded; a local build or unit test alone does not close this blocker. T02's broader daily-boundary acceptance remains separate.

### T01 — Simplify the interface and desktop PWA ([#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56))

**Status:** implementation complete and pushed in `cfaf0fd`; visual/runtime acceptance remains unrecorded. See [T01 handoff](t01_review_handoff.md).

**Scope:** `FE/app.html/.css`, global styles, dashboard, commitment-card, shared Mero, profile and onboarding copy.

- [x] Introduce one centered responsive app shell. Start visual review around 480–560 CSS px on desktop; fill available width on mobile. Align bottom navigation, floating add button, banners and dialogs with it. Keep scrolling, short windows, keyboard visibility and safe areas usable.
- [x] Remove the dashboard-wide streak. Habit summary keeps title, own streak, daily action and quiet finite progress. Move category, why, reminders and sharing details to accessible details/menu. Remove misleading modulo week dots and the Endless 100% progress bar.
- [x] Show one check with “Completed”. Remove Spark pulse/spin and artificial 400ms delay; pending/disabled state follows the actual request, with retry on failure.
- [x] Make Mero static across pages and wrappers; remove nickname editing and cosmetic click affordances. Keep useful profile navigation labeled and reachable. Preserve existing named-color data for T06.
- [x] Correct obsolete “7, 14, or 21 days” onboarding copy to Endless/Custom. Remove pressure-oriented signup/login wording. Do not advertise new archive/day rules before they ship.

**Acceptance:** all main routes work at 320/390 px and wide desktop sizes, including a maximized installed PWA, short windows, dialogs, both themes and 200% zoom. No stretched cards, detached controls, clipped actions or mascot movement. Slow/failed completion never appears successful.

**Original cause addressed:** the manifest already used `standalone`; T01 added the missing shared width-limited route wrapper and aligned navigation with it. Content containment is under app control; native first-launch window size depends on browser/OS. Preserve normal resize/maximize controls.

### T02 — Make daily completion and streak correct ([#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57))

**Status:** implementation complete and pushed in `9643bda`; migration/runtime acceptance remains unrecorded. See [T02 handoff](t02_review_handoff.md).

**Scope:** `BE/commitments/`, account timezone, Prisma/shared types, frontend commitment store and resume/day-boundary refresh. Uses the implemented calendar rules above.

- [x] Use one server-authoritative local-day calculation for completion, streak and missed full dates. Return current day/next boundary; derive streak on reads as well as completion.
- [x] Preserve same-day idempotency and transaction locking; enforce one persisted completion per habit day. Prepare the additive UTC-history migration and preservation/rehearsal procedure; execution remains in the verification checklist below.
- [x] Refresh after local midnight, foreground return and reconnect. A PWA left open overnight must unlock the next opportunity without reload. Device-clock changes cannot grant an extra completion.
- [x] Keep cumulative progress separate from streak. Custom targets stop at their goal and offer Continue or Archive; Endless has no artificial end.

**Acceptance:** 08:00 → next 00:01 is valid; two devices/retries create one daily event; a one-day gap restarts at 1. Test Tehran, DST, year boundary, stale cache and explicit timezone-change policy. Failed refresh remains visibly stale.

### T03 — Archive habits and disconnect chains consistently ([#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58))

**Scope:** commitment archive/restore, `BE/chain/`, relationship/invite data and archive UI. Depends on T02.

**Status:** implementation complete and pushed in `2f1cff1`; migration/runtime acceptance remains unrecorded. See [T03 handoff](t03_review_handoff.md) and [OpenSpec implementation/validation checklist](../openspec/changes/update-habit-chain-lifecycle/tasks.md).

- [x] After two full missed dates, archive only the affected habit, preserving history/progress. Reconcile on reads/actions even if the server slept; cron is not required for correctness.
- [x] Atomically disconnect its attached reciprocal chains and invalidate outstanding invites. Apply the same lifecycle operation to manual archive; preserve unrelated habits and relationships.
- [x] Revalidate both habits during invite acceptance. Archived/private habits and stale links cannot create connections or receive support. Replace the old three-day DORMANT behavior with the agreed two-day rule.
- [x] Restore with a fresh inactivity anchor and restarted current streak. Require explicit new acceptance to reconnect; existing unique rows must not block legitimate re-invitation. Completed finite goals must not inactivity-archive while awaiting the user's choice.

**Acceptance:** Monday complete, Tuesday/Wednesday missed → archived Thursday 00:00, including after server sleep. One missed date stays active. Multi-partner archive, simultaneous completion/invite, manual archive and restore/reconnect preserve unrelated data and do not immediately rearchive.

### T04 — Make Chain and hearts quiet and minimal ([#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59))

**Scope:** backend reactions, shared response types, frontend Chain service/cards and habit support summary. Depends on T02/T03.

**Status:** implementation prepared in Changes for owner review. See [T04 handoff](t04_review_handoff.md) and [OpenSpec checklist](../openspec/changes/update-quiet-chain-hearts/tasks.md). No build, test, migration, commit or push was run.

- [x] Replace the retry-sensitive heart toggle with an idempotent send. Enforce one sender/recipient-habit/recipient-day allowance across links and return the viewer's own aggregate received count plus sent state.
- [x] Replace named support paragraphs/toasts with a heart; show a numeral only above one, with an accessible count description. Daily expiry follows the recipient habit's day.
- [x] Keep Chain cards to partner/habit identification, one restrained current state, heart action and secondary menu. Remove redundant status text, alarm-like pulses, obsolete nudges and Coming Soon clutter.
- [x] Keep invitations easy to find, details/disconnect reachable, and active relationships separate from history. Never expose partner streaks or rank popularity.

**Acceptance:** two supporters produce the right count; duplicate links, retries and simultaneous requests do not inflate or undo support. Reload/day rollover is consistent; stale disconnected/private/archived targets reject new hearts. Empty and multi-partner layouts remain clear.

### T05 — Ask and deliver a disconnect reason ([#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60))

**Scope:** disconnect API/transaction, durable recipient event and compact frontend reason/receipt UI. Depends on T03; integrates with T04's menu.

- [ ] Ask for a reason with Cancel and a recipient-visible preview. Offer simple choices including “Prefer not to share”; personal explanation is optional.
- [ ] Persist one private reason event atomically with reciprocal disconnection. It remains available after the relationship disappears from active queries and after the recipient returns offline.
- [ ] Restrict access to the intended participants; safely render any bounded optional text. Retried requests create one event. Automatic archive uses a neutral system reason.

**Acceptance:** cancel changes nothing; manual disconnect updates both sides and the partner receives the chosen reason once. Verify offline return, retries, multiple relationships and account deletion. No chat, email or push infrastructure is needed.

### T06 — Make the day-21 named color durable ([#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61))

**Scope:** profile/Mero customization, server-backed preferences/earned milestone and migration. Depends on T02 and the reward interpretation.

- [ ] Unlock a custom color/name from one qualifying habit; do not combine shorter habit streaks or count app visits. Mero's name stays fixed.
- [ ] Persist entitlement and selected color/name with validation and account isolation. Keep an earned reward after missed days/archive, and recover it on another device.
- [ ] Migrate existing local color preferences without trusting local eligibility. Keep the studio compact; check existing badge eligibility against real connection/support events while updating shared reward consumers.

**Acceptance:** day 20 stays locked, qualifying day 21 unlocks, and a later miss/archive does not revoke an earned reward. Login/device change restores it; invalid values and failed saves do not corrupt preferences. Treat 21 days as a product milestone, not a habit-formation claim.

### T07 — Explain daily rules and make returning easy ([#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62))

**Scope:** contextual copy, create/edit habit, Journey/history, archive and return states. Integrates T02–T06.

- [ ] Briefly explain timezone/daily reset, Endless/Custom meaning and the two-missed-day archive rule where a habit is created. Add a short contextual hint at first miss/archive/heart/unlock; keep help discoverable without repeating onboarding.
- [ ] One missed day: allow today's step, then show streak 1 without catch-up debt. Longer absence: show preserved history and one clear Restore action; do not automatically revive habits or reconnect people.
- [ ] Keep dated history, cumulative completions, current streak and earned rewards consistent across active/archive/Journey views. Use actual completion dates for calendars.
- [ ] Preserve an incoming invite through signup/login and keep the solo journey complete. Keep “why” private and secondary.

**Acceptance:** a new user, daily visitor, user after one miss and user returning after weeks can identify the next action unaided. Dates/history agree across views and devices. No new coaching system, extra daily ritual or celebration overlay is required.

### T08 — Reduce startup and access friction within a free budget ([#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63))

**Scope:** current Pages proxy, Render/Neon request path, authentication reachability, loading/retry and foreground refresh.

- [ ] Measure warm and idle first-action latency separately for API, database and auth provider, on representative desktop/mobile networks and with/without proxy where feasible. Keep private account data out of measurements.
- [ ] Improve waiting/retry while preserving form input and confirmed-save behavior. Pause hidden Chain polling; deduplicate foreground refresh and avoid overlapping requests.
- [ ] Only if startup remains a material blocker, run a bounded Workers + existing database experiment with representative auth, hashing and transactional writes. Compare free quotas, compatibility, actual latency and maintenance cost.
- [ ] Record keep/migrate decision. Recheck provider limits first; retain the working stack unless the experiment demonstrates improvement. No provider rewrite, keep-alive service or paid plan is assumed.

**Acceptance:** identify the real delay and show a measured improvement or a clear reason to keep the current stack. A new host must preserve auth, transactions and data recovery; no promise of zero warm-up from a hello-world test.

References for implementation: [Render Free](https://render.com/docs/free), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero). Email signup/reset may only be offered as a fallback after actual delivery capability is confirmed.

### T09 — Verify the complete experience with two real accounts ([#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64))

**Scope:** focused regression/integration tests, deployed browser/PWA acceptance and the next small human test. Depends on completed product tasks; T08 migration is not mandatory.

- [ ] Verify real signup/login, stable identity, sign-out/in, reload, invite-led signup, solo/public habits and reciprocal Chain acceptance using two independent browser sessions.
- [ ] Cover midnight, one miss, two misses, long absence, restore/reconnect, finite goal, day 21, multiple hearts and reason delivery. Use a controlled clock for arithmetic and real PostgreSQL for transaction/race checks; distinguish simulated dates from observed days.
- [ ] Verify slow/unavailable API, retry, expired session and account switch. Check deletion with disposable accounts, old-token denial and preservation of the other user's data. Confirm an updated PWA receives the new UI without losing in-flight work.
- [ ] Record tested revisions, outcomes and defects; fix blockers before inviting the next few testers. Use the existing [test handoff](v1_test_and_release_handoff.md) and [database procedure](database_migration_procedure.md) for relevant setup/recovery.

**Acceptance:** the core journey and requested return/support rules work in the intended environment; desktop installed PWA and mobile layouts pass. Untested paths stay explicit. A successful build or unit count alone does not prove acceptance.

## Outstanding T00–T03 verification

- [ ] Run builds/typechecks and the prepared focused tests; the handoffs explicitly record that they were not run during implementation. This roadmap update does not claim new execution results.
- [ ] Rehearse and verify both `20261017000000_account_calendar` and `20261017100000_habit_lifecycle`, in order after the existing release baseline/daily-hearts migration. Record preservation, unique-index/default checks, repeat deploy, drift and snapshot recovery. The current backend requires both migrations; Render's build does not apply them, and its startup column probe does not verify migration history or the daily-event unique index.
- [ ] Record matching direct/proxied backend artifact revisions and actual email/Google signup, existing-account and updated-PWA results. Source and remote-branch synchronization do not prove a running deployment.
- [ ] Complete the T01 visual checks, T02 calendar/refresh checks and T03 lifecycle/restore/reconnect checks described above and in their handoffs, including real PostgreSQL concurrency and account isolation.
- [ ] Run strict validation of `update-habit-chain-lifecycle` when the OpenSpec CLI is available; its handoff records this as not run.

T04's idempotent hearts/recipient-day expiry are prepared for owner review and require the new allowance-ledger migration; acceptance is pending. T05's private disconnect receipts and T06's durable color reward remain planned work. These do not reopen the completed T00–T03 implementation.

## Scope and completion

The active roadmap contains these ten tasks (T00–T09) only. Three.js, articles, localization, charity/community features, analytics, flexible schedules, store distribution and broader redesigns are outside this iteration. Revisit them after the daily loop is reliable rather than carrying speculative tasks into execution.

Keep implementation changes small and reviewable, using the repository's OpenSpec workflow where behavior/schema changes require it. Track implementation completion separately from acceptance: T00–T03 code is complete/pushed, while release readiness requires the outstanding evidence above. New data migrations require a backup, rehearsal and rollback plan. No production deployment or release tag follows automatically from this document.

GitHub synchronization status: completed. All tasks T00–T09 are mapped to GitHub issues ([#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64)) and tracked on the project board with appropriate priorities and states. Obsolete and duplicate pre-pilot issues (#20, #44, #48–#54) have been closed with clear audit notes.
