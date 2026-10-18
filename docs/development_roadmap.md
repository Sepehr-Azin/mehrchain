# MehrChain — Next iteration

> Updated: **2026-10-18 (Asia/Tehran)**. No committed deadline.
> Goal: a small, reliable daily habit experience with quiet support and a kind return.
> The owner reports a mostly successful two-person signup/Chain pilot, with proxy and server warm-up friction. Multi-day behavior and full acceptance still need testing.
> T00–T04 implementation is complete and pushed. The owner confirms T04 is done; its implementation is in `9066570`. T05 is the next feature task.
> On October 18, the production timezone-contract failure was reproduced and fixed, all three pending release migrations were rehearsed/applied, and backend `952f5f3` became Live. Backend tests passed; remaining interactive, frontend/PWA and PostgreSQL race checks are listed explicitly below.
> Tasks retain their existing issue mappings #55–#64. This update changes only this local roadmap; it does not update GitHub issues, the project board, other handoffs or OpenSpec checklists.

## Product rules

People should have room to grow through choice, small steps and real support. A solo user gets a complete experience; Chain is optional. Keep progress private, avoid comparison and preserve earlier effort after absence.

- **Daily habits:** Endless or Custom N completed days. A new calendar date opens the next completion; creating a habit at 08:00 must not impose an 08:00 reset.
- **Per-habit streak:** no global streak. After one missed date, the next completion starts at 1; cumulative progress remains.
- **Two missed days:** archive that habit after two fully missed consecutive dates and disconnect its attached chains. Opening the app or completing another habit does not count. Restore preserves history and requires a new invitation to reconnect.
- **Quiet support:** one heart action, received support without names, a number when multiple hearts arrive. No reaction feed or partner streak comparison.
- **Respectful disconnect:** ask a reason, preview what is shared and deliver it privately to the partner. Include a non-disclosing choice.
- **Mero:** fixed name. The current implementation uses adaptive Three.js rendering with animation and static/fallback behavior; the original static-only T01 direction has been superseded in code by `31e965f` and `657eab1`. Preserve the current mascot while checking reduced-motion, constrained-device and WebGL fallback behavior. At day 21, allow a custom color and a name for that color through T06.
- **Minimal UI:** one primary action per card, one completion check, secondary information in details. Desktop PWA content stays compact even in a maximized window.
- **Honest feedback:** confirm saves before showing success; preserve input and allow retry on failure. Use short English copy, accessible controls and restrained feedback.

Implemented in T02/T03: persisted account IANA timezone; no missed-day penalty for a partial creation/restore date; Custom counts completed days; finite goals offer Continue or Archive when reached. Existing accounts/history retain UTC, and signing in or changing device timezone does not change an account's zone. The October 18 migration preserved those historical fields and UTC defaults. Recommended color reward: one habit reaches 21 consecutive days, permanently earning the color option; resolve this interpretation before implementing T06.

Implemented in T04: one sender per recipient habit per recipient account date, regardless of multiple links. A send is idempotent and never toggles off on retry. Disconnect/archive/private changes clear visible support, but do not refund that day's allowance; reconnecting the same day cannot revive the old support. Sent state follows the partner habit's calendar; own received counts follow the own habit's calendar. T05 must preserve this distinction between visible support and the durable allowance ledger.

## Implementation order

**T00 → T04 are implemented. Continue feature work with T05**, then T06 and T07 on that foundation. First record a real Google signup/returning-account check on the repaired deployment and run the outstanding frontend/Chain checks. T08 can run independently; latency work does not reopen the repaired timezone contract or imply a provider migration. T09 combines the remaining acceptance scenarios with the later features. Validate each feature as it lands rather than deferring all checks to T09.

`FE` = `apps/mehrchain-frontend/src/app`; `BE` = `apps/mehrchain-backend/src/app`. Task IDs map to GitHub issues [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64). Checked boxes record only the implementation or verification explicitly described. Completed implementation, a successful release and full human acceptance are separate states. T05–T07 remain feature work; T08 has some supporting behavior already implemented; T09 has backend/release evidence but remains incomplete.

