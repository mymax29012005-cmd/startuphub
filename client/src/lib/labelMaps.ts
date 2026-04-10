import type { Lang } from "@/i18n/dictionaries";

export const stageLabelsByLang: Record<Lang, Record<string, string>> = {
  ru: {
    idea: "Идея (концепт)",
    seed: "Прототип / первые пользователи",
    series_a: "Есть продажи / масштабирование",
    series_b: "Активный рост / расширение",
    growth: "Стабильный рост",
    exit: "Выход (продажа/exit)",
  },
  en: {
    idea: "Idea",
    seed: "Seed",
    series_a: "Series A",
    series_b: "Series B",
    growth: "Growth",
    exit: "Exit",
  },
  zh: {
    idea: "创意",
    seed: "种子轮",
    series_a: "A轮",
    series_b: "B轮",
    growth: "成长期",
    exit: "退出",
  },
};

export const formatLabelsByLang: Record<Lang, Record<string, string>> = {
  ru: { online: "Онлайн", offline: "Офлайн", hybrid: "Гибрид" },
  en: { online: "Online", offline: "Offline", hybrid: "Hybrid" },
  zh: { online: "线上", offline: "线下", hybrid: "混合" },
};

export const accountTypeLabelsByLang: Record<Lang, Record<string, string>> = {
  ru: { founder: "Основатель", investor: "Инвестор", partner: "Партнёр", buyer: "Покупатель" },
  en: { founder: "Founder", investor: "Investor", partner: "Partner", buyer: "Buyer" },
  zh: { founder: "创始人", investor: "投资人", partner: "合作伙伴", buyer: "买家" },
};

export const partnerRoleLabelsByLang: Record<Lang, Record<string, string>> = {
  ru: { supplier: "Поставщик", reseller: "Реселлер", integration: "Интеграция", cofounder: "Кофаундер" },
  en: { supplier: "Supplier", reseller: "Reseller", integration: "Integration", cofounder: "Co-founder" },
  zh: { supplier: "供应商", reseller: "分销商", integration: "集成", cofounder: "联合创始人" },
};

