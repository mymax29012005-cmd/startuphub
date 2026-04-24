-- Add password reset code fields for email-based reset flow.
ALTER TABLE "User"
  ADD COLUMN "passwordResetCodeHash" TEXT,
  ADD COLUMN "passwordResetCodeExpires" TIMESTAMP(3),
  ADD COLUMN "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordResetRequestedAt" TIMESTAMP(3);

CREATE INDEX "User_passwordResetCodeHash_idx" ON "User"("passwordResetCodeHash");

