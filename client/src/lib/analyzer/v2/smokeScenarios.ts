import { computeStartupAnalysis } from "../computeStartupAnalysis";
import type { StartupAnalysisInput, StartupAnalysisResult } from "../types";

type SmokeScenario = {
  id: string;
  title: string;
  input: StartupAnalysisInput;
};

function baseInput(): StartupAnalysisInput {
  return {
    mode: "startup",
    stage: "seed",
    title: "Smoke scenario",
    description: "Авто-сценарий для проверки детерминированного движка.",
    industryLabel: "SaaS",

    marketValidation: 50,
    competition: "medium",
    moatStrength: 50,
    tractionScore: 50,
    teamStrength: 50,

    grossMarginPct: 70,
    activeUsers: 300,
    arpu: 3000,
    recurringShare: 0.7,
    monthlyChurnPct: 4,
    cac: 25000,
    unitPaybackMonths: 12,
    growthMonthlyPct: 6,

    monthlyRevenue: 0,
    newRevenueMonthly: 120000,
    salesMarketingSpend: 200000,
    burnMonthly: 350000,
    cashOnHand: 2000000,

    dau: 60,
    mau: 300,
    retentionD1: 0.25,
    retentionD7: 0.15,
    retentionD30: 0.1,
    activationRate: 0.12,
    conversionRate: 0.04,
    organicGrowthPct: 8,
    viralCoefficient: 0.3,

    repeatPurchaseRate: 0.2,

    releasesPerMonth: 2,
    teamSize: 6,
    foundersFullTime: true,

    tam: 2e9,
    tamGrowthPct: 12,
    competitionDensity: 0.55,

    regulatory: "medium",
    tech: "medium",
  };
}

export function getAnalyzerSmokeScenarios(): SmokeScenario[] {
  const s1: SmokeScenario = {
    id: "idea_no_revenue",
    title: "Idea-stage без выручки",
    input: {
      ...baseInput(),
      mode: "idea",
      stage: "idea",
      monthlyRevenue: 0,
      activeUsers: 0,
      arpu: 0,
      cac: 0,
      unitPaybackMonths: 0,
      marketValidation: 70,
      foundersFullTime: true,
      customerInterviewsCount: 18,
      pilotCount: 2,
      loiCount: 1,
      waitlistSize: 320,
    },
  };

  const s2: SmokeScenario = {
    id: "seed_bad_runway_retention",
    title: "Seed: слабый runway и удержание",
    input: {
      ...baseInput(),
      stage: "seed",
      retentionD30: 0.06,
      monthlyChurnPct: 12,
      burnMonthly: 600000,
      cashOnHand: 1200000,
    },
  };

  const s3: SmokeScenario = {
    id: "growth_good_units",
    title: "Growth: сильная юнит-экономика",
    input: {
      ...baseInput(),
      stage: "growth",
      monthlyRevenue: 4500000,
      activeUsers: 0,
      arpu: 0,
      monthlyChurnPct: 2.5,
      retentionD30: 0.28,
      grossMarginPct: 80,
      cac: 45000,
      unitPaybackMonths: 6,
      nrrPct: 118,
      topCustomerSharePct: 18,
      revenueConcentrationPct: 28,
      burnMonthly: 1200000,
      cashOnHand: 18000000,
    },
  };

  const s4: SmokeScenario = {
    id: "contradictory_inputs",
    title: "Противоречивые данные (anti-gaming)",
    input: {
      ...baseInput(),
      stage: "seed",
      moatStrength: 90,
      competitionDensity: 0.85,
      retentionD30: 0.07,
      teamStrength: 85,
      foundersFullTime: false,
      dau: 500,
      mau: 200, // impossible (DAU > MAU)
      marketValidation: 90,
      activeUsers: 0,
      monthlyRevenue: 0,
      customerInterviewsCount: 0,
      waitlistSize: 0,
    },
  };

  return [s1, s2, s3, s4];
}

export type SmokeScenarioResult = {
  id: string;
  title: string;
  ok: boolean;
  notes: string[];
  verdict?: string;
  confidence?: string;
  completenessPct?: number;
  consistencyScore?: number;
  warnings?: string[];
};

export function runAnalyzerSmokeScenarios(): SmokeScenarioResult[] {
  const scenarios = getAnalyzerSmokeScenarios();
  const out: SmokeScenarioResult[] = [];

  for (const s of scenarios) {
    let r: StartupAnalysisResult;
    try {
      r = computeStartupAnalysis(s.input);
    } catch (e) {
      out.push({
        id: s.id,
        title: s.title,
        ok: false,
        notes: [`Падение расчёта: ${String((e as any)?.message ?? e)}`],
      });
      continue;
    }

    const notes: string[] = [];
    let ok = true;

    if ((s.input.stage === "idea" || s.input.mode === "idea") && (r.analysisVersion !== "v2" || !r.actionPriorities?.length)) {
      ok = false;
      notes.push("idea-stage: ожидаются v2 слои и actionPriorities.");
    }
    if (s.id === "seed_bad_runway_retention") {
      const hasRedOrWarn = (r.redFlags?.red?.length ?? 0) + (r.consistencyChecks?.warnings?.length ?? 0) > 0;
      if (!hasRedOrWarn) {
        ok = false;
        notes.push("seed: ожидались флаги/предупреждения при слабом runway/retention.");
      }
    }
    if (s.id === "growth_good_units") {
      if ((r.unitEconomicsScore ?? 0) < 55) {
        ok = false;
        notes.push("growth: ожидался не низкий unitEconomicsScore при хороших вводных.");
      }
    }
    if (s.id === "contradictory_inputs") {
      if ((r.consistencyChecks?.warnings?.length ?? 0) < 2) {
        ok = false;
        notes.push("anti-gaming: ожидались warnings при противоречивых данных.");
      }
      if ((r.consistencyScore ?? 100) > 80) {
        ok = false;
        notes.push("anti-gaming: consistencyScore должен снижаться заметно.");
      }
    }

    out.push({
      id: s.id,
      title: s.title,
      ok,
      notes: notes.length ? notes : ["OK"],
      verdict: r.decisionReasoning?.verdict,
      confidence: r.estimateConfidenceLabel,
      completenessPct: r.dataCompletenessPct,
      consistencyScore: r.consistencyScore,
      warnings: r.consistencyChecks?.warnings,
    });
  }

  return out;
}

