/**
 * Категории карточек (синхронно с server/src/lib/categories.ts).
 * В формах используется массив { value, label }; в фильтрах — .value.
 */
const SLUGS = [
  "SaaS",
  "AI",
  "FinTech",
  "EdTech",
  "HealthTech",
  "E-commerce",
  "Marketplace",
  "Mobile",
  "Web",
  "Hardware",
  "Gaming",
  "Media",
  "Other",
] as const;

export type AllowedCategory = (typeof SLUGS)[number];

export const allowedCategories = SLUGS.map((value) => ({ value, label: value }));

export function asAllowedCategory(raw: string): AllowedCategory {
  return (SLUGS as readonly string[]).includes(raw) ? (raw as AllowedCategory) : "Other";
}
