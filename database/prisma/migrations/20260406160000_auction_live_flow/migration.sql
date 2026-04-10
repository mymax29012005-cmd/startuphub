-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('planned', 'live', 'finished');

-- AlterTable
ALTER TABLE "Auction"
ADD COLUMN     "status" "AuctionStatus" NOT NULL DEFAULT 'planned',
ADD COLUMN     "startsAt" TIMESTAMP(3),
ADD COLUMN     "registrationEndsAt" TIMESTAMP(3),
ADD COLUMN     "winnerUserId" TEXT,
ALTER COLUMN   "endsAt" DROP NOT NULL;

-- Backfill timing fields for existing auctions (if any)
UPDATE "Auction"
SET "startsAt" = COALESCE("startsAt", "createdAt"),
    "registrationEndsAt" = COALESCE("registrationEndsAt", "createdAt")
WHERE "startsAt" IS NULL OR "registrationEndsAt" IS NULL;

-- Make required after backfill
ALTER TABLE "Auction"
ALTER COLUMN "startsAt" SET NOT NULL,
ALTER COLUMN "registrationEndsAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "AuctionParticipant" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "AuctionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuctionParticipant_auctionId_userId_key" ON "AuctionParticipant"("auctionId", "userId");

-- CreateIndex
CREATE INDEX "AuctionParticipant_auctionId_active_idx" ON "AuctionParticipant"("auctionId", "active");

-- CreateIndex
CREATE INDEX "Auction_status_startsAt_idx" ON "Auction"("status", "startsAt");

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipant" ADD CONSTRAINT "AuctionParticipant_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipant" ADD CONSTRAINT "AuctionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

