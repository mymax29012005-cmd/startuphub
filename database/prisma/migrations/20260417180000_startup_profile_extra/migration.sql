-- Optional extended card fields (tagline, KPIs, team, investment terms, etc.)
ALTER TABLE "Startup" ADD COLUMN "profileExtra" JSONB;
