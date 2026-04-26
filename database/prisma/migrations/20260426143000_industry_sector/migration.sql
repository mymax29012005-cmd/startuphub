-- Отрасль (sector) + подкатегория в category / industry

ALTER TABLE "Startup" ADD COLUMN "sector" TEXT;
ALTER TABLE "Idea" ADD COLUMN "sector" TEXT;
ALTER TABLE "InvestorRequest" ADD COLUMN "sector" TEXT;
ALTER TABLE "PartnerRequest" ADD COLUMN "sector" TEXT;

-- Старые «ярлыки» (Startup / Idea)
UPDATE "Startup" SET "sector" = 'software_it', "category" = 'saas' WHERE "category" = 'SaaS';
UPDATE "Startup" SET "sector" = 'software_it', "category" = 'ai_ml' WHERE "category" = 'AI';
UPDATE "Startup" SET "sector" = 'finance', "category" = 'fintech' WHERE "category" = 'FinTech';
UPDATE "Startup" SET "sector" = 'education', "category" = 'edtech' WHERE "category" = 'EdTech';
UPDATE "Startup" SET "sector" = 'health', "category" = 'healthtech' WHERE "category" = 'HealthTech';
UPDATE "Startup" SET "sector" = 'commerce', "category" = 'ecommerce' WHERE "category" = 'E-commerce';
UPDATE "Startup" SET "sector" = 'commerce', "category" = 'marketplaces' WHERE "category" = 'Marketplace';
UPDATE "Startup" SET "sector" = 'software_it', "category" = 'devtools' WHERE "category" = 'Mobile';
UPDATE "Startup" SET "sector" = 'software_it', "category" = 'devtools' WHERE "category" = 'Web';
UPDATE "Startup" SET "sector" = 'industrial', "category" = 'hardware' WHERE "category" = 'Hardware';
UPDATE "Startup" SET "sector" = 'media_entertainment', "category" = 'gaming' WHERE "category" = 'Gaming';
UPDATE "Startup" SET "sector" = 'media_entertainment', "category" = 'media' WHERE "category" = 'Media';
UPDATE "Startup" SET "sector" = 'software_it', "category" = 'other_it' WHERE "category" = 'Other';

UPDATE "Idea" SET "sector" = 'software_it', "category" = 'saas' WHERE "category" = 'SaaS';
UPDATE "Idea" SET "sector" = 'software_it', "category" = 'ai_ml' WHERE "category" = 'AI';
UPDATE "Idea" SET "sector" = 'finance', "category" = 'fintech' WHERE "category" = 'FinTech';
UPDATE "Idea" SET "sector" = 'education', "category" = 'edtech' WHERE "category" = 'EdTech';
UPDATE "Idea" SET "sector" = 'health', "category" = 'healthtech' WHERE "category" = 'HealthTech';
UPDATE "Idea" SET "sector" = 'commerce', "category" = 'ecommerce' WHERE "category" = 'E-commerce';
UPDATE "Idea" SET "sector" = 'commerce', "category" = 'marketplaces' WHERE "category" = 'Marketplace';
UPDATE "Idea" SET "sector" = 'software_it', "category" = 'devtools' WHERE "category" = 'Mobile';
UPDATE "Idea" SET "sector" = 'software_it', "category" = 'devtools' WHERE "category" = 'Web';
UPDATE "Idea" SET "sector" = 'industrial', "category" = 'hardware' WHERE "category" = 'Hardware';
UPDATE "Idea" SET "sector" = 'media_entertainment', "category" = 'gaming' WHERE "category" = 'Gaming';
UPDATE "Idea" SET "sector" = 'media_entertainment', "category" = 'media' WHERE "category" = 'Media';
UPDATE "Idea" SET "sector" = 'software_it', "category" = 'other_it' WHERE "category" = 'Other';

