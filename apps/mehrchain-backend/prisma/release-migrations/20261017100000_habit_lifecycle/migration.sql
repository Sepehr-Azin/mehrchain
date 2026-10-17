BEGIN;

-- Nullable and additive: preserve original start dates, completions and progress.
-- NULL means the existing start/last completion remains the inactivity anchor.
ALTER TABLE "commitments" ADD COLUMN "inactivityAnchorAt" TIMESTAMP(3);

COMMIT;
