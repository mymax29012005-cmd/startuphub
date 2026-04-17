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

  // Market & positioning
  marketValidation: number; // 0..100
  competition: CompetitionLevel;
  moatStrength: number; // 0..100

  // Traction / execution
  tractionScore: number; // 0..100 (self-assessment)
  teamStrength: number; // 0..100

  // Unit economics & growth
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
  burnMonthly: number; // ₽ per month
  cashOnHand: number; // ₽ in cash

  regulatory: RiskLevel;
  tech: RiskLevel;
};

export type StartupAnalysisResult = {
  monthlyRevenue: number;
  ltv: number;
  paybackMonths: number;

  tractionScore: number;
  unitEconomicsScore: number;
  teamMoatScore: number;
  financialScore: number;

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
  npv: number;

  annualRecurringRevenue: number;
  multiple: number;
  valuationLow: number;
  valuationHigh: number;
  expectedValue: number;

  runwayMonths: number;
  breakEvenMonthlyRevenue: number;
};

