# UI/UX discovery and prototype review — October 23, 2026

## Scope and approval contract

The owner's three mobile screenshots show the welcome/Mero palette, a long Profile
with inline username/password forms and raw `Cannot PATCH /api/auth/username`, and
an expanding badge list above settings. They are qualitative observations, not a
measured usability study or proof of the deployed backend revision. Do not commit
the screenshots' email/name/account data into fixtures or public design artifacts.

T20–T25 are analysis/design tasks first. The owner requested a visible result and
agreement before product implementation. For each task deliver: evidence and
problem definition; wireframes/options; a recommended direction with trade-offs;
then an independently viewable `index.html` prototype and a concise review checklist.
Store future prototypes under `design/ux/tNN-<topic>/`, with a README describing how
to open/run them and which data/interactions are simulated. These files do not
exist yet. Use synthetic users/data, no credentials, live API writes or analytics.
Prefer a self-contained HTML/CSS/JS preview without an app build. T25 may need a
local server for Three.js modules; document that single command and dependencies.

Use clickable flows, not just static swatches. Provide mobile-first 320/390 px,
short/landscape and desktop views, light/dark/system themes, keyboard/focus states,
readable contrast and reduced motion. Show loading, empty, success, conflict and
failure where relevant. Label simulated behavior honestly. Evaluate prototypes on
a phone as well as at desktop widths; record remaining device unknowns.

Record the owner's chosen direction/version and requested revisions in a decision
log beside each prototype. A completed prototype is not a completed app feature.
Create an explicitly approved implementation checklist/OpenSpec delta only after
review; do not migrate/deploy or modify production UI/API merely to demonstrate a
design. T21's immediate output is diagnosis, not automatic production repair.

## T20 — Design system, palette and Mero color direction

- Audit actual shared tokens, typography, spacing, radii, shadows, control states,
  cards, navigation and Mero materials/fallback. Identify inconsistent usage and
  contrast/hierarchy problems; do not assume every existing color must be replaced.
- Explore 2–3 distinct coherent directions against the existing baseline. Show each
  on the welcome screen, a habit card, Profile, buttons/forms and Mero, in both
  themes. Compare warmth, visual interest, readability and suitability for daily
  use; a fashionable swatch alone is not sufficient evidence.
- Separate brand/semantic colors, earned user-selected Mero colors and decorative
  effects. Keep Mero recognizable and named Mero; preserve earned color choices,
  user color names, moods and 3D/static consistency. Avoid color-only status cues.
- Deliver a switchable `index.html` comparison with token/component specimens and
  an approved token mapping/migration outline. No global CSS rewrite before review.

## T21 — Username failure diagnosis and account-edit interaction

- Reproduce availability and save separately. Record sanitized method/path/status,
  response class and frontend/backend build identities; inspect Pages proxy method
  forwarding, deployed controller routes, auth, pending migration/readiness and
  service-worker caches. The screenshot's `Cannot PATCH` suggests a missing route
  somewhere in the serving chain; it does not establish a username validation error
  or a confirmed root cause. Cross-reference T12/T17 and avoid duplicate migrations.
- Distinguish route mismatch, unavailable network/provider, expired session,
  invalid/taken name and stale availability results. Prepare a concrete repair
  plan for the real cause, separately from the visual redesign; any production
  migration/deployment must still follow the release gate.
- Prototype a compact view/edit/save/cancel flow and a deliberate, clearly named
  remove action. Explore an accessible icon/menu or secondary action instead of
  the current underlined action cluster; do not hide removal behind an unlabeled
  icon or make it easy to trigger accidentally. Show that removing a handle keeps
  email/Google access and account data; it is not account deletion.
- Avoid repeated `(optional)` labels. Mark required inputs with `*` plus accessible
  required semantics and a concise legend where needed. Explain an optional field
  only when it affects a decision. Keep real labels, errors and usable touch targets.
- Show pristine/dirty/checking/available/taken/saving/saved/removed/offline/expired
  states with actionable short messages instead of raw HTTP/framework text. Failed
  writes retain input; success follows server confirmation. Cover cancellation,
  concurrent claims and account-switch/stale responses in the implementation plan.
- Deliver a sanitized diagnosis report plus account-edit `index.html` state demo;
  simulated success is not evidence that username saving is repaired.

## T22 — Profile information architecture and full redesign

- Inventory identity, username/security, Mero, colors, badges, theme, version,
  logout and destructive account actions. Rank primary/occasional tasks and compare
  current scroll length to at least two wireframe structures on the same viewport.
