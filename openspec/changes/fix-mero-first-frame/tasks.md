## Implementation

- [x] Remove the alternate CSS character and synchronize model/glow presentation.
- [x] Add bounded matching-frame reuse and cancellable idle cleanup; evaluate shader warm-up against the pinned library's teardown behavior.
- [x] Remove redundant controls from Home, Chain, and Journey headers.
- [x] Fix existing legacy-customization TypeScript property access errors.
- [x] Run lifecycle regression tests, frontend checks, and production build.
- [x] Verify the resulting interface in the browser.

## Results

- Final focused run: 47 tests passed in nine files (Mero, Home, Chain, Journey, and Profile).
- Final production frontend build: passed; Three.js remains a lazy chunk.
- OpenSpec strict validation: passed for `fix-mero-first-frame`.
- Broad frontend run: 175 passed and 36 failed. The initial outstanding collection request in `mero-customization.service.spec.ts` also reproduces when run alone, followed by TestBed teardown/configuration failures; foreground-refresh also fails. These unrelated refresh/HTTP test issues are not declared fixed by this change.
- Mobile viewport 390 x 844: inspected onboarding and all four tabs using a local development demo account. The three headers omit redundant controls; Profile retains its companion and Light/System/Dark settings. No alternate CSS mascot exists in the rendered DOM.
- Physical-device Android/PWA launch transitions have not been tested.
