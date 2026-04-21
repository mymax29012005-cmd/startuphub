-- Moderation workflow: statuses + history

-- Enums
DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('draft', 'pending_moderation', 'needs_revision', 'published', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModerationEntityType" AS ENUM ('startup', 'idea', 'investor', 'partner', 'auction');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModerationAction" AS ENUM ('submitted', 'viewed', 'approved', 'revision_requested', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Core listing tables: add moderation columns (default to published for existing data)
ALTER TABLE "Startup"
  ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS "adminComment" TEXT,
  ADD COLUMN IF NOT EXISTS "revisionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;

ALTER TABLE "Idea"
  ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS "adminComment" TEXT,
  ADD COLUMN IF NOT EXISTS "revisionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;

ALTER TABLE "InvestorRequest"
  ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS "adminComment" TEXT,
  ADD COLUMN IF NOT EXISTS "revisionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;

ALTER TABLE "PartnerRequest"
  ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS "adminComment" TEXT,
  ADD COLUMN IF NOT EXISTS "revisionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;

ALTER TABLE "Auction"
  ADD COLUMN IF NOT EXISTS "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS "adminComment" TEXT,
  ADD COLUMN IF NOT EXISTS "revisionDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;

-- History table
CREATE TABLE IF NOT EXISTS "ModerationEvent" (
  "id" TEXT NOT NULL,
  "entityType" "ModerationEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" "ModerationAction" NOT NULL,
  "actorId" TEXT,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModerationEvent_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ModerationEvent"
    ADD CONSTRAINT "ModerationEvent_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "Startup_moderationStatus_createdAt_idx" ON "Startup"("moderationStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Idea_moderationStatus_createdAt_idx" ON "Idea"("moderationStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "InvestorRequest_moderationStatus_createdAt_idx" ON "InvestorRequest"("moderationStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "PartnerRequest_moderationStatus_createdAt_idx" ON "PartnerRequest"("moderationStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Auction_moderationStatus_createdAt_idx" ON "Auction"("moderationStatus", "createdAt");

CREATE INDEX IF NOT EXISTS "ModerationEvent_entityType_entityId_createdAt_idx" ON "ModerationEvent"("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "ModerationEvent_action_createdAt_idx" ON "ModerationEvent"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "ModerationEvent_actorId_createdAt_idx" ON "ModerationEvent"("actorId", "createdAt");
