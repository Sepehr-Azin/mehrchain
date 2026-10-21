## Implementation
- [x] Add nullable usernames, provenance, credential state, challenge and token-version migration/readiness.
- [x] Implement authenticated availability/save, identifier validation/login and verified password setup/recovery.
- [x] Implement optional signup, profile edit/remove/availability and honest login/recovery UI with session guards.
- [x] Update null-handle partner display and regression source, and document release boundaries.

## Acceptance (owner execution)
- [ ] Standard backend/frontend checks and current APK pipeline.
- [x] Disposable populated migration rehearsal preserves original fields and checks concurrent case-insensitive claims, repeat deploy, nulls and challenge cascade. Repeat on a fresh copy before production release.
- [ ] Production email delivery, code expiry/replay/limits and real Google/password/username reload/device acceptance.
- [ ] Snapshot and matching production migration/deployment after review, then T09/PWA acceptance.
