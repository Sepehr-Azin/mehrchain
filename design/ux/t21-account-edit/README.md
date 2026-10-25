# T21 — Username diagnosis and account-edit study

October 25, 2026 (Asia/Tehran). Prototype **01**. Owner review pending.

## Priority and scope

The roadmap places the matching production release (T12) first, followed by CI,
email delivery and the remaining release gates. T21 is the first independent
discovery task: a broken username save is a functional blocker, and its diagnosis
does not depend on T20's palette decision. T14's last recorded owned-domain
prerequisite and T19's device acceptance cannot be completed by an HTML change.

This package diagnoses T21, compares two account-edit flows and prepares a repair
plan. It does not implement a production redesign, deploy T17 or apply migrations.
The roadmap explicitly requires owner review of the diagnosis and interaction
before repair/production UI work. Existing uncommitted T19 changes are outside
this package; the shared roadmap was already modified and is left untouched.

## Verified diagnosis

**The currently serving backend lacks both username routes.** With the owner's
active system proxy, independent direct Render and Pages probes reproduced the
missing routes at **18:19:54 Tehran / 14:49:54 UTC**, October 25:

| Target | Method/path | HTTP | Sanitized result |
| --- | --- | --- | --- |
| Direct Render | `GET /api/version` | 200 | `c8d193d89b264d8a7bab30b042a4ef10b49bf57c`, `builtAt: 2026-10-21T17:49:51.639Z`, `account-timezone-v1`; `Cache-Control: no-store` |
| Pages proxy | `GET /api/version` | 200 | Same backend revision/build/contract and cache policy |
| Direct Render | `GET /api/auth/username-availability?username=t21_probe` | 404 | JSON `Cannot GET /api/auth/username-availability?username=t21_probe` |
| Pages proxy | Same availability GET | 404 | Same missing-route response |
| Direct Render | `PATCH /api/auth/username` | 404 | JSON `Cannot PATCH /api/auth/username` |
| Pages proxy | Same PATCH | 404 | Same missing-route response |

Hosts: `https://mehrchain-api.onrender.com` and
`https://mehrchain.pages.dev`. PATCH probes used `{}` without Authorization;
no account credentials, real username or account data were sent. They returned
missing-route responses, not successful writes. Availability and save were
probed separately. No production account/data mutation occurred.

Before the proxy was enabled, sandbox probes failed DNS resolution; an external
retry encountered Pages connection resets and Render connection timeouts. Those
transport failures provided no HTTP/route evidence. The subsequent successful
proxy probes above supersede that uncertainty; they do not measure target-phone
performance or cold starts.

### Why this is a release mismatch

- `git show c8d193d:apps/mehrchain-backend/src/app/auth/auth.controller.ts`
  confirms the serving revision has `GET auth/me` but neither username route.
- Current source includes guarded `GET auth/username-availability` and
  `PATCH auth/username` in the same controller. They were introduced in
  `9a4329f9ac4f679d5b1e3baf28c10dfa44313ffa` (T17). On this source, a request
  without valid authentication should reach the guard and return 401, rather
  than the observed missing-route 404.
- Both checked-in Pages functions forward PATCH, original path/query, auth
  headers, request body, upstream status and cache headers. An isolated Node
  execution of **each actual function**, using a mocked upstream, verified all
  seven properties for a synthetic PATCH. A Node-only Request adapter supplied
  `duplex: half` for streams; this was test-harness compatibility, not a proposed
  Workers code change. No live upstream was contacted by this check.
- Independent direct Render responses establish that the missing backend route
  exists even without Pages or a browser service worker. A proxy rewrite, input
  validation change or cache clear cannot add the missing controller routes.
- `docs/t17_review_handoff.md` records the optional-username migration as rehearsed
  on a disposable copy only. This is historical migration evidence, not a fresh
  query of production. A newer deploy could have failed readiness, but that cause
  is **not established** without current Render deployment logs and migration
  history. Do not infer production schema state from the current 404 alone.

