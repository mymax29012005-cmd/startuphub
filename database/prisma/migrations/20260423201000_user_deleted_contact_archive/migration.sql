ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "deletedEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedPhone" TEXT;

CREATE INDEX IF NOT EXISTS "User_deletedEmail_idx" ON "User" ("deletedEmail");
CREATE INDEX IF NOT EXISTS "User_deletedPhone_idx" ON "User" ("deletedPhone");

