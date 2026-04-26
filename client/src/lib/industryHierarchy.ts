/**
 * Иерархия: отрасль (sector) → категория (subcategory id, хранится в поле category / industry).
 * Синхронно с server/src/lib/industryHierarchy.ts
 */

export type SectorId =
  | "software_it"
  | "finance"
  | "health"
  | "education"
  | "commerce"
  | "industrial"
  | "logistics"
  | "energy_eco"
  | "food_agri"
  | "offline_services"
  | "business_work"
  | "media_entertainment";

export type IndustryCategory = { id: string; label: string };

export const INDUSTRY_SECTORS: ReadonlyArray<{ id: SectorId; label: string }> = [
  { id: "software_it", label: "💻 Программное обеспечение и IT" },
  { id: "finance", label: "💰 Финансы" },
  { id: "health", label: "🏥 Здоровье" },
  { id: "education", label: "🎓 Образование" },
  { id: "commerce", label: "🛒 Коммерция" },
  { id: "industrial", label: "🏭 Промышленность и оборудование" },
  { id: "logistics", label: "🚚 Логистика и транспорт" },
  { id: "energy_eco", label: "🌱 Энергия и экология" },
  { id: "food_agri", label: "🍔 Еда и сельское хозяйство" },
  { id: "offline_services", label: "🏢 Оффлайн и сервисные отрасли" },
  { id: "business_work", label: "👔 Бизнес и работа" },
  { id: "media_entertainment", label: "🎮 Медиа и развлечения" },
] as const;

export const INDUSTRY_CATEGORIES_BY_SECTOR: Record<SectorId, IndustryCategory[]> = {
  software_it: [
    { id: "saas", label: "SaaS (ПО как сервис)" },
    { id: "ai_ml", label: "Искусственный интеллект (AI / ML)" },
    { id: "cybersecurity", label: "Кибербезопасность" },
    { id: "devtools", label: "Инструменты для разработчиков" },
    { id: "cloud_infra", label: "Облака и инфраструктура" },
    { id: "other_it", label: "Другое (IT)" },
  ],
  finance: [
    { id: "fintech", label: "Финтех" },
    { id: "payments", label: "Платежи" },
    { id: "lending", label: "Кредитование" },
    { id: "insurtech", label: "Страхование (InsurTech)" },
    { id: "crypto_web3", label: "Крипто / Web3" },
  ],
  health: [
    { id: "healthtech", label: "HealthTech (медицина и технологии)" },
    { id: "biotech", label: "Биотехнологии (BioTech)" },
    { id: "mental_health", label: "Ментальное здоровье" },
    { id: "fitness_wellness", label: "Фитнес и wellness" },
    { id: "medical_devices", label: "Медицинские устройства" },
  ],
  education: [
    { id: "edtech", label: "EdTech" },
    { id: "corporate_learning", label: "Корпоративное обучение" },
    { id: "online_courses", label: "Онлайн-курсы" },
    { id: "kids_education", label: "Детское образование" },
  ],
  commerce: [
    { id: "ecommerce", label: "E-commerce" },
    { id: "marketplaces", label: "Маркетплейсы" },
    { id: "retailtech", label: "RetailTech (технологии для ритейла)" },
    { id: "d2c", label: "D2C-бренды" },
  ],
  industrial: [
    { id: "hardware", label: "Hardware (железо)" },
    { id: "robotics", label: "Робототехника" },
    { id: "iot", label: "IoT (интернет вещей)" },
    { id: "manufacturing", label: "Производство" },
  ],
  logistics: [
    { id: "logistics_core", label: "Логистика" },
    { id: "supply_chain", label: "Цепочки поставок" },
    { id: "delivery", label: "Доставка" },
    { id: "mobility", label: "Транспорт / мобильность" },
  ],
  energy_eco: [
    { id: "climatetech", label: "ClimateTech / GreenTech" },
    { id: "clean_energy", label: "Чистая энергия" },
    { id: "sustainability", label: "Устойчивое развитие" },
    { id: "recycling", label: "Переработка отходов" },
  ],
  food_agri: [
    { id: "foodtech", label: "FoodTech" },
    { id: "agritech", label: "AgriTech" },
    { id: "food_delivery", label: "Доставка еды" },
    { id: "alt_food", label: "Альтернативная еда (plant-based и т.д.)" },
  ],
  offline_services: [
    { id: "proptech", label: "PropTech (недвижимость)" },
    { id: "constructiontech", label: "ConstructionTech (строительство)" },
    { id: "traveltech", label: "TravelTech (туризм)" },
    { id: "eventtech", label: "EventTech (ивенты)" },
  ],
  business_work: [
    { id: "hrtech", label: "HRTech" },
    { id: "legaltech", label: "LegalTech" },
    { id: "govtech", label: "GovTech" },
    { id: "productivity", label: "Продуктивность и управление" },
  ],
  media_entertainment: [
    { id: "gaming", label: "Игры (Gaming)" },
    { id: "media", label: "Медиа" },
    { id: "creator_economy", label: "Creator Economy (экономика авторов)" },
    { id: "ar_vr", label: "AR / VR" },
  ],
};