### Frontend identity and cache boundary

Fresh network reads (no browser SW) returned HTTP 200 for Pages `/` and
`/ngsw.json`. The index loads **`main-U35TMMRX.js`**. The SW manifest reports
`appData.version: 1.0.0-rc.4`, timestamp `1792859049985`, index hash
`d92f6c76d8f2891a2d31eec5a75c4818ecefef06`, and the same main asset. These are
frontend artifact identifiers, **not an independently verified frontend Git SHA**.
Obtain the Pages deployment SHA from its deployment record before releasing.

The current `ngsw-config.json` has no data cache groups. Availability requests in
`AuthService.usernameAvailability` explicitly use `ngsw-bypass=true`; profile
reads bypass it too. The current service checks the account ID and token before
applying a username update, and the component cancels obsolete availability
subscriptions. An older installed PWA can still serve an older asset bundle;
its update/reload path and exact assets need separate browser/device acceptance.
That cannot explain the direct Render 404 observed here.

## Repair plan (review before execution)

1. Inspect the current Render failed/live deployment records and privately match
   the actual production database target. Obtain Pages' frontend Git SHA and
   check both revisions against the reviewed T17 code; do not equate the version
   string with a Git SHA.
2. Read production migration history and schema, particularly
   `20261021000000_optional_usernames`, its case-insensitive unique index,
   provenance/session fields and password-reset table. Compare to the exact
   candidate. T05/T06 already have recorded production application; never replay
   or re-resolve them merely to fix a missing username route.
3. Run the candidate's current automated checks/builds. Take a fresh restorable
   snapshot of the populated target and repeat T17 rehearsal on a disposable
   copy, preserving original rows, IDs, timezones, logs, habits, Chains, hearts
   and permanent earned colors. Verify case collisions, multiple nulls,
   concurrent claims, repeat deploy and recovery. Retain the expression index.
4. With owner-approved release scope, stop incompatible old writers; apply only
   verified pending reviewed migrations through `scripts/release-migrate.cjs`.
   Generate the matching Prisma Client, deploy the compatible backend, and
   verify all twelve readiness probes and its exact `/api/version` identity
   before deploying the matching frontend. Follow
   `docs/database_migration_procedure.md` and the T17 rollback constraints.
5. Direct and proxied availability/PATCH probes without a token must reach auth
   guards (401). Then use an owner-designated test account to separately verify
   availability and successful save, and confirm the saved value via a fresh
   `/auth/me` read/reload. Cover invalid (400), expired (401), concurrent/taken
   (409), rate-limit (429), unavailable (503), transport and missing-route cases.
   Authenticated acceptance is **not performed** by this diagnosis.
6. Exercise cancel/removal and identifier login, account-switch/late responses,
   reload and installed-PWA update. Email/Google access, account ID and progress
   must survive handle removal; an old handle must stop resolving to the old
   account. T14's actual mail-delivery prerequisite stays open independently.

No new migration is proposed by T21. UI error mapping is a separate reviewed
change: distinguish missing-route/service failure from validation/conflict,
network, expired session and rate limits; do not expose framework/HttpErrorResponse
text to users. Availability is advisory and a write can still conflict.

## Open the prototype

Open `index.html` directly in a browser: no build, dependencies, external fonts,
API calls, analytics or credentials. Or serve only this directory from the repo:

```powershell
python -m http.server 4318 --bind 127.0.0.1 --directory design/ux/t21-account-edit
```

Visit `http://127.0.0.1:4318`. Any available static server can be used instead.
The running review server, if present, already uses that port; do not start a
second one there. README/decision links are Markdown files, displayed as text by
a simple static server. Reload resets the synthetic data; nothing is persisted.

### Wireframes and alternatives

