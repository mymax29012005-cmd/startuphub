-- Add read markers for direct conversations (unread messages support).

ALTER TABLE "DirectConversation"
  ADD COLUMN "lastReadAtA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastReadAtB" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

