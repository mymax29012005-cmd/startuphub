export const allowedCategories = [
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

export type AllowedCategory = (typeof allowedCategories)[number];

