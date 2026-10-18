BEGIN;

-- Additive allowance ledger; preserve all historical connection fields.
CREATE TABLE "chain_hearts" (
    "senderId" TEXT NOT NULL,
    "recipientCommitmentId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chain_hearts_pkey" PRIMARY KEY ("senderId", "recipientCommitmentId", "dayKey")
);

CREATE INDEX "chain_hearts_recipientCommitmentId_dayKey_idx"
    ON "chain_hearts"("recipientCommitmentId", "dayKey");

ALTER TABLE "chain_hearts" ADD CONSTRAINT "chain_hearts_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chain_hearts" ADD CONSTRAINT "chain_hearts_recipientCommitmentId_fkey"
    FOREIGN KEY ("recipientCommitmentId") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma timestamps store UTC without a zone. Convert that instant to the
-- recipient account's date, and collapse duplicate links from the same sender.
INSERT INTO "chain_hearts" ("senderId", "recipientCommitmentId", "dayKey", "sentAt")
SELECT c."userId", c."partnerCommitmentId",
       to_char(c."heartSentAt" AT TIME ZONE 'UTC' AT TIME ZONE u."timeZone", 'YYYY-MM-DD'),
       MIN(c."heartSentAt")
FROM "chain_connections" c
JOIN "commitments" h ON h."id" = c."partnerCommitmentId"
JOIN "users" u ON u."id" = h."userId"
WHERE c."heartSent" = TRUE AND c."heartSentAt" IS NOT NULL
GROUP BY c."userId", c."partnerCommitmentId",
         to_char(c."heartSentAt" AT TIME ZONE 'UTC' AT TIME ZONE u."timeZone", 'YYYY-MM-DD');

COMMIT;
