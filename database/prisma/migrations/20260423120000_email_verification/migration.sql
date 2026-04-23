-- Email verification fields on User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "emailVerifyTokenHash" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerifyTokenExpires" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_emailVerifyTokenHash_idx" ON "User" ("emailVerifyTokenHash");