-- Инвесторы / партнёры (поле industry)
UPDATE "InvestorRequest" SET "sector" = 'software_it', "industry" = 'saas' WHERE "industry" = 'SaaS';
UPDATE "InvestorRequest" SET "sector" = 'software_it', "industry" = 'ai_ml' WHERE "industry" = 'AI';
UPDATE "InvestorRequest" SET "sector" = 'finance', "industry" = 'fintech' WHERE "industry" = 'FinTech';
UPDATE "InvestorRequest" SET "sector" = 'education', "industry" = 'edtech' WHERE "industry" = 'EdTech';
UPDATE "InvestorRequest" SET "sector" = 'health', "industry" = 'healthtech' WHERE "industry" = 'HealthTech';
UPDATE "InvestorRequest" SET "sector" = 'commerce', "industry" = 'ecommerce' WHERE "industry" = 'E-commerce';
UPDATE "InvestorRequest" SET "sector" = 'commerce', "industry" = 'marketplaces' WHERE "industry" = 'Marketplace';
UPDATE "InvestorRequest" SET "sector" = 'software_it', "industry" = 'devtools' WHERE "industry" = 'Mobile';
UPDATE "InvestorRequest" SET "sector" = 'software_it', "industry" = 'devtools' WHERE "industry" = 'Web';
UPDATE "InvestorRequest" SET "sector" = 'industrial', "industry" = 'hardware' WHERE "industry" = 'Hardware';
UPDATE "InvestorRequest" SET "sector" = 'media_entertainment', "industry" = 'gaming' WHERE "industry" = 'Gaming';
UPDATE "InvestorRequest" SET "sector" = 'media_entertainment', "industry" = 'media' WHERE "industry" = 'Media';
UPDATE "InvestorRequest" SET "sector" = 'software_it', "industry" = 'other_it' WHERE "industry" = 'Other';

UPDATE "PartnerRequest" SET "sector" = 'software_it', "industry" = 'saas' WHERE "industry" = 'SaaS';
UPDATE "PartnerRequest" SET "sector" = 'software_it', "industry" = 'ai_ml' WHERE "industry" = 'AI';
UPDATE "PartnerRequest" SET "sector" = 'finance', "industry" = 'fintech' WHERE "industry" = 'FinTech';
UPDATE "PartnerRequest" SET "sector" = 'education', "industry" = 'edtech' WHERE "industry" = 'EdTech';
UPDATE "PartnerRequest" SET "sector" = 'health', "industry" = 'healthtech' WHERE "industry" = 'HealthTech';
UPDATE "PartnerRequest" SET "sector" = 'commerce', "industry" = 'ecommerce' WHERE "industry" = 'E-commerce';
UPDATE "PartnerRequest" SET "sector" = 'commerce', "industry" = 'marketplaces' WHERE "industry" = 'Marketplace';
UPDATE "PartnerRequest" SET "sector" = 'software_it', "industry" = 'devtools' WHERE "industry" = 'Mobile';
UPDATE "PartnerRequest" SET "sector" = 'software_it', "industry" = 'devtools' WHERE "industry" = 'Web';
UPDATE "PartnerRequest" SET "sector" = 'industrial', "industry" = 'hardware' WHERE "industry" = 'Hardware';
UPDATE "PartnerRequest" SET "sector" = 'media_entertainment', "industry" = 'gaming' WHERE "industry" = 'Gaming';
UPDATE "PartnerRequest" SET "sector" = 'media_entertainment', "industry" = 'media' WHERE "industry" = 'Media';
UPDATE "PartnerRequest" SET "sector" = 'software_it', "industry" = 'other_it' WHERE "industry" = 'Other';

