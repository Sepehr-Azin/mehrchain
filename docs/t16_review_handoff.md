# T16 minimal screens and direct deletion — October 21, 2026

Implemented locally under the owner's direct instruction to finish T12–T17 and
commit each correction. Existing lifecycle and daily-return deltas are updated
to the October 21 product direction; historical handoffs remain unchanged.

- Removed daily-rule/help panels, the Home archive-return banner and earned-color
  shortcut, repeated restore/dashboard links, Journey's progress essay and Profile's
  repeated timezone/collection explanation. Bottom navigation and Journey's archived
  list remain available.
- Optional Why controls are visible in onboarding, create/edit and Chain quick-create,
  with empty new state and an actual placeholder. Saved edit values are retained.
- Git history (`023b42d`'s parent) proves onboarding previously initialized Why to
  `To prove to myself that small steps matter.`. That exact family of known supplied
  samples and blank/whitespace are ineligible for reflection. Other reasons remain
  untouched; no database rewrite or additional motivation metadata was justified.
- Home's Delete now calls the existing permanent-deletion endpoint directly.
  Keep, Archive and Delete permanently are separate choices. A qualifying personal
  reason is visible before confirmation. Pending writes disable dismissal/choices;
  failures retain the dialog and habit with a retryable error. Archived deletion
  uses the same reflection without offering Archive again, with Restore left-aligned
  and trash at the right edge of each archived action row.
- Server ownership checks, ordered lifecycle detach, neutral disconnect receipts,
  invite cleanup and permanent Mero progress remain in their existing paths.
- T12 repaired the deployed collection route: direct/proxied unauthenticated reads
  now return 401 rather than 404. The collection UI keeps Refresh and shows a short
  retry error instead of raw route/provider output. No feature was removed.

Formatting/source/diff review only. Regression source adds sample/blank/custom
reflection, independent archive/delete and pending-choice checks. No local
build, unit suite, typecheck, PWA/phone visual acceptance or strict OpenSpec
validation was run. T09 still needs the exact deployed candidate, both themes,
phone widths, authenticated collection refresh, reload and failed-write flows.

## Owner scope clarification — October 22, 2026

The requested explanation removal targets the recently added expandable help
sections, not the established introduction. Restored the pre-T16 Why Walk Together,
Meaning of MehrChain and Connected Habit Chains templates, including their cards,
copy and next-step labels, plus the original welcome and invitation introduction.
The daily-rules accordion stays removed; the optional personal Why input remains
visible. No auth, habit or navigation behavior changed. Source/diff review only;
no local build or tests were run for this correction.
