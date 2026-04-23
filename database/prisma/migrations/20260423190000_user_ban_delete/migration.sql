-- Add ban/delete fields to User.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "bannedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;

CREATE INDEX IF NOT EXISTS "User_bannedAt_idx" ON "User" ("bannedAt");
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User" ("deletedAt");

