BEGIN;

-- Fail rather than silently choose an owner for a historical case collision.
DO $$
BEGIN
  IF EXISTS (SELECT lower("username") FROM "users" WHERE "username" IS NOT NULL
             GROUP BY lower("username") HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Username case collision requires explicit owner review before release';
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "usernameSource" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "users" ADD COLUMN "passwordSetAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0 CHECK ("authVersion" >= 0);
CREATE UNIQUE INDEX "users_username_case_insensitive_key" ON "users" (lower("username"));

CREATE TABLE "password_resets" (
  "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" BETWEEN 0 AND 5)
);

-- Preserve every existing username/hash and all account-owned rows. Legacy
-- Google-generated credentials cannot be reliably classified from stored data.
COMMIT;
