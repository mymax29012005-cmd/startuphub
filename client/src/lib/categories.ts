export type CategoryOption = { value: string; label: string };

// Один общий перечень, чтобы люди не плодили новые "категории" как попало.
export const allowedCategories: CategoryOption[] = [
  { value: "SaaS", label: "SaaS" },
  { value: "AI", label: "AI / ML" },
  { value: "FinTech", label: "FinTech" },
  { value: "EdTech", label: "EdTech" },
  { value: "HealthTech", label: "HealthTech" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Marketplace", label: "Маркетплейс" },
  { value: "Mobile", label: "Мобильное приложение" },
  { value: "Web", label: "Веб-сервис" },
  { value: "Hardware", label: "Hardware / IoT" },
  { value: "Gaming", label: "Игры" },
  { value: "Media", label: "Медиа / Контент" },
  { value: "Other", label: "Другое" },
];

