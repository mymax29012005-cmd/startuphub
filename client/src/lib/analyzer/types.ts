export type CompetitionLevel = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

export type StartupStage =
  | "idea"
  | "seed"
  | "series_a"
  | "series_b"
  | "growth"
  | "exit";

export type AnalyzerMode = "startup" | "idea";

export type StartupAnalysisInput = {
  mode: AnalyzerMode;
  stage: StartupStage;

  // Optional presentation fields (not used by the math model, but useful for UI/history)
  title?: string;
  description?: string;
  industryLabel?: string;

  // Legacy subjective fields (kept for backward compatibility / history UI).
  // IMPORTANT: must not affect the score model.
  marketValidation: number; // 0..100 (ignored by the math model)
  competition: CompetitionLevel; // legacy select, mapped to competitionDensity in the new model when needed
  moatStrength: number; // 0..100 (ignored by the math model)
  tractionScore: number; // 0..100 (ignored by the math model)
  teamStrength: number; // 0..100 (ignored by the math model)

  // Unit economics & growth (base)
  grossMarginPct: number; // 0..100
  activeUsers: number; // if monthlyRevenue==0
  arpu: number; // ₽ per active user
  recurringShare: number; // 0..1
  monthlyChurnPct: number; // 0..30
  cac: number; // ₽
  unitPaybackMonths: number; // months, 0 -> estimate
  growthMonthlyPct: number; // 0..30

  // Current finance
  monthlyRevenue: number; // ₽, if known; else 0
  newRevenueMonthly: number; // ₽ new revenue this month (for burn multiple / magic number)
  salesMarketingSpend: number; // ₽ sales+marketing spend per month
  burnMonthly: number; // ₽ per month
  cashOnHand: number; // ₽ in cash

  // Product / usage
  dau: number;
  mau: number;
  retentionD1: number; // 0..1
  retentionD7: number; // 0..1
  retentionD30: number; // 0..1
  activationRate: number; // 0..1
  conversionRate: number; // 0..1
  organicGrowthPct: number; // %
  viralCoefficient: number; // k-factor (0..3)

  // Revenue / repeat
  repeatPurchaseRate: number; // 0..1

  // Operations / execution
  releasesPerMonth: number;
  teamSize: number;
  foundersFullTime: boolean;

  // Market (new)
  tam: number; // total addressable market size, ₽
  tamGrowthPct: number; // %
  competitionDensity: number; // 0..1

  regulatory: RiskLevel;
  tech: RiskLevel;
};

export type StartupAnalysisResult = {
  monthlyRevenue: number;
  arr: number;
  ltv: number;
  paybackMonths: number;
  churn: number;
  grossMargin: number;
  burnMultiple: number;
  magicNumber: number;
  runwayMonths: number;
  stickiness: number;
  ltvToCac: number;

  // Scores (0..100)
  pmfScore: number;
  unitEconomicsScore: number; // alias of unitScore for compatibility with existing UI
  growthScore: number;
  efficiencyScore: number;
  marketScore: number;
  investorScore: number;
  confidenceScore: number;

  // Legacy compatibility fields (keep existing UI working)
  tractionScore: number; // alias -> growthScore
  financialScore: number; // alias -> efficiencyScore
  teamMoatScore: number; // kept as 0..100 but no longer affects the model

  // Risk decomposition (0..100, higher = worse)
  marketRisk: number;
  competitionRisk: number;
  executionRisk: number;
  financialRisk: number;
  regulatoryRisk: number;
  techRisk: number;

  riskAvg: number; // 0..100 (higher = worse)
  successProbability: number; // 0..1

  discountRate: number; // 0..1
  yearCashflows: number[];
  dcf: number;
  valuationARR: number;

  valuationLow: number;
  valuationHigh: number;
  valuationBase: number;
  expectedValue: number;

  breakEvenMonthlyRevenue: number;
};

