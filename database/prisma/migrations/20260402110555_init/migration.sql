-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "analysisId" TEXT;

-- AlterTable
ALTER TABLE "Startup" ADD COLUMN     "analysisId" TEXT;

-- AddForeignKey
ALTER TABLE "Startup" ADD CONSTRAINT "Startup_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "StartupAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "StartupAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