const SECTOR_IDS = new Set<string>(INDUSTRY_SECTORS.map((s) => s.id));

const SUBCATEGORY_TO_SECTOR = new Map<string, SectorId>();
for (const s of INDUSTRY_SECTORS) {
  for (const c of INDUSTRY_CATEGORIES_BY_SECTOR[s.id]) {
    SUBCATEGORY_TO_SECTOR.set(c.id, s.id);
  }
}

export function isSectorId(v: string): v is SectorId {
  return SECTOR_IDS.has(v);
}

export function isValidIndustryPair(sector: string, subcategoryId: string): boolean {
  if (!isSectorId(sector)) return false;
  const list = INDUSTRY_CATEGORIES_BY_SECTOR[sector];
  return list.some((c) => c.id === subcategoryId);
}

export function sectorLabel(sector: string): string {
  const s = INDUSTRY_SECTORS.find((x) => x.id === sector);
  return s?.label ?? sector;
}

export function subcategoryLabel(subcategoryId: string): string {
  const sec = SUBCATEGORY_TO_SECTOR.get(subcategoryId);
  if (!sec) return subcategoryId;
  const c = INDUSTRY_CATEGORIES_BY_SECTOR[sec].find((x) => x.id === subcategoryId);
  return c?.label ?? subcategoryId;
}

/** Старые значения category/industry до иерархии */
export function migrateLegacyCategoryToken(old: string): { sector: SectorId; subcategoryId: string } {
  const x = (old ?? "").trim();
  const map: Record<string, { sector: SectorId; subcategoryId: string }> = {
    SaaS: { sector: "software_it", subcategoryId: "saas" },
    AI: { sector: "software_it", subcategoryId: "ai_ml" },
    FinTech: { sector: "finance", subcategoryId: "fintech" },
    EdTech: { sector: "education", subcategoryId: "edtech" },
    HealthTech: { sector: "health", subcategoryId: "healthtech" },
    "E-commerce": { sector: "commerce", subcategoryId: "ecommerce" },
    Marketplace: { sector: "commerce", subcategoryId: "marketplaces" },
    Mobile: { sector: "software_it", subcategoryId: "devtools" },
    Web: { sector: "software_it", subcategoryId: "devtools" },
    Hardware: { sector: "industrial", subcategoryId: "hardware" },
    Gaming: { sector: "media_entertainment", subcategoryId: "gaming" },
    Media: { sector: "media_entertainment", subcategoryId: "media" },
    Other: { sector: "software_it", subcategoryId: "other_it" },
  };
  return map[x] ?? { sector: "software_it", subcategoryId: "other_it" };
}

export function formatIndustryLine(sector: string | undefined | null, subcategoryId: string | undefined | null): string {
  const sec = (sector && isSectorId(sector) ? sector : null) ?? (subcategoryId ? SUBCATEGORY_TO_SECTOR.get(subcategoryId) : null);
  const sub = subcategoryId ?? "";
  if (sec && sub && isValidIndustryPair(sec, sub)) {
    return `${sectorLabel(sec)} · ${subcategoryLabel(sub)}`;
  }
  if (sub) return subcategoryLabel(sub);
  if (sec) return sectorLabel(sec);
  return "";
}

export function normalizeIndustryPair(
  sector: string | null | undefined,
  subcategoryId: string | null | undefined,
): { sector: SectorId; subcategoryId: string } {
  const sub = (subcategoryId ?? "").trim();
  const sec = (sector ?? "").trim();
  if (isSectorId(sec) && sub && isValidIndustryPair(sec, sub)) return { sector: sec, subcategoryId: sub };
  if (sub && SUBCATEGORY_TO_SECTOR.has(sub)) return { sector: SUBCATEGORY_TO_SECTOR.get(sub)!, subcategoryId: sub };
  return migrateLegacyCategoryToken(sub || "Other");
}
