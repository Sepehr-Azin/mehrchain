# Change: Keep Mero visually stable and simplify tab headers

## Why

Loading a CSS approximation before the Three.js character visibly changes Mero's identity. Immediate scene disposal also repeats initialization during navigation. Home, Chain, and Journey duplicate companion/profile and appearance controls already available in Profile.

## Approval

The user explicitly approved the first-frame, snapshot-cache, and delayed-release approach in this chat and requested removal of the redundant header controls.

## What Changes

- Reserve the existing square layout while loading; reveal the actual model and its glow together after a successful frame copy, respecting reduced motion.
- Cache at most eight matching model frames in memory, keyed by expression, glow strength, and selected color. Retain valid frames after context loss; show a neutral accessible label if none exists.
- Keep one shared renderer, visibility suspension, device limits, and lazy loading. Reveal only a completed frame.
- Allow a 1.5-second cancellable idle grace period before releasing GPU resources.
- Remove header avatars, profile shortcuts, and theme toggles from Home, Chain, and Journey. Preserve Profile settings, bottom navigation, contextual reward links, and empty-state illustrations.
- Correct existing index-signature access errors in legacy Mero customization so project validation can run.

## Impact

- Affected specs: mero-presentation (new follow-up to integrate-mero-three), tab-headers.
- Affected code: shared Mero renderer/component, the three tab headers, legacy customization property access.
- Supersedes the CSS loading/failure character and immediate final-target disposal described in integrate-mero-three; no API, schema, or dependency changes.