| Task | Issue | Implementation | Commit | Status | Acceptance evidence in repository |
| --- | --- | --- | --- | --- | --- |
| T00 | [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55) | Complete / pushed | `784d1ed`, release fix `952f5f3` | Production timezone blocker resolved | Matching live API revisions, HTTP contract probes and backend tests passed; real Google/OTP/PWA flows remain |
| T01 | [#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56) | Complete / pushed | `cfaf0fd`; follow-ups `0e0bb54`, `657eab1` | Implementation complete | Mobile onboarding/input/Mero follow-ups committed; full responsive/PWA and failure-state review remains |
| T02 | [#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57) | Complete / pushed | `9643bda` | Backend deployed; migration verified | Populated-copy rehearsal, production preservation/default/index/drift checks and backend tests passed; midnight/device/race checks remain |
| T03 | [#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58) | Complete / pushed | `2f1cff1` | Backend deployed; migration verified | Lifecycle migration, preservation and backend tests passed; real restore/reconnect, PWA and PostgreSQL races remain |
| T04 | [#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59) | Complete / pushed | `9066570` | Done per owner; backend deployed | Ledger migration/index/FK checks and backend tests passed; frontend, real supporters/day rollover and populated-heart backfill checks remain |
| T05 | [#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60) | Pending | — | 📋 Ready | Pending implementation |
| T06 | [#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61) | Pending | — | 📋 Ready | Pending implementation |
| T07 | [#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62) | Pending | — | 📋 Ready | Pending implementation |
| T08 | [#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63) | Partial supporting behavior from T04 | `9066570` | Measurement/retry work pending | Hidden polling pause and support request/session guards implemented; latency measurements and hosting decision remain |
| T09 | [#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64) | Partial verification evidence | Release `952f5f3` | Integrated acceptance pending | 124 backend tests, migration/release checks and live contract probes passed; frontend/real-account/PWA/race acceptance remains |

The T00–T04 handoffs and OpenSpec checklists are historical notes. Their uncommitted/not-run wording is superseded only where this roadmap records later evidence. They are not edited by this update. Do not interpret the successful backend tests or release as proof that every visual, frontend, provider or race scenario passed.

## October 18 release evidence

The detailed investigation and execution record is [timezone incident report](timezone_incident_2026-10-18.md). This is a completed deployment record, not a request to repeat production migrations.

| Evidence | Verified result |
| --- | --- |
| Original failure | Direct Render and Pages Google requests returned HTTP 400, `property timeZone should not exist`; live Google/Register Swagger DTOs omitted the field; `/api/version` returned 404 |
| Running old backend | Render was still on manually deployed October 6 commit `483f6c4`; no deployment of the October 17 timezone changes had run |
| Repository connection | Render's deployment credential did not list `mehrchain`; the owner restored repository access and Render then listed it |
| Build defect found during remediation | `NODE_ENV=production` made the new `npm ci` omit dev build tools, causing `prisma: not found`; fixed with explicit `--include=dev` in `render.yaml`, commit `952f5f3` |
| Working release configuration | `npm ci --include=dev --legacy-peer-deps && NX_DAEMON=false npm run build:backend:release`; Prisma generation, fresh backend build, Node 22, start `node dist/mehrchain-backend/main.js`, health path `/api/version` |
| Automatic delivery | Push `952f5f3` triggered Blueprint sync `exe-dbahvpm1egvs73dnola0` and deployment automatically; GitHub-to-Render delivery was observed working |
| Live backend | `952f5f376b3ee6db0d64791d81e189cb6b0944b6`, deployment `dep-dbahvpiog99s739e5tlg`, status **Deploy succeeded / Live**; startup schema probes passed |
| Direct/proxy agreement | Render and Pages `/api/version` both returned 200 with that SHA, `authContract: account-timezone-v1`, build timestamp `2026-10-18T19:38:49.812Z` |
| Auth contract after release | Both live DTOs expose `timeZone`; empty-token + Tehran requests reject only the token, a nonempty invalid token reaches provider verification and returns 401, unrelated properties remain rejected; invalid email-signup fields no longer cause a timezone-field error |
| Google configuration | Public client ID in the live frontend bundle matches Render's `GOOGLE_CLIENT_ID` |
| Backend checks | Local release build passed; all 15 backend suites / 124 tests passed, including auth contract, calendar/lifecycle, Chain and schema readiness; 8 additional local production-mode HTTP checks passed with DB/mail/JWT/Google-provider boundaries substituted |

**Test-runner limit:** the ordinary Jest run failed to load ESM `@nestjs/passport`. The successful backend run used an in-memory ts-jest override with `allowJs` and that dependency transformed. The checked-in Jest configuration was not changed; standard CI compatibility remains a follow-up. No new frontend test/build result or frontend deployment SHA was recorded in this remediation. The observed live web assets were `main-OQYUTWZK.js` and OAuth-config chunk `chunk-W7ZLYALD.js`; these identify the inspected assets, not full frontend acceptance.

**Email configuration follow-up:** the inspected October 18 Render environment had no `RESEND_API_KEY` / `MAIL_FROM` entries and no linked environment groups. `MailService` raises a production 503 if verification mail cannot be sent. Configure/confirm the actual sending credentials and sender, then test delivery/verification before advertising email signup or reset as a working fallback. The timezone fix and matching Google client IDs do not establish mail readiness.

**Database execution and preservation:** the Render database target was privately matched before any writes. Existing release-baseline/daily-heart migration checksums matched. The following additions were applied in order on a populated copy, then production through `scripts/release-migrate.cjs`:

1. `20261017000000_account_calendar` — UTC defaults, log timezone/day keys and unique habit/day index.
2. `20261017100000_habit_lifecycle` — nullable inactivity anchor preserving original dates/progress.
3. `20261018000000_idempotent_chain_hearts` — allowance ledger, composite primary key, recipient/day index and cascade foreign keys.

Repeat deploy was a no-op, all five applied migration checksums matched and schema diff reported zero drift. Every original row/field was compared before/after and again after deployment/probes. At that verification point there were 2 users, 3 habits, 3 completion logs, 0 Chain connections and 1 invite; existing account zones defaulted to UTC. These are historical verification counts, not a claim about future live totals.

**Recovery evidence and limits:** a consistent private JSON backup was saved under ignored `docs/backups/`. Neon branch `timezone-recovery-20261018` (`br-dry-voice-b1ubd1pa`) retains the original schema/data without auto-expiry, with every original row/field verified. Its separate child `timezone-rehearsal-20261018` (`br-dry-thunder-b1x7p6r4`) was migrated and is scheduled to expire October 19 around 23:02 Asia/Tehran. The recovery branch was not migrated. Actual backend switching/restoration and redeployment against the snapshot were not exercised. The copy had habits/logs but **no Chain connections/hearts**: nonempty-heart backfill, duplicate-support fixtures and PostgreSQL send races still require separate rehearsal. Private backups/credentials must stay outside version control; ignored `tmp/` evidence is supplemental, not durable release documentation.

### T00 — Restore signup by aligning the deployed timezone contract ([#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55))

**Priority:** original P0 timezone/API blocker resolved. Complete real-account authentication acceptance before inviting new testers.

**Status:** implementation complete in `784d1ed`, with production remediation and build-tool fix `952f5f3` deployed on October 18. The exact reported validation failure is fixed on direct/proxied production requests. See the [T00 handoff](t00_review_handoff.md) for historical implementation and the [incident report](timezone_incident_2026-10-18.md) for later execution. End-to-end Google/OTP/PWA acceptance is still separate.

- [x] Retain the supported timezone DTOs and strict unknown-field validation; add focused HTTP regression coverage for email/Google timezone persistence, UTC fallback, invalid zones and existing accounts.
- [x] Add a fresh Prisma/backend release build, embedded artifact revision/timestamp, uncached `/api/version` and production schema readiness checks.
- [x] Update the isolated release-migration wrapper and document database/release verification.

**Release verification completed October 18:**

**Scope:** email registration and Google authentication, their request DTOs, Cloudflare Pages `/api/*` proxy, Render backend build/revision and the account-calendar database migration introduced by T02.

The October 17 investigation could not verify production. October 18 live HTTP and authenticated Render checks established that production itself was still on the old October 6 contract. Both Google buttons use the same `/api/auth/google` route, explaining identical signup/sign-in errors. Missing repository visibility prevented automatic updates from reaching this deployment; after access was restored, a separate omitted-dev-tools build defect was found and fixed. The build still intentionally does not apply migrations automatically.

- [x] Reproduce direct/proxied failure and inspect Render's actual deployed SHA, history, build/start settings and GitHub repository visibility.
- [x] Match the production database, verify migration history/checksums, back up, rehearse and apply the complete three-migration chain required by current code; verify preservation, repeat deploy and zero drift.
- [x] Restore repository visibility, synchronize Blueprint settings and fix omitted build tools with `--include=dev`. Observe successful fresh build, startup probes and Live deployment, including automatic delivery of the corrective push.
- [x] Run auth-contract/readiness suites and local production-mode HTTP checks. Local substituted-dependency coverage confirms Tehran persistence, UTC omission fallback, invalid types/IANA values, unrelated-field rejection and existing-account timezone preservation.
- [x] Verify matching direct/Pages build identities, supported live DTOs, accepted timezone field and rejection of invalid tokens/unrelated properties. Retain strict validation; no timezone-dropping workaround was used.

**Remaining acceptance:**

- [ ] Use a real Google identity to create a new account through Pages; verify `/auth/me` persists its detected account timezone. Then sign in again from another device/timezone and verify the stored zone remains unchanged. Record returning legacy UTC-account login separately.
- [ ] Configure/confirm production verification-mail credentials and sender, then verify real email signup, OTP delivery, verification and profile retrieval. Invalid-body API probes do not test mail or a successful registration; record delivery failures separately from the resolved timezone validation issue.
- [ ] Repeat Google signup/login and invite-led entry after an installed PWA update, recording frontend/backend revisions and checking stable identity, saved input and existing data.

**Acceptance boundary:** timezone-field rejection, stale backend and missing-schema release prerequisites are resolved and verified. Successful interactive Google login, new-account persistence and actual OTP/PWA flows still need their own recorded outcomes. T02's daily-boundary checks remain separate. Investigate any new authentication failure by its actual response rather than repeating already-applied migrations.

### T01 — Simplify the interface and desktop PWA ([#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56))

**Status:** implementation complete in `cfaf0fd`; mobile onboarding bottom alignment, input-outline and mascot follow-ups are in `0e0bb54` / `657eab1`. Full visual/runtime acceptance remains unrecorded. See [T01 handoff](t01_review_handoff.md); its static-only mascot direction predates the current Three.js integration.

**Scope:** `FE/app.html/.css`, global styles, dashboard, commitment-card, shared Mero, profile and onboarding copy.

- [x] Introduce one centered responsive app shell. Start visual review around 480–560 CSS px on desktop; fill available width on mobile. Align bottom navigation, floating add button, banners and dialogs with it. Keep scrolling, short windows, keyboard visibility and safe areas usable.
- [x] Remove the dashboard-wide streak. Habit summary keeps title, own streak, daily action and quiet finite progress. Move category, why, reminders and sharing details to accessible details/menu. Remove misleading modulo week dots and the Endless 100% progress bar.
- [x] Show one check with “Completed”. Remove Spark pulse/spin and artificial 400ms delay; pending/disabled state follows the actual request, with retry on failure.
- [x] Complete the original Mero/profile cleanup and preserve existing named-color data for T06. Later Three.js integration (`31e965f`) and appearance/animation restoration (`657eab1`) supersede the original static-only criterion; validate the current component and its fallbacks rather than redoing T01 to remove it.
- [x] Correct obsolete “7, 14, or 21 days” onboarding copy to Endless/Custom. Remove pressure-oriented signup/login wording. Do not advertise new archive/day rules before they ship.

**Acceptance:** all main routes work at 320/390 px and wide desktop sizes, including a maximized installed PWA, short windows, keyboard-open onboarding, dialogs, both themes and 200% zoom. No stretched cards, detached controls or clipped actions. Verify the shipped Mero's reduced-motion/static/constrained-device/WebGL fallback behavior. Slow/failed completion never appears successful.

**Original cause addressed:** the manifest already used `standalone`; T01 added the missing shared width-limited route wrapper and aligned navigation with it. Content containment is under app control; native first-launch window size depends on browser/OS. Preserve normal resize/maximize controls.

### T02 — Make daily completion and streak correct ([#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57))

**Status:** implementation complete in `9643bda` and included in live backend `952f5f3`. Calendar migration, original-field preservation, UTC defaults, log day keys and unique index were verified on rehearsal and production on October 18; backend suites passed. Daily-boundary/device/PWA and real PostgreSQL concurrency acceptance remains. See [T02 handoff](t02_review_handoff.md).

**Scope:** `BE/commitments/`, account timezone, Prisma/shared types, frontend commitment store and resume/day-boundary refresh. Uses the implemented calendar rules above.

- [x] Use one server-authoritative local-day calculation for completion, streak and missed full dates. Return current day/next boundary; derive streak on reads as well as completion.
- [x] Preserve same-day idempotency and transaction locking; enforce one persisted completion per habit day. Rehearse/apply the additive UTC-history migration and verify preservation, UTC defaults, day keys, unique index, repeat deploy and zero drift.
- [x] Refresh after local midnight, foreground return and reconnect. A PWA left open overnight must unlock the next opportunity without reload. Device-clock changes cannot grant an extra completion.
- [x] Keep cumulative progress separate from streak. Custom targets stop at their goal and offer Continue or Archive; Endless has no artificial end.

**Acceptance:** 08:00 → next 00:01 is valid; two devices/retries create one daily event; a one-day gap restarts at 1. Test Tehran, DST, year boundary, stale cache and explicit timezone-change policy. Failed refresh remains visibly stale.

### T03 — Archive habits and disconnect chains consistently ([#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58))

**Scope:** commitment archive/restore, `BE/chain/`, relationship/invite data and archive UI. Depends on T02.

**Status:** implementation complete in `2f1cff1` and included in live backend `952f5f3`. Lifecycle migration was rehearsed/applied with original history/progress preserved; backend lifecycle suites passed. Real multi-account archive/restore/reconnect, sleeping-server/PWA and PostgreSQL race acceptance remains. See [T03 handoff](t03_review_handoff.md) and the historical [OpenSpec checklist](../openspec/changes/update-habit-chain-lifecycle/tasks.md).

- [x] After two full missed dates, archive only the affected habit, preserving history/progress. Reconcile on reads/actions even if the server slept; cron is not required for correctness.
- [x] Atomically disconnect its attached reciprocal chains and invalidate outstanding invites. Apply the same lifecycle operation to manual archive; preserve unrelated habits and relationships.
- [x] Revalidate both habits during invite acceptance. Archived/private habits and stale links cannot create connections or receive support. Replace the old three-day DORMANT behavior with the agreed two-day rule.
- [x] Restore with a fresh inactivity anchor and restarted current streak. Require explicit new acceptance to reconnect; existing unique rows must not block legitimate re-invitation. Completed finite goals must not inactivity-archive while awaiting the user's choice.

**Acceptance:** Monday complete, Tuesday/Wednesday missed → archived Thursday 00:00, including after server sleep. One missed date stays active. Multi-partner archive, simultaneous completion/invite, manual archive and restore/reconnect preserve unrelated data and do not immediately rearchive.

### T04 — Make Chain and hearts quiet and minimal ([#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59))

**Scope:** backend reactions, shared response types, frontend Chain service/cards and habit support summary. Depends on T02/T03.

**Status:** **implementation done**, confirmed by the owner, committed/pushed as `9066570`. Backend changes are included in Live `952f5f3`; the allowance-ledger migration was rehearsed/applied and backend Chain tests passed. The frontend implementation is committed; the remediation did not separately prove its deployed SHA, installed-PWA freshness or visual/runtime acceptance. See the historical [T04 handoff](t04_review_handoff.md), [OpenSpec checklist](../openspec/changes/update-quiet-chain-hearts/tasks.md) and the later release evidence above.

- [x] Replace the retry-sensitive heart toggle with an idempotent send. Enforce one sender/recipient-habit/recipient-day allowance across links and return the viewer's own aggregate received count plus sent state.
- [x] Replace named support paragraphs/toasts with a heart; show a numeral only above one, with an accessible count description. Daily expiry follows the recipient habit's day.
- [x] Keep Chain cards to partner/habit identification, one restrained current state, heart action and secondary menu. Remove redundant status text, alarm-like pulses, obsolete nudges and Coming Soon clutter.
- [x] Keep invitations easy to find, details/disconnect reachable, and active relationships separate from history. Never expose partner streaks or rank popularity.
- [x] Keep confirmed-save behavior: deduplicate in-flight sends to the same target, expose retryable inline errors and reject stale/session-mismatched responses. Expire cached received/sent state using server boundaries; refresh on foreground/reconnect and pause hidden-page polling.
- [x] Add/backfill `chain_hearts` in the release migration and extend production schema readiness. Verify the migrated ledger's unique key, index and cascade FKs, migration checksums and zero drift. The verified snapshot had no old heart rows, so nonempty backfill semantics are still a fixture-based check below.

**Focused checks still required, without reopening completed T04 implementation:**

- [ ] Run frontend Chain service/card, habit support summary, store/session and relevant Mero/onboarding regressions and frontend production build; record the standard commands and outcomes. Run strict OpenSpec validation for quiet hearts and lifecycle.
- [ ] With two supporters and a recipient (three independent test identities), verify anonymous count 2, single-heart no-numeral display, accessibility labels and no partner popularity/streak leakage. Verify own-habit support agrees between dashboard and Chain.
- [ ] Use real PostgreSQL to race same-sender/same-target sends and duplicate links: one allowance, stable original timestamp and no retry undo. Race send against archive/private/disconnect; preserve unrelated users/habits.
- [ ] Verify different sender/recipient zones, Tehran midnight, DST, open-PWA overnight, offline/resume/reconnect and device-clock changes. Check sent and received expiry against their respective recipient calendars.
- [ ] Disconnect and explicitly reconnect on the same date: old visible support stays cleared, consumed allowance stays consumed, and a new recipient date permits a new heart. Exercise slow/failing send+refresh and account switching; cached/stale support must not return as confirmed.
- [ ] On a separate disposable fixture copy, include persisted hearts, duplicate links, null/toggled-off timestamps and UTC/Tehran/DST recipients; validate distinct ledger keys and earliest-time backfill without losing original fields. The October 18 zero-connection snapshot does not cover these cases.
- [ ] Review empty/multi-partner cards at 320/390 px, desktop PWA, short windows, both themes and 200% zoom; include keyboard details/disconnect and discoverable invite/QR actions.

**Acceptance:** two supporters produce the right count; duplicate links, retries and simultaneous requests do not inflate or undo support. Reload/day rollover is consistent; stale disconnected/private/archived targets reject new hearts. Empty and multi-partner layouts remain clear.

### T05 — Ask and deliver a disconnect reason ([#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60))

**Scope:** disconnect API/transaction, durable recipient event and compact frontend reason/receipt UI. Depends on T03; integrates with T04's menu.

**Next feature task.** Reuse T03's ordered locking/detach operation and T04's existing disconnect menu. A private disconnect receipt is new work; it must remain separate from anonymous received-heart aggregates and the durable daily allowance.

- [ ] Ask for a reason with Cancel and a recipient-visible preview. Offer simple choices including “Prefer not to share”; personal explanation is optional.
- [ ] Persist one private reason event atomically with reciprocal disconnection. It remains available after the relationship disappears from active queries and after the recipient returns offline.
- [ ] Restrict access to the intended participants; safely render any bounded optional text. Retried requests create one event. Automatic archive uses a neutral system reason.
- [ ] Preserve T04 behavior when clearing visible support: do not delete/refund the allowance ledger, revive old hearts on reconnect or expose supporter identities through the reason event. Capture the intended receipt before the relationship disappears from active queries.

**Acceptance:** cancel changes nothing; manual disconnect updates both sides and the partner receives the chosen reason once. Verify offline return, retries, multiple relationships and account deletion. No chat, email or push infrastructure is needed.

### T06 — Make the day-21 named color durable ([#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61))

**Scope:** profile/Mero customization, server-backed preferences/earned milestone and migration. Depends on T02 and the reward interpretation.

- [ ] Confirm the qualifying rule before implementation: recommended one habit at 21 consecutive days with permanently earned entitlement. Keep completed-day totals, current streak and an already-earned reward distinct.
- [ ] Unlock a custom color/name from one qualifying habit; do not combine shorter habit streaks or count app visits. Mero's name stays fixed.
- [ ] Persist entitlement and selected color/name with validation and account isolation. Keep an earned reward after missed days/archive, and recover it on another device.
- [ ] Migrate existing local color preferences without trusting local eligibility. Keep the studio compact; check existing badge eligibility against real connection/support events while updating shared reward consumers.
- [ ] Integrate color persistence with the currently shipped Three.js Mero and static/fallback representations. Preserve Mero's fixed name; name the selected color only. Use the same backup/rehearsal/release-wrapper discipline for any new schema addition.

**Acceptance:** day 20 stays locked, qualifying day 21 unlocks, and a later miss/archive does not revoke an earned reward. Login/device change restores it; invalid values and failed saves do not corrupt preferences. Treat 21 days as a product milestone, not a habit-formation claim.

### T07 — Explain daily rules and make returning easy ([#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62))

**Scope:** contextual copy, create/edit habit, Journey/history, archive and return states. Integrates T02–T06.

**Already available:** T02/T03 supply calendar/lifecycle state and restore behavior; T04 supplies quiet support and expiry. Focus this task on clear explanations, cross-view consistency and the next action, rather than implementing those backend rules again. Final reason/reward wording depends on T05/T06.

- [ ] Briefly explain timezone/daily reset, Endless/Custom meaning and the two-missed-day archive rule where a habit is created. Add a short contextual hint at first miss/archive/heart/unlock; keep help discoverable without repeating onboarding.
- [ ] One missed day: allow today's step, then show streak 1 without catch-up debt. Longer absence: show preserved history and one clear Restore action; do not automatically revive habits or reconnect people.
- [ ] Keep dated history, cumulative completions, current streak and earned rewards consistent across active/archive/Journey views. Use actual completion dates for calendars.
- [ ] Preserve an incoming invite through signup/login and keep the solo journey complete. Keep “why” private and secondary.

**Acceptance:** a new user, daily visitor, user after one miss and user returning after weeks can identify the next action unaided. Dates/history agree across views and devices. No new coaching system, extra daily ritual or celebration overlay is required.

### T08 — Reduce startup and access friction within a free budget ([#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63))

**Scope:** current Pages proxy, Render/Neon request path, authentication reachability, loading/retry and foreground refresh.

**Already completed elsewhere:** the timezone-contract/release failure is resolved under T00. T04 pauses hidden Chain polling, deduplicates target heart sends and guards stale/session responses. These changes are implementation evidence, not measured proof of reduced cold-start latency. Retain them and test the remaining refresh/request path.

- [ ] Measure warm and idle first-action latency separately for API, database and auth provider, on representative desktop/mobile networks and with/without proxy where feasible. Keep private account data out of measurements.
- [x] Pause hidden Chain polling and add T04's target-send/session guards; keep these completed changes when improving access behavior.
- [ ] Measure/verify foreground refresh deduplication and overlapping requests across dashboard, Chain and session recovery. Improve remaining waiting/retry states while preserving input and confirmed-save behavior; do not mark every request path covered by the heart-send guard.
- [ ] Only if startup remains a material blocker, run a bounded Workers + existing database experiment with representative auth, hashing and transactional writes. Compare free quotas, compatibility, actual latency and maintenance cost.
- [ ] Record keep/migrate decision. Recheck provider limits first; retain the working stack unless the experiment demonstrates improvement. No provider rewrite, keep-alive service or paid plan is assumed.

**Acceptance:** identify the real delay and show a measured improvement or a clear reason to keep the current stack. A new host must preserve auth, transactions and data recovery; no promise of zero warm-up from a hello-world test.

References for implementation: [Render Free](https://render.com/docs/free), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Neon scale to zero](https://neon.com/docs/introduction/scale-to-zero). Email signup/reset may only be offered as a fallback after actual delivery capability is confirmed.

### T09 — Verify the complete experience with two real accounts ([#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64))

**Scope:** focused regression/integration tests, deployed browser/PWA acceptance and the next small human test. Depends on completed product tasks; T08 migration is not mandatory.

**Evidence already available:** 124 backend tests, production-mode substituted-dependency auth checks, real migration/preservation/schema checks, observed automatic deployment and live direct/proxied contract probes. Reuse the October 18 record; these do not cover frontend tests, real-provider success or multi-account UI/races.

- [ ] Make the checked-in backend Jest/CI command handle ESM `@nestjs/passport` (or otherwise resolve the compatibility issue), then record an unmodified standard-command result. Do not report the temporary override as a passing CI run. Record frontend test/build and OpenSpec results separately.
- [ ] Verify real signup/login, stable identity, sign-out/in, reload, invite-led signup, solo/public habits and reciprocal Chain acceptance using two independent browser sessions.
- [ ] Cover midnight, one miss, two misses, long absence, restore/reconnect, finite goal, day 21, multiple hearts and reason delivery. Use a controlled clock for arithmetic and real PostgreSQL for transaction/race checks; distinguish simulated dates from observed days.
- [ ] Verify slow/unavailable API, retry, expired session and account switch. Check deletion with disposable accounts, old-token denial and preservation of the other user's data. Confirm an updated PWA receives the new UI without losing in-flight work.
- [ ] Record tested frontend/backend revisions, migration names, commands, outcomes and defects in a durable acceptance record; link sanitized evidence. Keep secrets, tokens, account dumps and private backups out of version control. Use the existing [test handoff](v1_test_and_release_handoff.md) and [database procedure](database_migration_procedure.md) for relevant setup/recovery.
- [ ] Exercise recovery on a disposable populated branch, including connecting the previous compatible backend and verifying data after switching/restoration. The retained recovery snapshot and successful copy comparison are prerequisites, not a completed failover/rollback drill. Agree retention/cleanup of recovery branches after acceptance; do not discard the recovery branch merely because the temporary rehearsal expires.

**Acceptance:** the core journey and requested return/support rules work in the intended environment; desktop installed PWA and mobile layouts pass. Untested paths stay explicit. A successful build or unit count alone does not prove acceptance.

## Next actions and remaining T00–T04 acceptance

The release build, all three production migrations, preservation/checksum/default/index/drift checks, backend suites and direct/proxied API identity/contract checks are completed. Do not repeat them as unfinished implementation. New releases still need their own targeted verification.

1. **Verify real authentication on the repaired release (T00/T09).** New Google account, returning Google account, existing UTC profile, cross-device timezone preservation and invite continuation through an updated PWA. Confirm email delivery/configuration before treating email/OTP as a tested fallback. No successful interactive flow has yet been recorded in this session.
2. **Close the standard-tooling and frontend evidence gap (T04/T09).** Fix the checked-in ESM/Jest compatibility path, run standard backend/frontend commands, record a frontend build/revision and validate the two OpenSpec changes. The successful override-based backend run remains valid evidence with its stated limit.
3. **Exercise the shipped daily/Chain behavior (T02–T04/T09).** Test midnight/DST, one/two misses, restore/reinvite, finite goals, account isolation and real PostgreSQL concurrency. Include three identities for two distinct supporters, same-day disconnect/reconnect, stale response/session changes and nonempty-heart backfill fixtures. These tests target the completed implementation; fix defects found without reopening already-verified migration execution.
4. **Complete visual/PWA review (T01/T04/T09).** Responsive/short-window/keyboard/zoom and both themes; installed-PWA update, open-overnight refresh and offline recovery; current Mero's animation/reduced-motion/fallback behavior. The latest onboarding/mascot changes need review, not another speculative redesign.
5. **Implement T05 → T06 → T07.** Add private disconnect receipts without altering heart allowances; settle/implement the durable day-21 color entitlement on the current Mero; then finalize contextual return/help/history copy. Check each task before progressing.
6. **Measure access friction and finish integrated acceptance (T08/T09).** Separate cold/warm latency from the repaired deployment failure. Keep the existing stack unless measured evidence supports a bounded alternative. Rehearse recovery/failover on a disposable branch, record remaining outcomes and defects, then invite the next small test group.

T04 is no longer a pending feature or an uncommitted review patch. Remaining heart runtime/visual checks, T05's private reasons and T06's durable reward are distinct work. Snapshot creation/preservation is complete; full recovery switching, nonempty-heart backfill and transaction races are still open.

## Scope and completion

The active roadmap contains these ten tasks (T00–T09) only. The existing Three.js Mero is already integrated; support and verify it within the current tasks rather than listing its integration as future work. New mascot/rendering expansion, articles, localization, charity/community features, analytics, flexible schedules, store distribution and broader redesigns remain outside this iteration.

Keep implementation changes small and reviewable, using the repository's OpenSpec workflow where behavior/schema changes require it. T00–T04 code is complete/pushed and the October 18 backend release/migrations are verified to the limits recorded above. Broader acceptance still requires the open checks. Future data migrations require a backup, rehearsal and rollback plan. This document update itself performs no build, test, migration, deployment, release tag, commit, push or external status synchronization.

GitHub tracking is historical context: tasks T00–T09 were previously mapped to issues ([#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64)), and obsolete/duplicate pre-pilot issues (#20, #44, #48–#54) were previously closed. Current issue/board states were not queried or changed for this update. The owner will handle any later synchronization from this local roadmap.
