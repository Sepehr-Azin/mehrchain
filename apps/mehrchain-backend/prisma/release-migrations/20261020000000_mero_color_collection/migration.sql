BEGIN;

CREATE TABLE "mero_progress" (
  "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "unlockedAt" TIMESTAMP(3),
  "unlockedDayKey" TEXT,
  "collectionDays" INTEGER NOT NULL DEFAULT 0 CHECK ("collectionDays" >= 0),
  "acceptedPartners" INTEGER NOT NULL DEFAULT 0 CHECK ("acceptedPartners" >= 0),
  "selectedSlot" INTEGER NOT NULL DEFAULT 0 CHECK ("selectedSlot" >= 0),
  "preferencesInitialized" BOOLEAN NOT NULL DEFAULT false,
  "hasSentSupport" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "mero_progress_unlock_pair" CHECK (("unlockedAt" IS NULL) = ("unlockedDayKey" IS NULL)),
  CONSTRAINT "mero_progress_day_format" CHECK ("unlockedDayKey" IS NULL OR "unlockedDayKey" ~ '^\d{4}-\d{2}-\d{2}$')
);

CREATE TABLE "mero_colors" (
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "slot" INTEGER NOT NULL CHECK ("slot" >= 1),
  "name" TEXT NOT NULL CHECK (char_length("name") BETWEEN 1 AND 30 AND "name" = btrim("name")),
  "hex" TEXT NOT NULL CHECK ("hex" ~ '^#[0-9a-f]{6}$'),
  PRIMARY KEY ("userId", "slot")
);

CREATE TABLE "mero_collection_days" (
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "dayKey" TEXT NOT NULL CHECK ("dayKey" ~ '^\d{4}-\d{2}-\d{2}$'),
  PRIMARY KEY ("userId", "dayKey")
);

CREATE TABLE "mero_accepted_partners" (
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "partnerId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY ("userId", "partnerId"),
  CHECK ("userId" <> "partnerId")
);
-- PostgreSQL does not automatically index the referencing side of the second FK.
CREATE INDEX "mero_accepted_partners_partnerId_idx" ON "mero_accepted_partners"("partnerId");

INSERT INTO "mero_progress" ("userId", "hasSentSupport")
SELECT u."id", EXISTS (SELECT 1 FROM "chain_hearts" h WHERE h."senderId" = u."id")
FROM "users" u;

-- Canonical server log keys only: no local caches, summed streaks, currentDay
-- estimates or fabricated history for permanently deleted habits. NULL surplus
-- duplicate logs remain untouched. All original tables/rows are read-only here.
WITH days AS (
  SELECT c."userId", c."id" AS habit_id, l."dayKey", min(l."completedAt") AS completed_at
  FROM "commitment_logs" l JOIN "commitments" c ON c."id" = l."commitmentId"
  WHERE l."dayKey" IS NOT NULL
  GROUP BY c."userId", c."id", l."dayKey"
), islands AS (
  SELECT *, "dayKey"::date - (row_number() OVER (PARTITION BY habit_id ORDER BY "dayKey"))::integer AS island
  FROM days
), streaks AS (
  SELECT *, row_number() OVER (PARTITION BY habit_id, island ORDER BY "dayKey") AS streak_day
  FROM islands
), first_unlock AS (
  SELECT DISTINCT ON ("userId") "userId", "dayKey", completed_at
  FROM streaks WHERE streak_day = 21
  ORDER BY "userId", "dayKey", completed_at
)
UPDATE "mero_progress" p
SET "unlockedAt" = f.completed_at, "unlockedDayKey" = f."dayKey"
FROM first_unlock f WHERE p."userId" = f."userId";

INSERT INTO "mero_collection_days" ("userId", "dayKey")
SELECT DISTINCT c."userId", l."dayKey"
FROM "commitment_logs" l
JOIN "commitments" c ON c."id" = l."commitmentId"
JOIN "mero_progress" p ON p."userId" = c."userId"
WHERE l."dayKey" > p."unlockedDayKey";

-- Persisted connections are evidence of accepted pairs, even if disconnected.
-- Include both participants and deduplicate habits/generations/reciprocal rows.
INSERT INTO "mero_accepted_partners" ("userId", "partnerId")
SELECT "userId", "partnerId" FROM "chain_connections" WHERE "userId" <> "partnerId"
UNION
SELECT "partnerId", "userId" FROM "chain_connections" WHERE "userId" <> "partnerId";

UPDATE "mero_progress" p SET
  "collectionDays" = (SELECT count(*) FROM "mero_collection_days" d WHERE d."userId" = p."userId"),
  "acceptedPartners" = (SELECT count(*) FROM "mero_accepted_partners" a WHERE a."userId" = p."userId");

COMMIT;