-- Уже slug: выставить sector по подкатегории
UPDATE "Startup" SET "sector" = CASE "category"
  WHEN 'saas' THEN 'software_it'
  WHEN 'ai_ml' THEN 'software_it'
  WHEN 'cybersecurity' THEN 'software_it'
  WHEN 'devtools' THEN 'software_it'
  WHEN 'cloud_infra' THEN 'software_it'
  WHEN 'other_it' THEN 'software_it'
  WHEN 'fintech' THEN 'finance'
  WHEN 'payments' THEN 'finance'
  WHEN 'lending' THEN 'finance'
  WHEN 'insurtech' THEN 'finance'
  WHEN 'crypto_web3' THEN 'finance'
  WHEN 'healthtech' THEN 'health'
  WHEN 'biotech' THEN 'health'
  WHEN 'mental_health' THEN 'health'
  WHEN 'fitness_wellness' THEN 'health'
  WHEN 'medical_devices' THEN 'health'
  WHEN 'edtech' THEN 'education'
  WHEN 'corporate_learning' THEN 'education'
  WHEN 'online_courses' THEN 'education'
  WHEN 'kids_education' THEN 'education'
  WHEN 'ecommerce' THEN 'commerce'
  WHEN 'marketplaces' THEN 'commerce'
  WHEN 'retailtech' THEN 'commerce'
  WHEN 'd2c' THEN 'commerce'
  WHEN 'hardware' THEN 'industrial'
  WHEN 'robotics' THEN 'industrial'
  WHEN 'iot' THEN 'industrial'
  WHEN 'manufacturing' THEN 'industrial'
  WHEN 'logistics_core' THEN 'logistics'
  WHEN 'supply_chain' THEN 'logistics'
  WHEN 'delivery' THEN 'logistics'
  WHEN 'mobility' THEN 'logistics'
  WHEN 'climatetech' THEN 'energy_eco'
  WHEN 'clean_energy' THEN 'energy_eco'
  WHEN 'sustainability' THEN 'energy_eco'
  WHEN 'recycling' THEN 'energy_eco'
  WHEN 'foodtech' THEN 'food_agri'
  WHEN 'agritech' THEN 'food_agri'
  WHEN 'food_delivery' THEN 'food_agri'
  WHEN 'alt_food' THEN 'food_agri'
  WHEN 'proptech' THEN 'offline_services'
  WHEN 'constructiontech' THEN 'offline_services'
  WHEN 'traveltech' THEN 'offline_services'
  WHEN 'eventtech' THEN 'offline_services'
  WHEN 'hrtech' THEN 'business_work'
  WHEN 'legaltech' THEN 'business_work'
  WHEN 'govtech' THEN 'business_work'
  WHEN 'productivity' THEN 'business_work'
  WHEN 'gaming' THEN 'media_entertainment'
  WHEN 'media' THEN 'media_entertainment'
  WHEN 'creator_economy' THEN 'media_entertainment'
  WHEN 'ar_vr' THEN 'media_entertainment'
  ELSE 'software_it'
END
WHERE "sector" IS NULL;

UPDATE "Idea" SET "sector" = CASE "category"
  WHEN 'saas' THEN 'software_it'
  WHEN 'ai_ml' THEN 'software_it'
  WHEN 'cybersecurity' THEN 'software_it'
  WHEN 'devtools' THEN 'software_it'
  WHEN 'cloud_infra' THEN 'software_it'
  WHEN 'other_it' THEN 'software_it'
  WHEN 'fintech' THEN 'finance'
  WHEN 'payments' THEN 'finance'
  WHEN 'lending' THEN 'finance'
  WHEN 'insurtech' THEN 'finance'
  WHEN 'crypto_web3' THEN 'finance'
  WHEN 'healthtech' THEN 'health'
  WHEN 'biotech' THEN 'health'
  WHEN 'mental_health' THEN 'health'
  WHEN 'fitness_wellness' THEN 'health'
  WHEN 'medical_devices' THEN 'health'
  WHEN 'edtech' THEN 'education'
  WHEN 'corporate_learning' THEN 'education'
  WHEN 'online_courses' THEN 'education'
  WHEN 'kids_education' THEN 'education'
  WHEN 'ecommerce' THEN 'commerce'
  WHEN 'marketplaces' THEN 'commerce'
  WHEN 'retailtech' THEN 'commerce'
  WHEN 'd2c' THEN 'commerce'
  WHEN 'hardware' THEN 'industrial'
  WHEN 'robotics' THEN 'industrial'
  WHEN 'iot' THEN 'industrial'
  WHEN 'manufacturing' THEN 'industrial'
  WHEN 'logistics_core' THEN 'logistics'
  WHEN 'supply_chain' THEN 'logistics'
  WHEN 'delivery' THEN 'logistics'
  WHEN 'mobility' THEN 'logistics'
  WHEN 'climatetech' THEN 'energy_eco'
  WHEN 'clean_energy' THEN 'energy_eco'
  WHEN 'sustainability' THEN 'energy_eco'
  WHEN 'recycling' THEN 'energy_eco'
  WHEN 'foodtech' THEN 'food_agri'
  WHEN 'agritech' THEN 'food_agri'
  WHEN 'food_delivery' THEN 'food_agri'
  WHEN 'alt_food' THEN 'food_agri'
  WHEN 'proptech' THEN 'offline_services'
  WHEN 'constructiontech' THEN 'offline_services'
  WHEN 'traveltech' THEN 'offline_services'
  WHEN 'eventtech' THEN 'offline_services'
  WHEN 'hrtech' THEN 'business_work'
  WHEN 'legaltech' THEN 'business_work'
  WHEN 'govtech' THEN 'business_work'
  WHEN 'productivity' THEN 'business_work'
  WHEN 'gaming' THEN 'media_entertainment'
  WHEN 'media' THEN 'media_entertainment'
  WHEN 'creator_economy' THEN 'media_entertainment'
  WHEN 'ar_vr' THEN 'media_entertainment'
  ELSE 'software_it'
