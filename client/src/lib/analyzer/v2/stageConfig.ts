import type { AnalyzerMode, StartupAnalysisInput, StartupStage } from "../types";

export type ScoreWeights = {
  growth: number;
  unit: number;
  pmf: number;
  efficiency: number;
  market: number;
  subjectiveIdeaSignals: number; // only meaningful on early stages
};

export type StageAnalysisConfig = {
  stage: StartupStage;
  mode: AnalyzerMode;
  /** For businessScore aggregation. Must sum ~1. */
  weights: ScoreWeights;
  /** Keys for completeness expectations (v2). */
  required: Array<keyof StartupAnalysisInput>;
  desired: Array<keyof StartupAnalysisInput>;
  /** Red-flag thresholds */
  thresholds: {
    runwayRedMonths: number;
    runwayYellowMonths: number;
    churnYellow: number; // 0..1
    churnRed: number; // 0..1
    retentionD30Yellow: number; // 0..1
    retentionD30Red: number; // 0..1
  };
};

function baseThresholds(stage: StartupStage) {
  // Stage-aware but intentionally simple. More strict on later stages.
  if (stage === "idea") {
    return {
      runwayRedMonths: 3,
      runwayYellowMonths: 6,
      churnYellow: 0.18,
      churnRed: 0.25,
      retentionD30Yellow: 0.08,
      retentionD30Red: 0.04,
    };
  }
  if (stage === "seed") {
    return {
      runwayRedMonths: 4,
      runwayYellowMonths: 8,
      churnYellow: 0.15,
      churnRed: 0.22,
      retentionD30Yellow: 0.12,
      retentionD30Red: 0.08,
    };
  }
  if (stage === "series_a" || stage === "series_b") {
    return {
      runwayRedMonths: 6,
      runwayYellowMonths: 12,
      churnYellow: 0.12,
      churnRed: 0.18,
      retentionD30Yellow: 0.18,
      retentionD30Red: 0.12,
    };
  }
  if (stage === "growth" || stage === "exit") {
    return {
      runwayRedMonths: 9,
      runwayYellowMonths: 15,
      churnYellow: 0.1,
      churnRed: 0.15,
      retentionD30Yellow: 0.22,
      retentionD30Red: 0.16,
    };
  }
  return {
    runwayRedMonths: 4,
    runwayYellowMonths: 9,
    churnYellow: 0.15,
    churnRed: 0.22,
    retentionD30Yellow: 0.12,
    retentionD30Red: 0.08,
  };
}

export function getStageAnalysisConfig(stage: StartupStage, mode: AnalyzerMode): StageAnalysisConfig {
  const thresholds = baseThresholds(stage);

  if (stage === "idea" || mode === "idea") {
    return {
      stage,
      mode,
      weights: {
        growth: 0.12,
        unit: 0.05,
        pmf: 0.18,
        efficiency: 0.05,
        market: 0.25,
        subjectiveIdeaSignals: 0.35,
      },
      required: ["stage", "mode", "tam", "competitionDensity", "foundersFullTime", "teamStrength", "marketValidation"],
      desired: [
        "tamGrowthPct",
        "moatStrength",
        "customerInterviewsCount",
        "pilotCount",
        "paidPilotCount",
        "loiCount",
        "waitlistSize",
        "founderSalesCallsCount",
        "designPartnerCount",
      ],
      thresholds,
    };
  }

  if (stage === "seed") {
    return {
      stage,
      mode,
      weights: {
        growth: 0.22,
        unit: 0.18,
        pmf: 0.24,
        efficiency: 0.14,
        market: 0.18,
        subjectiveIdeaSignals: 0.04,
      },
      required: ["stage", "mode", "grossMarginPct", "recurringShare", "monthlyChurnPct", "burnMonthly", "cashOnHand", "retentionD30"],
      desired: [
        "activationRate",
        "conversionRate",
        "dau",
        "mau",
        "monthlyRevenue",
        "cac",
        "unitPaybackMonths",
        "releasesPerMonth",
        "teamSize",
        "visitorToSignupConversionPct",
        "signupToActivationPct",
        "activationToPaidPct",
        "timeToValueDays",
        "firstKeyActionCompletionPct",
      ],
      thresholds,
    };
  }

  if (stage === "series_a" || stage === "series_b") {
    return {
      stage,
      mode,
      weights: {
        growth: 0.22,
        unit: 0.26,
        pmf: 0.18,
        efficiency: 0.18,
        market: 0.14,
        subjectiveIdeaSignals: 0.02,
      },
      required: ["stage", "mode", "monthlyRevenue", "grossMarginPct", "cac", "unitPaybackMonths", "burnMonthly", "cashOnHand", "retentionD30"],
      desired: [
        "newRevenueMonthly",
        "salesMarketingSpend",
        "organicGrowthPct",
        "releasesPerMonth",
        "teamSize",
        "nrrPct",
        "grrPct",
        "revenueConcentrationPct",
        "topCustomerSharePct",
        "top3CustomersSharePct",
        "oneOffRevenueSharePct",
        "pilotRevenueSharePct",
      ],
      thresholds,
    };
  }

  if (stage === "growth") {
    return {
      stage,
      mode,
      weights: {
        growth: 0.2,
        unit: 0.28,
        pmf: 0.16,
        efficiency: 0.22,
        market: 0.12,
        subjectiveIdeaSignals: 0.02,
      },
      required: ["stage", "mode", "monthlyRevenue", "grossMarginPct", "cac", "unitPaybackMonths", "burnMonthly", "cashOnHand", "retentionD30"],
      desired: [
        "nrrPct",
        "grrPct",
        "revenueConcentrationPct",
        "topCustomerSharePct",
        "top3CustomersSharePct",
        "oneOffRevenueSharePct",
        "pilotRevenueSharePct",
        "dau",
        "mau",
        "organicGrowthPct",
      ],
      thresholds,
    };
  }

  // exit
  return {
    stage,
    mode,
    weights: {
      growth: 0.12,
      unit: 0.28,
      pmf: 0.14,
      efficiency: 0.28,
      market: 0.14,
      subjectiveIdeaSignals: 0.04,
    },
    required: ["stage", "mode", "monthlyRevenue", "grossMarginPct", "burnMonthly", "cashOnHand", "retentionD30"],
    desired: [
      "nrrPct",
      "grrPct",
      "revenueConcentrationPct",
      "topCustomerSharePct",
      "top3CustomersSharePct",
      "oneOffRevenueSharePct",
      "pilotRevenueSharePct",
      "cac",
      "unitPaybackMonths",
    ],
    thresholds,
  };
}

