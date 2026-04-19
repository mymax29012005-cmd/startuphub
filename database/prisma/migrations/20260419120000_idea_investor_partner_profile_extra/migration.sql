-- JSON payload for marketplace cards / detail pages (see design-new/*card.html)
ALTER TABLE "Idea" ADD COLUMN "profileExtra" JSONB;
ALTER TABLE "InvestorRequest" ADD COLUMN "profileExtra" JSONB;
ALTER TABLE "PartnerRequest" ADD COLUMN "profileExtra" JSONB;
