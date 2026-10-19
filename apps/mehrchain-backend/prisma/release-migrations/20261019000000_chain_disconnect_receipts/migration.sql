BEGIN;

ALTER TABLE "chain_connections" ADD COLUMN "generationId" TEXT;
-- Existing rows each get a stable token; new acceptances replace both tokens.
UPDATE "chain_connections" SET "generationId" = "id";
ALTER TABLE "chain_connections" ALTER COLUMN "generationId" SET NOT NULL;

CREATE TABLE "chain_disconnect_receipts" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "recipientConnectionId" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "recipientHabitTitle" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "chain_disconnect_receipts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chain_disconnect_receipts_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chain_disconnect_receipts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chain_disconnect_receipts_reason_check" CHECK ("reason" IN ('TAKING_BREAK', 'DIFFERENT_ROUTINE', 'OTHER', 'PREFER_NOT_TO_SHARE', 'HABIT_UNAVAILABLE')),
    CONSTRAINT "chain_disconnect_receipts_note_check" CHECK (
      char_length("note") <= 500 AND
      ("reason" NOT IN ('PREFER_NOT_TO_SHARE', 'HABIT_UNAVAILABLE') OR "note" IS NULL)
    )
);

CREATE UNIQUE INDEX "chain_disconnect_receipts_connection_generation_key" ON "chain_disconnect_receipts"("recipientConnectionId", "generationId");
CREATE INDEX "chain_disconnect_receipts_recipientId_readAt_createdAt_idx" ON "chain_disconnect_receipts"("recipientId", "readAt", "createdAt");

COMMIT;
