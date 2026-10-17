# T01 review handoff

Implementation is in the working tree for owner review. No commit, push, deployment,
build or test run was performed. T01 acceptance remains pending.

## Changes

- One centered 34rem (544 CSS px at the default font size) shell for all routes.
  Navigation, add action and notices share its viewport anchors. Dialogs stay within
  that width, scroll in short windows and respect safe areas. Mobile zoom is enabled.
- Habit cards show the habit title, its own streak, a quiet finite target count and
  one daily action. Category, reminder, sharing, why and management actions live in
  keyboard-accessible details. Global dashboard streak, modulo week dots and the
  Endless progress bar were removed.
- Completion is immediate to request, disabled while that request is pending and
  confirmed by the existing store before showing one check with “Completed”. A
  failed request leaves an inline error and retry action on its habit card.
- Mero has a static image/glow and a fixed name, including surrounding profile
  links and the connection notice. Named-color storage keys and saved values are
  retained. Local color saves now report validation/storage errors without claiming
  success; server-backed eligibility and reward durability remain T06 work.
- Onboarding describes Endless/Custom and uses neutral account copy. Its content
  scrolls naturally instead of being clipped to a fixed viewport height.
- Dialogs support Tab containment, Escape and returning focus to their trigger.
  Habit forms retain their input on failure and prevent closing/editing during save.
  Existing tests for removed animation/nickname APIs were adjusted, without running them.

## Owner acceptance still needed

- Dashboard, Chain, Journey, Profile and onboarding at 320/390 CSS px, wide desktop,
  maximized installed PWA, short windows, light/dark themes and 200% zoom.
- Dialog scrolling, visible actions with the keyboard open, safe areas and keyboard
  focus behavior. Check long habit/account names and several habits/connections.
- Slow/failed completion: no early check, duplicate clicks stay disabled, retry works,
  and completing one habit does not disable another habit's daily action.
- Failed new/edit habit saves keep form input; blocked local storage does not show
  glow-save success. Existing named colors survive reload and account switching.

T02–T09 behavior, backend/schema changes and the release workflow are outside this change.
