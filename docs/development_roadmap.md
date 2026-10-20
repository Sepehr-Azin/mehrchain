# MehrChain — Next iteration

> Updated: **2026-10-20 (Asia/Tehran)**. No committed deadline.
> Goal: a small, reliable daily habit experience with quiet support and a kind return.
> The owner reports a mostly successful two-person signup/Chain pilot, with proxy and server warm-up friction. Multi-day behavior and full acceptance still need testing.
> T00–T05 implementation is committed and pushed. T04 is in `9066570`; T05 is in `ed38dd6`, verified against the remote `main` ref on October 19. T05 deployment, migration execution and runtime acceptance are **not verified**; do not infer them from the push.
> T06 scenario C is implemented locally on October 20 and remains uncommitted in Changes for owner review. Its roadmap contract was recorded first. No T06 builds, tests, typecheck, Prisma generation/validation, migration/rehearsal, database operation or deployment was performed.
> On October 18, the production timezone-contract failure was reproduced and fixed, all three pending release migrations were rehearsed/applied, and backend `952f5f3` became Live. Backend tests passed; remaining interactive, frontend/PWA and PostgreSQL race checks are listed explicitly below.
> Tasks retain their existing issue mappings #55–#64. The October 19 update records T05 implementation and its actual commit/push; the October 20 update records the selected T06 contract and local implementation with separate release prerequisites. GitHub issues and the project board were not inspected or changed. Earlier handoffs/checklists remain historical.

## Product rules

People should have room to grow through choice, small steps and real support. A solo user gets a complete experience; Chain is optional. Keep progress private, avoid comparison and preserve earlier effort after absence.

- **Daily habits:** Endless or Custom N completed days. A new calendar date opens the next completion; creating a habit at 08:00 must not impose an 08:00 reset.
- **Per-habit streak:** no global streak. After one missed date, the next completion starts at 1; cumulative progress remains.
- **Two missed days:** archive that habit after two fully missed consecutive dates and disconnect its attached chains. Opening the app or completing another habit does not count. Restore preserves history and requires a new invitation to reconnect.
- **Quiet support:** one heart action, received support without names, a number when multiple hearts arrive. No reaction feed or partner streak comparison.
- **Respectful disconnect:** ask a reason, preview what is shared and deliver it privately to the partner. Include a non-disclosing choice.
- **Mero:** fixed name. The current implementation uses adaptive Three.js rendering with animation and static/fallback behavior; the original static-only T01 direction has been superseded in code by `31e965f` and `657eab1`. T06's local implementation applies the selected named color to the existing 3D/fallback mascot, with permanent slots and optional habit/accepted-Chain progress paths. Preserve motion/device safeguards and keep names attached to colors.
- **Minimal UI:** one primary action per card, one completion check, secondary information in details. Desktop PWA content stays compact even in a maximized window.
- **Honest feedback:** confirm saves before showing success; preserve input and allow retry on failure. Use short English copy, accessible controls and restrained feedback.

Implemented in T02/T03: persisted account IANA timezone; no missed-day penalty for a partial creation/restore date; Custom counts completed days; finite goals offer Continue or Archive when reached. Existing accounts/history retain UTC, and signing in or changing device timezone does not change an account's zone. The October 18 migration preserved those historical fields and UTC defaults. On October 20 the owner selected T06 scenario C: first earn a permanent color slot through one 21-day habit streak, then earn more shared slots through completed account dates or distinct accepted Chain partners. The precise contract is recorded under T06 below; this is not a global streak or an obligation to connect.

Implemented in T04: one sender per recipient habit per recipient account date, regardless of multiple links. A send is idempotent and never toggles off on retry. Disconnect/archive/private changes clear visible support, but do not refund that day's allowance; reconnecting the same day cannot revive the old support. Sent state follows the partner habit's calendar; own received counts follow the own habit's calendar. T05 retains this distinction: disconnect receipts do not read or modify the daily allowance ledger.

Implemented in T05 (`ed38dd6`): an explicit manual reason, Cancel, private preview and optional 500-character plain-text explanation; one durable partner receipt in the reciprocal-disconnect transaction; generation tokens for safe reconnect/retry; neutral lifecycle receipts; a recipient-only pending inbox with explicit saved dismissal. Prefer not to share stores no explanation. These are implementation facts from source review, not executed acceptance results.

## Implementation order

