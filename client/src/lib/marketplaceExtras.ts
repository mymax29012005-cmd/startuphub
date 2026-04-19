export type IdeaProfileExtra = {
  city?: string;
  doneItems?: string[];
  helpTags?: string[];
  needsText?: string;
  /** Preset key for Tailwind gradient on hero / accents */
  coverGradient?: string;
};

export type InvestorProfileExtra = {
  investorName?: string;
  investorTitle?: string;
  checkMin?: number;
  checkMax?: number;
  stages?: string[];
  dealsCount?: number;
  exitsCount?: number;
  interests?: string[];
};

export type PartnerService = { title: string; note?: string };

export type PartnerProfileExtra = {
  partnerName?: string;
  partnerType?: string;
  helpText?: string;
  services?: PartnerService[];
  fitFor?: string[];
  ctaText?: string;
};

export function ideaHeroGradientClass(key?: string | null) {
  switch (key) {
    case "emerald":
      return "from-emerald-500 to-teal-500";
    case "violet":
      return "from-violet-600 to-rose-500";
    case "blue":
      return "from-blue-500 to-cyan-500";
    default:
      return "from-amber-500 to-orange-500";
  }
}

export function formatMoneyRub(n: number) {
  return Number(n || 0).toLocaleString("ru-RU") + " ₽";
}

export function formatCheckRangeRub(extra: InvestorProfileExtra | null | undefined, fallbackAmount: number) {
  const min = extra?.checkMin;
  const max = extra?.checkMax;
  if (min != null && max != null) return `${formatMoneyRub(min)} – ${formatMoneyRub(max)}`;
  if (max != null) return formatMoneyRub(max);
  if (min != null) return `от ${formatMoneyRub(min)}`;
  return formatMoneyRub(fallbackAmount);
}
