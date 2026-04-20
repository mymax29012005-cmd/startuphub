ALTER TABLE "Favorite" ADD COLUMN "investorRequestId" TEXT;
ALTER TABLE "Favorite" ADD COLUMN "partnerRequestId" TEXT;

ALTER TABLE "Favorite"
  ADD CONSTRAINT "Favorite_investorRequestId_fkey"
  FOREIGN KEY ("investorRequestId") REFERENCES "InvestorRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite"
  ADD CONSTRAINT "Favorite_partnerRequestId_fkey"
  FOREIGN KEY ("partnerRequestId") REFERENCES "PartnerRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Favorite_userId_investorRequestId_idx" ON "Favorite"("userId", "investorRequestId");
CREATE INDEX "Favorite_userId_partnerRequestId_idx" ON "Favorite"("userId", "partnerRequestId");