| View | A: dedicated edit (recommended) | B: inline card |
| --- | --- | --- |
| Account | Identity → Username summary + Edit | Same summary |
| Edit | Back → Username heading → label/input → availability → Cancel/Save → separate Remove | Identity → expanded Username card with the same actions |
| Remove | Back → explicit consequence → Keep / Remove username | Same confirmation inside Account |
| Success | Summary with confirmed handle and short feedback | Same |
| Failure | Draft stays in edit; short actionable error | Same, with a taller Profile |

A gives keyboard input/errors their own space and keeps Profile compact. B saves
a navigation step but lengthens Profile while editing. Both use ordinary labeled
buttons, not an unlabeled removal icon. The edit field has no required marker
because the account's username is optional; an empty field never silently removes
an existing handle. These screens contain no required account fields.

Use the scenario picker for available/saved, taken, concurrent claim, offline,
expired, missing route, slow, server failure and rate limit. Pristine, dirty,
checking, invalid, saving, cancelled, saved and removed states are reached by
normal controls. Change back to success and retry the retained draft. Removal
has its own confirmation and failure path. Switch accounts during a slow write
to invalidate its late result; account switching intentionally clears the prior
account's draft. Theme supports system/light/dark. Long-name and no-handle
fixtures are synthetic. Pattern selection does not save or discard an edit.

The neutral study palette is provisional and does not change shared tokens or
choose T20's final direction. Mero, earning rules and account security are outside
this interaction study. Owner decisions are recorded in `decisions.md`.

## Verification and remaining acceptance

- Existing backend `account-access.spec.ts`: **12/12 passed** locally using Jest
  with the repository's existing config. Includes optional signup, availability,
  atomic conflict, removal identity and password challenge/session contracts.
  Mocked unit tests do not prove production schema/delivery or full-suite health.
- Both real Pages function sources passed the isolated forwarding checks above.
- Existing frontend `username-settings.spec.ts`: **3/3 passed** through the
  normal Nx/Angular test target, covering stale availability, atomic save
  conflict/draft retention and account-switch write isolation. No product source
  or fixtures were changed to make these checks pass.
- Live direct/proxied routes reproduced the same old backend identity and 404s.
- Prototype browser checks: conflict after advisory availability retained the
  draft; switching back to success and retrying produced confirmed synthetic
  success. Separate removal confirmation and its consequence text were checked
  at 320 px in light mode. Inline editing/offline write failure, cancellation,
  account-switch invalidation of a slow availability response, long-name layout
  and keyboard Tab navigation were exercised. At 320×740, 390×844 and 844×390,
  document width was respectively 305, 375 and 829 px (the 15 px scrollbar
  accounts for the difference), with no horizontal overflow. Both themes were
  inspected. These are desktop responsive checks, not physical-device evidence.

Still required: current Render logs/database history, verified frontend Git SHA,
authenticated live save/read/removal and device/PWA checks. Physical phone,
keyboard-open, text settings, safe-area, browser back and installed-SW behavior
are not established by a desktop viewport preview. Production implementation
and its end-to-end acceptance are not completed by this package.

## Pull-request handoff

Only these three new files belong to this change: `index.html`, `README.md` and
`decisions.md` in `design/ux/t21-account-edit/`. No existing product or roadmap
file is part of this change. The owner commits manually; no commit has been
created by the agent.

Suggested title: **T21: diagnose username route mismatch and prototype account editing**

Suggested description:

> Username availability and saving currently return 404 on both direct Render
> and Pages because production serves c8d193d, before T17's username routes.
> Record sanitized live evidence and the gated migration/deployment repair plan;
> add a self-contained, synthetic comparison of dedicated and inline edit flows
> with explicit removal and pending/conflict/retry/session states.
>
> Validation: existing backend account-access tests 12/12; frontend username
> tests 3/3; both proxy function forwarding checks; live route probes and
> 320/390 px plus short landscape browser review. Owner design review, current
> production schema/log inspection and authenticated/device acceptance remain
> pending. This PR does not deploy the repair or change production UI/API.
