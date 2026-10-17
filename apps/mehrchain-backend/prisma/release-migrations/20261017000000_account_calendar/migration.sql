BEGIN;

-- Existing accounts retain their UTC contract. No history, timestamps or progress is re-keyed.
ALTER TABLE "users" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "commitment_logs" ADD COLUMN "dayKey" TEXT;
ALTER TABLE "commitment_logs" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';

-- Prisma timestamps are timestamp without time zone, containing UTC instants.
-- Format those stored UTC values directly, without a connection-timezone cast.
-- Keep every old log, including any historical duplicates. Only the first log for
-- each old UTC day receives the unique key; surplus records retain a NULL dayKey.
WITH ranked AS (
  SELECT "id",
    to_char("completedAt", 'YYYY-MM-DD') AS day_key,
    row_number() OVER (
      PARTITION BY "commitmentId", to_char("completedAt", 'YYYY-MM-DD')
      ORDER BY "completedAt", "id"
    ) AS position
  FROM "commitment_logs"
)
UPDATE "commitment_logs" AS logs
SET "dayKey" = ranked.day_key
FROM ranked WHERE logs."id" = ranked."id" AND ranked.position = 1;

CREATE UNIQUE INDEX "commitment_logs_commitmentId_dayKey_key"
  ON "commitment_logs"("commitmentId", "dayKey");

COMMIT;
