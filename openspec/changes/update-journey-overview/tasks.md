## 1. Planning

- [x] 1.1 Review screenshot and Journey/calendar/Chain source; record T11 in the roadmap.
- [x] 1.2 Apply the owner's subsequent request to implement T11 using the recommended Active Chains card and optional Support today line; leave Changes for owner review.
- [x] 1.3 Validate this proposal with `npm exec --yes --package=@fission-ai/openspec -- openspec validate update-journey-overview --strict` (passed October 20, 2026; application tests not run for this documentation-only change).

## 2. Implementation in Changes

- [x] 2.1 Place the compact header and three statistics before archive/help; retain cumulative completions and collection access.
- [x] 2.2 Reuse shared Chain lifecycle/count rules with independent loading, stale/error, retry and account-isolation handling.
- [x] 2.3 Compact calendar layout and add accessible date selection driving one grouped recent/date history list.
- [x] 2.4 Relocate archive/help, preserving explicit Restore, archive deep links, return shortcuts and existing shell safe-area clearance.
- [x] 2.5 Reuse anonymous own-habit aggregates once per habit, with recipient-day expiry and no stale display.
- [x] 2.6 Prepare focused Journey/calendar regressions for the owner's later execution; format and review changed source/diff without a build, test or typecheck.

## 3. Future verification

No build, tests, typecheck or new OpenSpec validation ran during implementation,
as requested by the owner. The earlier planning validation is historical only.
No commit, push, deployment or external issue/board sync was performed.

- [ ] 3.1 Verify completion/date/streak semantics, duplicate links/hearts, lifecycle updates, timezone/legacy history, partial failures and account switching.
- [ ] 3.2 Verify selected-date history, empty states and direct archive/restore navigation without fabricated events.
- [ ] 3.3 Review narrow mobile and desktop PWA, keyboard/focus, zoom, both themes and fixed-navigation clearance; record commands and outcomes.