**T00 → T05 are implemented and pushed; T06 scenario C is implemented locally in Changes.** Review T06 before commit/push and follow its own migration/client/release gate in addition to T05's still-unverified deployment gate. Verify the actual Render revision/status and database migration history before treating either change as running. T07 is the next feature implementation. Record outstanding real Google signup/returning-account and frontend/Chain checks separately. T08 can run independently; latency work does not reopen the repaired timezone contract or imply a provider migration. T09 combines the remaining acceptance scenarios with the later features.

`FE` = `apps/mehrchain-frontend/src/app`; `BE` = `apps/mehrchain-backend/src/app`. Task IDs map to GitHub issues [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64). Checked boxes record only the implementation or verification explicitly described. Completed implementation, a successful release and full human acceptance are separate states. T05 awaits release/acceptance verification; T06 awaits owner review and all execution/release checks; T07 remains feature work. T08 has some supporting behavior implemented; T09 remains incomplete.

| Task | Issue | Implementation | Commit | Status | Acceptance evidence in repository |
| --- | --- | --- | --- | --- | --- |
| T00 | [#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55) | Complete / pushed | `784d1ed`, release fix `952f5f3` | Production timezone blocker resolved | Matching live API revisions, HTTP contract probes and backend tests passed; real Google/OTP/PWA flows remain |
| T01 | [#56](https://github.com/farzad-bahadorifar/mehrchain/issues/56) | Complete / pushed | `cfaf0fd`; follow-ups `0e0bb54`, `657eab1` | Implementation complete | Mobile onboarding/input/Mero follow-ups committed; full responsive/PWA and failure-state review remains |
| T02 | [#57](https://github.com/farzad-bahadorifar/mehrchain/issues/57) | Complete / pushed | `9643bda` | Backend deployed; migration verified | Populated-copy rehearsal, production preservation/default/index/drift checks and backend tests passed; midnight/device/race checks remain |
| T03 | [#58](https://github.com/farzad-bahadorifar/mehrchain/issues/58) | Complete / pushed | `2f1cff1` | Backend deployed; migration verified | Lifecycle migration, preservation and backend tests passed; real restore/reconnect, PWA and PostgreSQL races remain |
| T04 | [#59](https://github.com/farzad-bahadorifar/mehrchain/issues/59) | Complete / pushed | `9066570` | Done per owner; backend deployed | Ledger migration/index/FK checks and backend tests passed; frontend, real supporters/day rollover and populated-heart backfill checks remain |
| T05 | [#60](https://github.com/farzad-bahadorifar/mehrchain/issues/60) | Complete / pushed | `ed38dd6` | Schema/deployment gate and owner acceptance pending | Source/diff and remote commit reviewed; no T05 build, tests, Prisma generation, migration rehearsal/execution or live verification performed in this chat |
| T06 | [#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61) | Implemented locally / uncommitted | Changes | Owner review, new schema/release gate and acceptance pending | Source/format/whitespace review only; no build, tests, typecheck, Prisma generation/validation, database operation or deployment |
| T07 | [#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62) | Pending | — | 📋 Ready | Pending implementation |
| T08 | [#63](https://github.com/farzad-bahadorifar/mehrchain/issues/63) | Partial supporting behavior from T04 | `9066570` | Measurement/retry work pending | Hidden polling pause and support request/session guards implemented; latency measurements and hosting decision remain |
| T09 | [#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64) | Partial verification evidence | Release `952f5f3` | Integrated acceptance pending | 124 backend tests, migration/release checks and live contract probes passed; frontend/real-account/PWA/race acceptance remains |

The T00–T05 handoffs and OpenSpec checklists are historical notes. Their uncommitted/not-run wording is superseded only where this roadmap records later evidence. In particular, T05's original uncommitted wording is superseded by the verified `ed38dd6` push; its unexecuted checks remain unexecuted in this chat. These historical files are not edited by this roadmap update. The October 18 backend results precede T05 and do not validate its code/schema or prove frontend/provider/race acceptance.

## October 19 T05 implementation and release gate

**Recorded evidence:** commit `ed38dd6d80b5ae60f821d4ddc9d2a59ef3ae1ba6`, `feat(chain): add private disconnect reasons and durable receipts`, exists on local `main` and matched GitHub's `refs/heads/main` during this update. The working tree was clean before this documentation edit. No new commit or push is performed by this update. The remote ref confirms code delivery to GitHub; Render/Pages deployment and database state were not queried.

| Area | Source-reviewed state | Execution boundary |
| --- | --- | --- |
| Prisma schema | New required `chain_connections.generationId`, new `ChainDisconnectReceipt` model and two User relation fields | No current database schema/history inspection or schema validation was run |
| New migration | `20261019000000_chain_disconnect_receipts`: backfill tokens from existing connection IDs; create receipts, unique/index/check constraints and participant cascade FKs | File prepared and pushed; application/rehearsal is not verified |
| Existing data contract | SQL changes no existing timezone, completion, habit-progress, invite or heart-ledger field; User relation additions do not add user-table columns | Actual before/after field preservation still needs a populated-copy rehearsal |
| Timezone repair | `users.timeZone`/UTC default, log `dayKey`/`timeZone`, timezone DTOs, calendar arithmetic and the earlier release migrations are unchanged by T05 | October 18 results remain historical; verify the matching new deployed revision before claiming current runtime success |
| Build path | `render.yaml` still installs dev build tools and invokes `build:backend:release`; that script explicitly generates Prisma Client before a fresh backend build; the Nx backend build also depends on Prisma generation | No T05 build or generated-client result is claimed; generation does not apply SQL migrations |
| Startup | Production readiness adds probes for generationId and receipt columns to the four existing probes | The new backend intentionally fails initialization against a database missing T05 schema; this affects backend availability, including auth, rather than only the Chain screen |
| Client/API compatibility | Disconnect DELETE now needs the reviewed generation and an explicit reason; both checked-in Pages proxies forward DELETE bodies | Old frontend bodyless disconnect fails validation; verify matching frontend/backend and installed-PWA refresh |
| Checks | Reason DTO, Chain/lifecycle, frontend service/card and six-probe readiness regression scenarios are added/updated; source review, formatting and Git whitespace review were performed | No build, typecheck, test suite, Prisma validation/generation, OpenSpec validation, HTTP runtime probe or migration was run for T05 in this chat |

### Required T05 release sequence

The October 18 fix established that build identity, API contract and database readiness must agree. **A push or successful Prisma generation alone does not establish that agreement.** The current Render build/start commands do not run migrations automatically. Automatic delivery was observed on October 18; whether the `ed38dd6` push triggered a deployment, and its outcome, are unknown here. If a new deploy fails readiness or an older revision remains live, inspect the actual revision/log/schema instead of treating the timezone contract as newly broken.

1. Inspect the actual Render deployment revision/status and the privately matched database's applied migration history. From the verified October 18 baseline the expected addition is the single T05 migration; confirm the actual target instead of assuming that baseline is still current. Do not replay the three already-applied October 17/18 migrations or re-resolve the baseline.
2. Take a fresh restorable snapshot of the **current** populated state. Rehearse the full pending release chain through the isolated wrapper on a disposable populated copy, including active reciprocal links and hearts. Compare every original row/field, account zones/UTC defaults, log day keys and heart allowances; inspect generation backfill, receipt constraints, deletion cascades, repeat deploy, drift and recovery. The older zero-connection/zero-heart rehearsal does not cover T05.
3. Coordinate a period with old writers stopped, then apply only the reviewed pending release migration(s) to the verified target through `node scripts/release-migrate.cjs deploy`, following the [database procedure](database_migration_procedure.md) and [T05 handoff](t05_review_handoff.md). The new `generationId` is NOT NULL; its Prisma `uuid()` default is generated by the new client, not a SQL default in this migration. An old backend creating connections can therefore fail after the schema addition; old reconnect/disconnect paths also cannot enforce the new receipt/generation contract. Do not leave old/new writers mixed.
4. Build/deploy the matching T05 backend using the existing release command, retaining `--include=dev` and Prisma generation from the canonical schema. Deploy the matching frontend and refresh installed PWAs. Keep build-time client generation and operator-controlled migration execution separate; changing only schema.prisma does not upgrade production.
5. Record successful startup, all required schema probes and the actual direct Render/Pages `/api/version` revisions. Require the deployed SHA to match the intended release (currently `ed38dd6`, or the recorded reviewed successor), retain `authContract: account-timezone-v1`, and confirm both auth DTOs still accept `timeZone` with strict unknown-field validation. Then record real Google/new/returning-account behavior and T05 receipt/retry acceptance separately.

No blanket runtime-safety claim is made without those outcomes. Do not use `db push`, reset the database, edit previously applied migration SQL, remove the readiness guard or add automatic production migrations to bypass a mismatch. A rollback to old code alone is not a complete plan because old creates omit the required token; rehearse a compatible corrective release or snapshot recovery with writes stopped. Preserve the original timezone recovery branch and take a new snapshot before this release; an older pre-T05 snapshot is not a backup of today's data.

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

**Status: implementation complete and pushed as `ed38dd6` on October 19; deployment/migration and owner acceptance remain unverified.** Reuses T03's ordered locking/detach operation and T04's existing disconnect menu. See [T05 handoff](t05_review_handoff.md), [OpenSpec checklist](../openspec/changes/add-private-disconnect-receipts/tasks.md) and the October 19 release gate above. The handoff's original uncommitted wording describes the implementation session; the later push is verified here. No T05 build, tests, migration or runtime check was run in this chat, at the owner's request.

- [x] Ask for a reason with Cancel and a recipient-visible preview. Offer simple choices including “Prefer not to share”; personal explanation is optional.
- [x] Persist one private reason event atomically with reciprocal disconnection. It remains available after the relationship disappears from active queries and after the recipient returns offline.
- [x] Restrict access to the intended participants; safely render any bounded optional text. Retried requests create one event. Automatic archive uses a neutral system reason.
- [x] Preserve T04 behavior when clearing visible support: do not delete/refund the allowance ledger, revive old hearts on reconnect or expose supporter identities through the reason event. Capture the intended receipt before the relationship disappears from active queries.
- [x] Add the required connection generation token; initialize existing rows from their IDs and replace the token on every explicit acceptance. Reject an old-generation disconnect after row reuse, while retries on an already disconnected generation create no new manual receipt.
- [x] Bound optional explanations to 500 characters, trim saved text, render with Angular interpolation and force null text for Prefer not to share. Capture only partner identification and the recipient's own habit title, without private partner habit/support details.
- [x] Capture neutral system receipts for active directions detached by automatic/manual archive, private edits and permanent habit deletion. Leave already disconnected historical rows without invented reasons; retain receipts independently of habit/connection deletion or reuse.
- [x] Add a recipient-only pending inbox (oldest 50), explicit idempotent saved dismissal and refresh of the next batch. Ordinary visits do not dismiss receipts. Guard stale/session-changing responses and preserve retryable input; do not store personal explanations in localStorage.
- [x] Cascade receipt deletion when either participant account is deleted. Add the release migration and two readiness probes; update focused backend/frontend/DTO/readiness regression source scenarios and the release/review documentation.

**Owner validation still required:**

- [ ] Complete and record the October 19 schema/client/backend/frontend release gate; a GitHub push is not migration/deployment evidence. Preserve the timezone contract and the October 18 dev-build-tools fix.
- [ ] Run owner-selected backend/frontend build, typecheck and regression checks after Prisma generation; run OpenSpec validation. Recheck standard Jest compatibility separately from the earlier override-based run.
- [ ] With two real accounts, cancel without writes; confirm one manual reason receipt and reciprocal removal; retry a lost response; return offline with no active chains; explicitly dismiss and verify the saved state on another session/device. Test more than 50 pending receipts.
- [ ] Exercise actual PostgreSQL races: same/opposite-side disconnect, heart, archive/private/hard delete and fresh reacceptance. Verify atomic rollback on receipt failure, no duplicate event and stale-generation rejection without losing unrelated links.
- [ ] Verify neutral automatic reasons, no-disclosure text suppression, literal HTML-like notes, the 500-character boundary, third-account isolation and deletion of either participant. Inspect surviving recipient-day allowances after same-day reconnection and remaining own-habit heart aggregates.
- [ ] Review keyboard focus/Cancel/Escape, mobile/desktop/both themes/PWA, polling while drafting, slow/failing saves, stale reads and account switches. Show success only after confirmation and keep actionable retry errors.

**Acceptance:** cancel changes nothing; manual disconnect updates both sides and the partner receives the chosen reason once. Verify offline return, retries, multiple relationships and account deletion. No chat, email or push infrastructure is needed.

### T06 — Permanent named-color collection with two progress paths ([#61](https://github.com/farzad-bahadorifar/mehrchain/issues/61))

**Scope:** compact profile/Mero collection, server-owned milestone/progress/preferences, completion and accepted-Chain integration, historical backfill and additive release migration. Depends on T02/T03/T04/T05. **Scenario C authorized and implemented locally October 20; uncommitted in Changes.** The owner requested the roadmap first, followed by implementation without builds, tests, commit or push. See [T06 handoff](t06_review_handoff.md) and [OpenSpec checklist](../openspec/changes/add-mero-color-collection/tasks.md). Source/format/whitespace review is complete; runtime, migration and release acceptance remain unexecuted.

**Product contract (implementation baseline):**

1. **First slot:** one habit reaches 21 consecutive completed account dates. Never add shorter streaks across habits or count app visits. Chain activity cannot bypass this first milestone. The milestone and every earned slot are permanent, including after a miss, archive, disconnection or habit deletion. Mero's name stays fixed; names belong to colors. The 21-day number is a product milestone, not a habit-formation claim.
2. **Habit path after unlocking:** each later account calendar date with at least one real completion adds one collection day, at most once per account/date across all habits. The unlocking date itself is excluded. Every 21 collection days earns the next slot; gaps pause progress without resetting it. This cumulative collection counter is separate from each habit's current streak and completed-day target. It introduces no global streak, catch-up debt or changes to finite-goal/restore rules.
3. **Optional Chain path:** the first distinct accepted partner reaches the second-slot target; three partners reach the third; five reach the fourth, then seven, etc. Count accepted relationships for both participants, never invites, public habits, hearts received or partner activity. Multiple habits, reconnects, retries and reciprocal rows with the same account count once. Historical real accepted relationships may contribute, including before day 21, but slots remain gated by the first milestone. New account identities cannot be proven to represent different humans; do not promise anti-Sybil protection or add invasive verification.
4. **Shared targets, not additive rewards:** capacity is zero before the milestone; afterwards it is `1 + max(floor(collectionDays / 21), ceil(distinctAcceptedPartners / 2))`. Both paths fill the same slot ladder. Meeting both second-slot targets still yields two total slots, not three. Example: 21 collection days OR one accepted partner gives capacity 2; 42 collection days OR three partners gives capacity 3. Show only the next target for each path. Social participation stays optional and no partner ranking/count is exposed publicly.
5. **Collection behavior:** the default glow is always available outside the collection. Each earned slot can store one validated six-digit hex color and a trimmed 1–30-character plain-text name. One saved color is active at a time; selecting the default, editing/replacing a slot and switching saved colors are free. Slots are permanent capacity, not consumable tokens or scarce hex values. No expiry, forced claim deadline, paid repair, exponential thresholds or deletion-based refund. Show empty earned slots without auto-creating invented colors.
6. **Persistence and isolation:** milestone, collection days, partner deduplication, capacity, saved colors and active selection belong to the authenticated account and survive device changes. Completion/acceptance rewards are written atomically with their source actions and deduplicated under concurrent requests. Later deletion/disconnection does not subtract earned counters. Deleting an account cascades its collection and private progress records; another participant's earned counter remains intact. Failed saves preserve the confirmed appearance and editable draft. Late responses from an old account/session cannot apply to a new one.
7. **Existing data:** backfill eligibility only from reliable server completion dates for one habit, and backfill distinct partners from real persisted connection records, including disconnected rows. Derive later collection dates from distinct account dates after the first qualifying date, not summed habit totals. Do not fabricate deleted history or infer connections from unaccepted invites. Import only valid account-scoped legacy local preferences, after server eligibility, without overwriting an already initialized server collection; locked local candidates remain available for a later retry. Never import local eligibility or ambiguously owned unscoped guest data.
8. **Presentation and release:** keep the collection compact, private and accessible; preserve the shipped Three.js Mero, animation/reduced-motion behavior and fallback, applying the confirmed color consistently. Never let custom colors reduce control/text contrast. Badge claims must use actual accepted connection/sent-support evidence. Prepare a new additive isolated release migration and readiness checks, with backup, populated-copy rehearsal, client generation and compatible rollout documented; do not execute a migration or deploy as part of this task.

- [x] Record the owner-selected scenario C and precise counting, permanence, shared-target and migration rules before implementation.
- [x] Implement durable server progress, historical backfill, account isolation and authenticated collection APIs.
- [x] Integrate atomic/idempotent completion and accepted-Chain progress without changing lifecycle/support contracts.
- [x] Implement confirmed collection saves, safe legacy import, compact next-target UI and actual-event badge eligibility.
- [x] Apply saved colors consistently to Three.js and fallback Mero; prepare focused regression scenarios and review/release handoff.
- [ ] Owner review and selected builds/tests, Prisma client generation, OpenSpec validation, populated-copy migration rehearsal/execution and matching deployment/acceptance. None was run in the implementation session.

**Acceptance (owner-run):** day 20 stays locked and a qualifying day 21 opens slot 1; two short streaks cannot substitute. After unlocking, multiple habit completions on one date add one collection day, gaps retain progress, and the unlock date adds none. The first/third distinct partner reaches capacity 2/3; reconnecting or another habit with the same partner does not advance it. Both routes reaching the same target never duplicate capacity. Existing colors, capacity and counters survive archive/disconnect/habit deletion and device change. Invalid/cross-account requests, concurrent source events, failed saves and stale session replies cannot corrupt state. Verify historical backfill, locked/imported preferences and account-deletion cascades separately. No runtime acceptance is claimed by source implementation alone.

### T07 — Explain daily rules and make returning easy ([#62](https://github.com/farzad-bahadorifar/mehrchain/issues/62))

**Scope:** contextual copy, create/edit habit, Journey/history, archive and return states. Integrates T02–T06.

**Already implemented:** T02/T03 supply calendar/lifecycle state and restore behavior; T04 supplies quiet support and expiry; T05 supplies reason/preview/private-receipt copy in `ed38dd6`; T06 supplies the local permanent collection and its shared habit/Chain targets. T05/T06 release/acceptance remain pending. Focus this task on clear explanations, cross-view consistency and the next action. Integrate the existing reason UI and T06 collection wording.

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

**Evidence already available:** the October 18 record contains 124 backend tests, production-mode substituted-dependency auth checks, real migration/preservation/schema checks, observed automatic deployment and live direct/proxied contract probes. These results predate T05 and do not validate `ed38dd6`, its migration or its new scenarios. T05 has source/format/whitespace review and a verified remote commit only; no new executed test count, production schema state or deployment identity is recorded. Frontend tests, real-provider success and multi-account UI/races still need separate evidence.

- [ ] Make the checked-in backend Jest/CI command handle ESM `@nestjs/passport` (or otherwise resolve the compatibility issue), then record an unmodified standard-command result. Do not report the temporary override as a passing CI run. Record frontend test/build and OpenSpec results separately.
- [ ] Verify real signup/login, stable identity, sign-out/in, reload, invite-led signup, solo/public habits and reciprocal Chain acceptance using two independent browser sessions.
- [ ] Cover midnight, one miss, two misses, long absence, restore/reconnect, finite goal, day 21, multiple hearts and reason delivery. Use a controlled clock for arithmetic and real PostgreSQL for transaction/race checks; distinguish simulated dates from observed days.
- [ ] Verify slow/unavailable API, retry, expired session and account switch. Check deletion with disposable accounts, old-token denial and preservation of the other user's data. Confirm an updated PWA receives the new UI without losing in-flight work.
- [ ] Record tested frontend/backend revisions, migration names, commands, outcomes and defects in a durable acceptance record; link sanitized evidence. Keep secrets, tokens, account dumps and private backups out of version control. Use the existing [test handoff](v1_test_and_release_handoff.md) and [database procedure](database_migration_procedure.md) for relevant setup/recovery.
- [ ] Exercise recovery on a disposable populated branch, including connecting the previous compatible backend and verifying data after switching/restoration. The retained recovery snapshot and successful copy comparison are prerequisites, not a completed failover/rollback drill. Agree retention/cleanup of recovery branches after acceptance; do not discard the recovery branch merely because the temporary rehearsal expires.

**Acceptance:** the core journey and requested return/support rules work in the intended environment; desktop installed PWA and mobile layouts pass. Untested paths stay explicit. A successful build or unit count alone does not prove acceptance.

## Next actions, T05 release gate and remaining acceptance

The **October 18** release build, three then-pending production migrations, preservation/checksum/default/index/drift checks, backend suites and direct/proxied identity/contract checks are completed historical evidence. Do not replay that migration chain or describe it as unfinished implementation. T05 is a later pushed schema change with its own unverified release gate; its production state must be checked separately.

1. **Establish T05 deployment/database state and complete its release gate (T05/T09).** Inspect the actual Render revision/status and pending migration history; take a fresh snapshot, rehearse populated-copy preservation/recovery, stop old writers, apply the reviewed pending addition and deploy matching generated-client/backend/frontend artifacts. Record results before calling T05 live. No production action is performed by this roadmap update.
2. **Verify authentication on the matching release (T00/T05/T09).** Confirm direct/proxied revision agreement and the unchanged timezone DTO contract; test a new Google account, returning Google account, legacy UTC profile, cross-device preservation and invite continuation through an updated PWA. Confirm mail configuration/delivery before treating email/OTP as a tested fallback. No new successful interactive flow is recorded here.
3. **Close the standard-tooling and frontend evidence gap (T04/T05/T09).** Resolve the checked-in ESM/Jest compatibility path, run owner-selected standard backend/frontend commands and record revisions/results. Validate the lifecycle, quiet-heart and private-disconnect OpenSpec changes. The successful October 18 override-based run remains historical evidence with its stated limit.
4. **Exercise daily/Chain behavior and private receipt delivery (T02–T05/T09).** Cover midnight/DST, one/two misses, restore/reinvite, finite goals, heart allowances/aggregates, T05 reasons/dismissal/offline return and account isolation. Include real PostgreSQL lifecycle/disconnect/reaccept races, three identities for two supporters, more than 50 pending receipts and nonempty-heart backfill fixtures. Fix defects without replaying previously verified migrations.
5. **Complete visual/PWA review (T01/T04/T05/T09).** Check responsive/short-window/keyboard/zoom and both themes; installed-PWA update, reason preview/draft/failure behavior, open-overnight refresh and offline recovery; current Mero's animation/reduced-motion/fallback behavior.
6. **Review/release T06 scenario C, then continue with T07.** Review the uncommitted collection, shared habit/Chain targets, safe imports, source transactions and additive migration. Follow [T06's separate gate](t06_review_handoff.md), retaining T05's pending release verification. Then finish contextual return/help/history copy using the implemented reason and collection rules. Record each task's own checks; no T06 execution success is claimed here.
7. **Measure access friction and finish integrated acceptance (T08/T09).** Separate cold/warm latency from contract/schema/deployment failures. Include the private-inbox and Mero collection requests in refresh measurements. Retain the existing stack unless measured evidence supports a bounded alternative; rehearse recovery/failover on a disposable branch and record remaining outcomes before the next small test group.

T04 and T05 are committed/pushed implementations; T06 is a local uncommitted implementation. T04's remaining runtime/visual checks, T05's unverified schema/deployment/acceptance gate and T06's unexecuted review/migration/release gate are distinct work. The October 18 snapshot/preservation record is complete to its stated limits; fresh populated-copy rehearsal for the actually pending release chain, recovery switching, nonempty-heart backfill and transaction races remain unverified.

## Scope and completion

The active roadmap contains these ten tasks (T00–T09) only. The existing Three.js Mero is already integrated; support and verify it within the current tasks rather than listing its integration as future work. New mascot/rendering expansion, articles, localization, charity/community features, analytics, flexible schedules, store distribution and broader redesigns remain outside this iteration.

Keep changes reviewable using the repository's OpenSpec workflow. T00–T05 code is complete/pushed; T06 scenario C is implemented locally and uncommitted. The October 18 backend release/migrations are verified to the limits recorded above; later T05/T06 release state has no execution evidence here. Every new migration requires a current backup, populated-copy rehearsal and compatible recovery plan. The October 20 session updated the roadmap first, implemented T06 and prepared source regressions/handoff, with source formatting and Git diff/whitespace review only: no build, tests, typecheck, client generation/schema validation, database operation, live HTTP probe, deployment, release tag, commit, push or external issue/board synchronization.

GitHub tracking is historical context: tasks T00–T09 were previously mapped to issues ([#55](https://github.com/farzad-bahadorifar/mehrchain/issues/55)–[#64](https://github.com/farzad-bahadorifar/mehrchain/issues/64)), and obsolete/duplicate pre-pilot issues (#20, #44, #48–#54) were previously closed. Current issue/board states were not queried or changed for this update. The owner will handle any later synchronization from this local roadmap.