END
WHERE "sector" IS NULL;

UPDATE "InvestorRequest" SET "sector" = CASE "industry"
  WHEN 'saas' THEN 'software_it'
  WHEN 'ai_ml' THEN 'software_it'
  WHEN 'cybersecurity' THEN 'software_it'
  WHEN 'devtools' THEN 'software_it'
  WHEN 'cloud_infra' THEN 'software_it'
  WHEN 'other_it' THEN 'software_it'
  WHEN 'fintech' THEN 'finance'
  WHEN 'payments' THEN 'finance'
  WHEN 'lending' THEN 'finance'
  WHEN 'insurtech' THEN 'finance'
  WHEN 'crypto_web3' THEN 'finance'
  WHEN 'healthtech' THEN 'health'
  WHEN 'biotech' THEN 'health'
  WHEN 'mental_health' THEN 'health'
  WHEN 'fitness_wellness' THEN 'health'
  WHEN 'medical_devices' THEN 'health'
  WHEN 'edtech' THEN 'education'
  WHEN 'corporate_learning' THEN 'education'
  WHEN 'online_courses' THEN 'education'
  WHEN 'kids_education' THEN 'education'
  WHEN 'ecommerce' THEN 'commerce'
  WHEN 'marketplaces' THEN 'commerce'
  WHEN 'retailtech' THEN 'commerce'
  WHEN 'd2c' THEN 'commerce'
  WHEN 'hardware' THEN 'industrial'
  WHEN 'robotics' THEN 'industrial'
  WHEN 'iot' THEN 'industrial'
  WHEN 'manufacturing' THEN 'industrial'
  WHEN 'logistics_core' THEN 'logistics'
  WHEN 'supply_chain' THEN 'logistics'
  WHEN 'delivery' THEN 'logistics'
  WHEN 'mobility' THEN 'logistics'
  WHEN 'climatetech' THEN 'energy_eco'
  WHEN 'clean_energy' THEN 'energy_eco'
  WHEN 'sustainability' THEN 'energy_eco'
  WHEN 'recycling' THEN 'energy_eco'
  WHEN 'foodtech' THEN 'food_agri'
  WHEN 'agritech' THEN 'food_agri'
  WHEN 'food_delivery' THEN 'food_agri'
  WHEN 'alt_food' THEN 'food_agri'
  WHEN 'proptech' THEN 'offline_services'
  WHEN 'constructiontech' THEN 'offline_services'
  WHEN 'traveltech' THEN 'offline_services'
  WHEN 'eventtech' THEN 'offline_services'
  WHEN 'hrtech' THEN 'business_work'
  WHEN 'legaltech' THEN 'business_work'
  WHEN 'govtech' THEN 'business_work'
  WHEN 'productivity' THEN 'business_work'
  WHEN 'gaming' THEN 'media_entertainment'
  WHEN 'media' THEN 'media_entertainment'
  WHEN 'creator_economy' THEN 'media_entertainment'
  WHEN 'ar_vr' THEN 'media_entertainment'
  ELSE 'software_it'
END
WHERE "sector" IS NULL;

