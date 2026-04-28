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

  // Subjective fields (kept for backward compatibility / history UI).
  // v2: may be used as bounded signals on early stages, but anti-gaming rules
  // reduce confidence when they contradict objective metrics.
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

  // Optional evidence fields (v2). Safe for backward compatibility.
  customerInterviewsCount?: number; // count
  pilotCount?: number; // count
  paidPilotCount?: number; // count
  loiCount?: number; // count
  waitlistSize?: number; // count
  founderSalesCallsCount?: number; // count
  designPartnerCount?: number; // count

  // Mature-stage optional fields (v2).
  nrrPct?: number; // %
  grrPct?: number; // % (gross revenue retention)
  revenueConcentrationPct?: number; // % revenue from top customer (0..100)
  topCustomerSharePct?: number; // % revenue share of top customer (0..100)
  top3CustomersSharePct?: number; // % revenue share of top-3 customers (0..100)
  oneOffRevenueSharePct?: number; // % one-off revenue share (0..100)
  pilotRevenueSharePct?: number; // % pilot/POC revenue share (0..100)

  // Funnel quality (optional, v2)
  visitorToSignupConversionPct?: number; // %
  signupToActivationPct?: number; // %
  activationToPaidPct?: number; // %
  timeToValueDays?: number; // days
  firstKeyActionCompletionPct?: number; // %

  // Moat evidence (structured, optional, v2)
  moatEvidenceProprietaryData?: boolean;
  moatEvidenceSwitchingCosts?: boolean;
  moatEvidenceIntegrationDepth?: boolean;
  moatEvidenceDistributionAdvantage?: boolean;
  moatEvidenceRegulatoryBarrier?: boolean;
  moatEvidenceNetworkEffects?: boolean;
  moatEvidenceBrandCommunity?: boolean;
  moatEvidenceOperationalSpeed?: boolean;

  // Market structure (Porter-lite, optional overrides, v2) 0..100
  buyerPowerScore?: number;
  supplierPowerScore?: number;
  threatOfNewEntrantsScore?: number;
  substitutePressureScore?: number;
  rivalryScore?: number;
};

export type EstimateConfidenceLabel = "low" | "medium" | "high";

export type InvestmentVerdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

export type ConsistencyChecks = {
  warnings: string[];
  penalties: string[];
  contradictionsFound: number;
};

export type DecisionReasoning = {
  verdict: InvestmentVerdict;
  because: string[];
  blockers: string[];
  topPositiveDrivers: string[];
  topNegativeDrivers: string[];
  whatChangesDecision: string[];
  nextMilestoneFocus: string[];
};

export type SensitivityDriver = {
  key: string;
  label: string;
  direction: "positive" | "negative";
  impactLabel: string;
  description: string;
};

export type ActionPriorityItem = {
  title: string;
  reason: string;
  expectedImpact: string;
  improves: string[];
  priority: "high" | "medium" | "low";
};

export type RedFlags = {
  red: string[];
  yellow: string[];
  info: string[];
};

export type SwotQuadrant = "strengths" | "weaknesses" | "opportunities" | "threats";
export type SwotItem = { quadrant: SwotQuadrant; title: string; evidence: string[] };
export type AutoSwot = {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
};

export type ScenarioCase = "base" | "upside" | "stress";
export type ScenarioSummary = {
  case: ScenarioCase;
  title: string;
  assumptions: string[];
  successProbabilityRange?: { low: number; high: number }; // percent
  notes: string[];
};

export type StartupAnalysisResult = {
  // Versioning (v2 adds explainability & stage-aware layers).
  analysisVersion?: "v1" | "v2";

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

  // v2: ranges & confidence layers
  businessScore?: number; // 0..100
  dataConfidenceScore?: number; // 0..100
  dataCompletenessPct?: number; // 0..100
  stageFitScore?: number; // 0..100
  consistencyScore?: number; // 0..100
  estimateConfidenceLabel?: EstimateConfidenceLabel;
  successProbabilityRange?: { low: number; high: number }; // percent 0..100
  valuationRangeHuman?: { low: string; base: string; high: string };

  strongestArea?: string;
  mainBottleneck?: string;

  decisionReasoning?: DecisionReasoning;
  consistencyChecks?: ConsistencyChecks;
  sensitivityAnalysis?: { topDrivers: SensitivityDriver[] };
  actionPriorities?: ActionPriorityItem[];
  redFlags?: RedFlags;

  // v2 extra objective layers (optional for backward compatibility)
  revenueQualityScore?: number; // 0..100
  concentrationRiskScore?: number; // 0..100 (higher = worse)
  customerConcentrationRisk?: number; // 0..100 (higher = worse)
  revenueQualityNotes?: string[];
  moatEvidenceScore?: number; // 0..100
  moatGapFlag?: boolean;
  moatEvidenceNotes?: string[];
  stageEvidenceScore?: number; // 0..100
  stageEvidenceNotes?: string[];
  funnelQualityScore?: number; // 0..100
  funnelQualityNotes?: string[];
  marketStructurePressureScore?: number; // 0..100 (higher = worse)
  marketStructureNotes?: string[];
  swot?: AutoSwot;
  scenarioSummary?: ScenarioSummary[];

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

