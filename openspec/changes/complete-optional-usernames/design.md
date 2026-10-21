# Decisions

- Make User.username nullable; retain its unique index and add an expression unique
  index on lower(username). All new saves normalize to lowercase, 3–20 ASCII
  letters/digits/underscore; blank removes. Login additionally accepts @username.
  Migration fails on historical case collisions, without renaming/deleting rows.
- Preserve all historical values and mark provenance legacy. No trustworthy stored
  provider/selection marker distinguishes every generated Google default. New
  Google accounts have null usernames/source none; explicit saves have source chosen.
- Profile availability is authenticated, rate-limited, debounced and cancellable.
  The database decides concurrent claims at save; a conflict returns 409.
- Record passwordSetAt only for a deliberate signup/reset or successful legacy
  password login. Google-generated hashes are never advertised as usable passwords.
- Password reset/setup uses a separate hashed six-digit challenge with 15-minute
  expiry, five attempts, per-account cooldown and endpoint throttles. It cannot
  activate an unverified signup or substitute a registration code. Compare and
  consume under the user row lock; password replacement and token-version increment
  are atomic. Existing JWTs without a version remain valid only at version zero.
- Stale client availability/save/reset results cannot update a different session.
  A password reset signs out the initiating session; Google access remains intact.
- Additive schema/readiness changes require populated-copy rehearsal and a matching
  backend/client generation deployment. Do not apply production schema while the
  old writers remain live, or claim email/phone acceptance without T14/T09 evidence.