UPDATE "PartnerRequest" SET "sector" = CASE "industry"
  WHEN 'saas' THEN 'software_it'
  WHEN 'ai_ml' THEN 'software_it'
  WHEN 'cybersecurity' THEN 'software_it'
  WHEN 'devtools' THEN 'software_it'
  WHEN 'cloud_infra' THEN 'software_it'
  WHEN 'other_it' THEN 'software_it'
  WHEN 'fintech' THEN 'finance'
  WHEN 'payments' THEN 'finance'
  WHEN 'lending' THEN 'finance'
  WHEN 'insurtech' THEN 'finance'
  WHEN 'crypto_web3' THEN 'finance'
  WHEN 'healthtech' THEN 'health'
  WHEN 'biotech' THEN 'health'
  WHEN 'mental_health' THEN 'health'
  WHEN 'fitness_wellness' THEN 'health'
  WHEN 'medical_devices' THEN 'health'
  WHEN 'edtech' THEN 'education'
  WHEN 'corporate_learning' THEN 'education'
  WHEN 'online_courses' THEN 'education'
  WHEN 'kids_education' THEN 'education'
  WHEN 'ecommerce' THEN 'commerce'
  WHEN 'marketplaces' THEN 'commerce'
  WHEN 'retailtech' THEN 'commerce'
  WHEN 'd2c' THEN 'commerce'
  WHEN 'hardware' THEN 'industrial'
  WHEN 'robotics' THEN 'industrial'
  WHEN 'iot' THEN 'industrial'
  WHEN 'manufacturing' THEN 'industrial'
  WHEN 'logistics_core' THEN 'logistics'
  WHEN 'supply_chain' THEN 'logistics'
  WHEN 'delivery' THEN 'logistics'
  WHEN 'mobility' THEN 'logistics'
  WHEN 'climatetech' THEN 'energy_eco'
  WHEN 'clean_energy' THEN 'energy_eco'
  WHEN 'sustainability' THEN 'energy_eco'
  WHEN 'recycling' THEN 'energy_eco'
  WHEN 'foodtech' THEN 'food_agri'
  WHEN 'agritech' THEN 'food_agri'
  WHEN 'food_delivery' THEN 'food_agri'
  WHEN 'alt_food' THEN 'food_agri'
  WHEN 'proptech' THEN 'offline_services'
  WHEN 'constructiontech' THEN 'offline_services'
  WHEN 'traveltech' THEN 'offline_services'
  WHEN 'eventtech' THEN 'offline_services'
  WHEN 'hrtech' THEN 'business_work'
  WHEN 'legaltech' THEN 'business_work'
  WHEN 'govtech' THEN 'business_work'
  WHEN 'productivity' THEN 'business_work'
  WHEN 'gaming' THEN 'media_entertainment'
  WHEN 'media' THEN 'media_entertainment'
  WHEN 'creator_economy' THEN 'media_entertainment'
  WHEN 'ar_vr' THEN 'media_entertainment'
  ELSE 'software_it'
END
WHERE "sector" IS NULL;

UPDATE "Startup" SET "sector" = 'software_it', "category" = 'other_it' WHERE "sector" IS NULL;
UPDATE "Idea" SET "sector" = 'software_it', "category" = 'other_it' WHERE "sector" IS NULL;
UPDATE "InvestorRequest" SET "sector" = 'software_it', "industry" = 'other_it' WHERE "sector" IS NULL;
UPDATE "PartnerRequest" SET "sector" = 'software_it', "industry" = 'other_it' WHERE "sector" IS NULL;

ALTER TABLE "Startup" ALTER COLUMN "sector" SET NOT NULL;
ALTER TABLE "Idea" ALTER COLUMN "sector" SET NOT NULL;
ALTER TABLE "InvestorRequest" ALTER COLUMN "sector" SET NOT NULL;
ALTER TABLE "PartnerRequest" ALTER COLUMN "sector" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Startup_sector_idx" ON "Startup"("sector");
CREATE INDEX IF NOT EXISTS "Idea_sector_idx" ON "Idea"("sector");
CREATE INDEX IF NOT EXISTS "InvestorRequest_sector_idx" ON "InvestorRequest"("sector");
CREATE INDEX IF NOT EXISTS "PartnerRequest_sector_idx" ON "PartnerRequest"("sector");