- Move editing/security to deliberate subflows rather than permanently expanded
  forms. Present a coherent identity/companion summary, compact entry cards and
  clear hierarchy; fewer pixels alone must not make settings hard to find.
- Include a Badge card linking to T23's dedicated page and a compact color entry
  linking to T24's experience. Preserve system theme, update/help/version access,
  logout and account deletion. Isolate destructive actions from routine edits.
- Deliver a clickable Profile `index.html` with navigation/back, edit/cancel/error,
  keyboard-open and long-name states, plus measured before/after scroll and task
  access comparisons. Use T20's approved tokens and T21's account-edit contract.

## T23 — Dedicated Badge page and scalable discovery

- Replace the full Profile list with one tappable summary card (earned/total and
  selective preview); open a dedicated page with correct back/deep-link behavior.
- Prototype earned/locked details and understandable progress, plus many future
  badges (e.g. 30+) to demonstrate grouping/filtering only where useful. Include
  no badges, unavailable data, long titles and small-screen states.
- Preserve server/evidence-based earning rules, privacy and permanent milestones;
  visual mock badges must be marked as synthetic and must not invent shipped rules.
  Avoid shame-oriented locked copy and color-only differentiation.
- Deliver Profile-to-Badges `index.html` flow, route/state outline and owner choice
  before moving components or implementing new achievement APIs.

## T24 — 21-day milestone and color collection redesign

- Explore 2 alternatives for pre-unlock progress, the first earned color and later
  collection/studio states. Make the reward feel considered and attractive without
  forcing celebration, confetti, repetitive text or a permanently tall Profile.
- Retain T06's exact distinction: first slot from one habit's 21 consecutive days;
  later permanent slots from collection days or distinct accepted partners. Do not
  imply a global streak, reset earned colors or change thresholds as part of design.
- Prototype locked/near-unlock/newly earned/empty available slot/full collection,
  naming/edit/select/preview/save/cancel, failure/retry and reload-confirmed selection.
  Preserve arbitrary saved colors/names and separate preview from persisted choice.
- Show accessible controls/contrast in both themes, Mero 3D and static previews,
  readable progress without color dependence, and an optional reduced-motion
  celebration. Deliver clickable `index.html` plus an approved state/behavior map.

## T25 — Mero belly color interaction feasibility and prototype

- Clarify the intended experience with a simple 2D/canvas prototype first: a finger
  stirs/displaces the color inside Mero's belly and it settles attractively. Compare
  that with a cheaper shader distortion; full fluid simulation is not a requirement.
  Let the owner review feel/amplitude/settling before a Three.js experiment.
- If the direction is approved, build an isolated Three.js proof for welcome/login
  and Profile using the existing Mero silhouette, moods and selected/earned colors.
  Scope hit testing and pointer coordinates to the belly; color must remain inside
  it, with touch and mouse support. This is a local visual effect, not a color save,
  reward unlock, new account state or network write.
- Coordinate with T19: a belly drag must not accidentally zoom/navigate/activate
  controls or trap page scrolling. Define gesture ownership, drag release/cancel,
  pointer capture and multi-touch handling; outside the belly scrolling stays normal.
- Define measurable device/frame-time, load and memory budgets before the 3D spike;
  profile representative low/mid/high devices and long/repeated visits. Assess
  shaders/materials, DPR, resize, animation lifecycle and resource disposal rather
  than using device/GPU labels alone as a capability guarantee. Pause when hidden;
  handle context loss and performance drops without blocking input.
- Preserve reduced-motion preference, constrained-device/static/WebGL-failure
  fallbacks, existing moods and readable color appearance. No hover-only dependency
  or requirement to rub Mero to finish onboarding. Offer the same essential app
  functionality without the effect; reduced motion may use a still/simple response.
- Deliver simple `index.html` first, then a separately labeled optional 3D spike,
  performance evidence, fallback demonstration and a go/simplify/defer decision.
  Production integration requires owner approval of both appearance and cost.

## Recommended discovery order and release boundary

1. T21 diagnosis can start immediately alongside T20 audit; a broken save is a
   functional blocker, not a reason to wait for aesthetic consensus.
2. Review T20 directions, then T21 edit-flow options and T22 Profile wireframes.
3. Refine T23/T24 linked prototypes against the approved Profile/system direction.
4. T25 simple interaction can be explored independently; only commit to 3D after
   the visual direction and feasibility evidence justify it.
5. Agree each implementation scope/version separately. T12–T19 remain active;
   add approved redesign implementation work to the candidate gate explicitly.
   T25 is exploratory P2 and does not silently block v1. Other design packages are
   P1 for discovery; no unseen redesign is treated as approved release scope.
