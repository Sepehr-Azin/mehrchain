# Change: Complete optional usernames and verified password access (T17)

The owner directly requested implementation through T17 with per-task commits.
This proposal records that authorized roadmap scope; no separate approval step
is introduced. Builds/tests remain owner-run.

Usernames become nullable and mutable while stable user IDs remain unchanged.
Add normalized availability/save, real email-or-username login and a purpose-bound,
single-use email-code password setup/recovery flow, including Google accounts.
Preserve historical usernames with unknown provenance as legacy; new Google
accounts receive no generated public handle. Production delivery depends on T14.

Affected areas: Prisma release migration/readiness, auth/profile APIs, signup,
login/recovery, Profile and null-handle partner presentation. No T18 update work.
