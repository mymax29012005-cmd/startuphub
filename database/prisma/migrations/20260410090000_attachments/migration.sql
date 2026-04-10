-- Attachments for user-created cards (startups, ideas, investor/partner requests)

CREATE TABLE "Attachment" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT,
  "size" INTEGER,
  "startupId" TEXT,
  "ideaId" TEXT,
  "investorRequestId" TEXT,
  "partnerRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Attachment_ownerId_createdAt_idx" ON "Attachment" ("ownerId", "createdAt");
CREATE INDEX "Attachment_startupId_idx" ON "Attachment" ("startupId");
CREATE INDEX "Attachment_ideaId_idx" ON "Attachment" ("ideaId");
CREATE INDEX "Attachment_investorRequestId_idx" ON "Attachment" ("investorRequestId");
CREATE INDEX "Attachment_partnerRequestId_idx" ON "Attachment" ("partnerRequestId");

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_ideaId_fkey"
FOREIGN KEY ("ideaId") REFERENCES "Idea"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_investorRequestId_fkey"
FOREIGN KEY ("investorRequestId") REFERENCES "InvestorRequest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_partnerRequestId_fkey"
FOREIGN KEY ("partnerRequestId") REFERENCES "PartnerRequest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

