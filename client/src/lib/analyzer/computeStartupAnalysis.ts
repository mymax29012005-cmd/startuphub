import type { StartupAnalysisInput, StartupAnalysisResult } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreFromRange(value: number, min: number, max: number) {
  // Higher value => higher score
  if (max === min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

function riskFromSelect(level: "low" | "medium" | "high") {
  if (level === "low") return 20;
  if (level === "medium") return 50;
  return 80;
}

/**
 * Deterministic (no AI) scoring & valuation heuristic.
 * Intentionally "good enough" for a demo/offline analyzer.
 */
export function computeStartupAnalysis(input: StartupAnalysisInput): StartupAnalysisResult {
  const recurringShare = clamp(input.recurringShare, 0, 1);

  // --- Financials base ---
  const grossMarginFraction = clamp(input.grossMarginPct / 100, 0, 1);

  const monthlyRevenue =
    input.monthlyRevenue > 0
      ? input.monthlyRevenue
      : input.activeUsers * input.arpu * recurringShare;

  // Unit economics
  const monthlyChurnFraction = clamp(input.monthlyChurnPct / 100, 0.0001, 0.5);
  const ltv = input.arpu / monthlyChurnFraction; // simplified LTV for subscription

  // If payback months is provided, use it; otherwise approximate.
  const paybackMonths =
    input.unitPaybackMonths > 0 ? input.unitPaybackMonths : input.cac / Math.max(1, (input.arpu * grossMarginFraction) / 12);

  // --- Traction & risk components (0..100 risk score, higher means worse) ---
  const marketRisk = clamp(100 - input.marketValidation, 0, 100);
  const competitionRisk = riskFromSelect(input.competition);
  const executionRisk = clamp(100 - input.teamStrength, 0, 100);
  const regulatoryRisk = riskFromSelect(input.regulatory);
  const techRisk = riskFromSelect(input.tech);

  const runwayMonths = input.burnMonthly > 0 ? input.cashOnHand / input.burnMonthly : 120;
  const financialRisk =
    runwayMonths >= 24
      ? 20
      : runwayMonths >= 12
        ? 45
        : runwayMonths >= 6
          ? 60
          : runwayMonths >= 3
            ? 75
            : 90;

  // --- Scores (0..100) ---
  const riskAvg = clamp(
    (marketRisk * 0.25 +
      competitionRisk * 0.15 +
      executionRisk * 0.20 +
      financialRisk * 0.25 +
      regulatoryRisk * 0.10 +
      techRisk * 0.05) /
      1,
    0,
    100,
  );

  const successProbability = clamp(1 - Math.pow(riskAvg / 100, 1.2), 0.05, 0.9);

  // Unit economics score: prefer healthy gross margin and LTV/CAC.
  const ltvCac = input.cac > 0 ? ltv / input.cac : 10;
  const ltvCacScore = clamp(((Math.log10(Math.max(1e-6, ltvCac)) - 0) / 2) * 100, 0, 100);
  const grossMarginScore = clamp(grossMarginFraction * 120, 0, 100);
  const unitEconomicsScore = clamp(ltvCacScore * 0.6 + grossMarginScore * 0.4, 0, 100);

  const tractionScore = clamp(
    input.growthMonthlyPct * 3 + input.marketValidation * 0.2 + input.tractionScore * 0.25,
    0,
    100,
  );

  const financialScore = clamp(100 - financialRisk, 0, 100);
  const teamMoatScore = clamp(input.teamStrength * 0.65 + input.moatStrength * 0.35, 0, 100);

  // --- Discounted cash flow (5 years) ---
  const stageBaseDiscount = (() => {
    switch (input.stage) {
      case "idea":
        return 0.35;
      case "seed":
        return 0.28;
      case "series_a":
        return 0.22;
      case "series_b":
        return 0.18;
      case "growth":
        return 0.15;
      case "exit":
        return 0.13;
      default:
        return 0.22;
    }
  })();

  const riskPremium = (riskAvg / 100) * 0.12; // adds up to ~12%
  const discountRate = stageBaseDiscount + riskPremium;

  const annualRevenue0 = monthlyRevenue * 12;
  const annualGrossProfit0 = annualRevenue0 * grossMarginFraction;
  const burnAnnual = input.burnMonthly * 12;

  let npv = 0;
  const yearCashflows: number[] = [];
  for (let year = 1; year <= 5; year++) {
    const growthFactor = Math.pow(1 + input.growthMonthlyPct / 100, 12 * year);
    // Approximation: growth compounds over months in each year.
    const annualRevenue = annualRevenue0 * growthFactor;
    const grossProfit = annualRevenue * grossMarginFraction;
    const cashflow = grossProfit - burnAnnual; // ignore working capital for simplicity
    yearCashflows.push(cashflow);
    const pv = cashflow / Math.pow(1 + discountRate, year);
    npv += pv;
  }

  // --- Valuation heuristic (based on ARR multiple) ---
  const annualRecurringRevenue = annualRevenue0 * recurringShare;
  const baseMultiple = (() => {
    switch (input.stage) {
      case "idea":
        return 2.5;
      case "seed":
        return 4.5;
      case "series_a":
        return 6.0;
      case "series_b":
        return 7.5;
      case "growth":
        return 9.0;
      case "exit":
        return 10.0;
      default:
        return 4.5;
    }
  })();

  const multiple = baseMultiple * (0.55 + 0.45 * successProbability);
  const valuationLow = annualRecurringRevenue * multiple * 0.85;
  const valuationHigh = annualRecurringRevenue * multiple * 1.15;
  const expectedValue = (valuationLow + valuationHigh) / 2 * successProbability;

  // Break-even monthly revenue (gross margin offsets burn)
  const breakEvenMonthlyRevenue =
    input.burnMonthly > 0 && grossMarginFraction > 0 ? input.burnMonthly / grossMarginFraction : 0;

  return {
    monthlyRevenue,
    ltv,
    paybackMonths,

    tractionScore,
    unitEconomicsScore,
    teamMoatScore,
    financialScore,

    marketRisk,
    competitionRisk,
    executionRisk,
    financialRisk,
    regulatoryRisk,
    techRisk,

    riskAvg,
    successProbability,

    discountRate,
    yearCashflows,
    npv,

    annualRecurringRevenue,
    multiple,
    valuationLow,
    valuationHigh,
    expectedValue,

    runwayMonths,
    breakEvenMonthlyRevenue,
  };
}

