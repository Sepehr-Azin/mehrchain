## Decisions

- Loading, ready, and unavailable are separate states. No alternate mascot is rendered. Character and glow share a 140ms opacity reveal, disabled for reduced motion. The fixed-size wrapper prevents layout shifts.
- A real model frame must be copied successfully before ready is reported. Shader preparation alone is insufficient.
- An eight-entry in-memory LRU cache holds 2D canvas copies (at most about 4.5 MiB of pixel data at 384 pixels per entry, excluding browser overhead). Cache copies occur on dirty renders, not every animation frame. Larger matching frames are reused across square display sizes; the next draw corrects resolution.
- Cache keys include expression, glow strength, and confirmed glow color. No account identifiers, persistent storage, or image requests are introduced. A color/expression change cannot reuse an incompatible frame.
- Context loss preserves each displayed 2D frame. A newly attached matching avatar can also use a cached model frame after GPU failure. Without a matching frame, a neutral Mero text label and accessible unavailable description are used.
- GPU release waits 1.5 seconds after the last target leaves. New attachments cancel release. Idle scenes do not animate; application destruction cancels pending work and releases both GPU and cached frames immediately.
- Lazy loading never blocks the page. Leaving before module loading or destroying the service during loading cannot schedule new rendering work.
- Do not add `compileAsync()` for the pinned Three.js r180: its internal timer polls material properties without a cancellation API, so disposing while preparation is pending can leave a polling callback accessing disposed programs. Snapshot reuse and the idle grace address repeat initialization without introducing this teardown race.
- Only header controls are removed from the three tabs. Profile's companion, appearance settings, and the global Profile navigation link remain available.

## Validation

- Focused tests cover delayed module loading, first-frame readiness, snapshot reuse/isolation/eviction, navigation grace, failure, and asynchronous teardown.
- Existing frontend tests and a production build verify affected routes and customization.
- Browser checks cover onboarding and route headers. Physical Android launch/PWA transition timing and battery behavior require device testing.
