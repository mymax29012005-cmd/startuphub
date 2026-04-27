import type { StartupAnalysisInput, StartupAnalysisResult } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalize(value: number, min: number, max: number) {
  if (value <= min) return 0;
  if (value >= max) return 1;
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Data-driven deterministic scoring (no AI).
 * Formulas are intentionally fixed to match the spec.
 */
export function computeStartupAnalysis(input: StartupAnalysisInput): StartupAnalysisResult {
  const recurringShare = clamp(input.recurringShare, 0, 1);

  // BASE
  const monthlyRevenue = input.monthlyRevenue > 0 ? input.monthlyRevenue : input.activeUsers * input.arpu * recurringShare;
  const churn = input.monthlyChurnPct / 100;

  // LTV
  const ltv = churn > 0 ? input.arpu / churn : input.arpu * 24;

  // PAYBACK
  const grossMargin = input.grossMarginPct / 100;
  const paybackMonths = input.unitPaybackMonths > 0 ? input.unitPaybackMonths : input.cac > 0 ? input.cac / Math.max(1e-9, input.arpu * grossMargin) : 0;

  // BURN MULTIPLE
  const burnMultiple = input.newRevenueMonthly > 0 ? input.burnMonthly / input.newRevenueMonthly : 5;

  // MAGIC NUMBER
  const magicNumber = input.salesMarketingSpend > 0 ? (input.newRevenueMonthly * 4) / input.salesMarketingSpend : 0;

  // RUNWAY
  const runwayMonths = input.burnMonthly > 0 ? input.cashOnHand / input.burnMonthly : 0;

  // STICKINESS
  const stickiness = input.mau > 0 ? input.dau / input.mau : 0;

  // PMF
  let pmf =
    0.5 * normalize(input.retentionD30, 0, 0.5) +
    0.3 * normalize(input.organicGrowthPct, 0, 30) +
    0.2 * normalize(input.repeatPurchaseRate, 0, 1);
  pmf *= 100;

  // UNIT
  const ltvToCac = input.cac > 0 ? ltv / input.cac : 0;
  let unitScore =
    0.5 * normalize(ltvToCac, 0, 5) +
    0.3 * normalize(grossMargin, 0, 0.8) +
    0.2 * normalize(paybackMonths > 0 ? 1 / paybackMonths : 0, 0, 1);
  unitScore *= 100;

  // GROWTH
  let growthScore = 0.6 * normalize(input.growthMonthlyPct, 0, 20) + 0.4 * normalize(input.organicGrowthPct, 0, 30);
  growthScore *= 100;

  // EFFICIENCY
  let efficiency =
    0.5 * normalize(burnMultiple > 0 ? 1 / burnMultiple : 0, 0, 2) +
    0.5 * normalize(magicNumber, 0, 1);
  efficiency *= 100;

  // MARKET SCORE
  let marketScore =
    0.5 * normalize(input.tam, 1e6, 1e10) +
    0.3 * normalize(input.tamGrowthPct, 0, 20) +
    0.2 * (1 - clamp(input.competitionDensity, 0, 1));
  marketScore *= 100;

  // RISK (0..1)
  const financialRisk01 =
    0.6 * normalize(runwayMonths > 0 ? 1 / runwayMonths : 1, 0, 1) +
    0.4 * normalize(burnMultiple, 0, 5);
  const marketRisk01 = normalize(churn, 0, 0.2);
  const executionRisk01 = normalize(input.releasesPerMonth > 0 ? 1 / input.releasesPerMonth : 1, 0, 1);

  let riskAvg01 = (financialRisk01 + marketRisk01 + executionRisk01) / 3;

  // 🔥 KILL SWITCHES
  if (churn > 0.2) pmf *= 0.3;
  if (ltvToCac < 1) unitScore *= 0.2;
  if (runwayMonths < 3) riskAvg01 += 0.3;
  riskAvg01 = clamp(riskAvg01, 0, 1);

  // SUCCESS
  const pPmf = pmf / 100;
  const pScale = (unitScore + marketScore) / 200;
  const pSurvival = normalize(runwayMonths, 0, 24);
  const successProbability = clamp(pPmf * pScale * pSurvival, 0.05, 0.9);

  // ARR
  const arr = monthlyRevenue * 12;

  // VALUATION
  const baseMultiple = (() => {
    switch (input.stage) {
      case "idea":
        return 1;
      case "seed":
        return 3;
      case "series_a":
        return 6;
      case "series_b":
        return 8;
      case "growth":
        return 10;
      case "exit":
        return 10;
      default:
        return 3;
    }
  })();

  const valuationARR = arr * baseMultiple * (1 - riskAvg01);

  // DCF
  const discountRate = 0.1 + riskAvg01 * 0.3;
  const yearCashflows: number[] = [];
  let dcf = 0;
  for (let year = 1; year <= 5; year++) {
    const revenue = arr * Math.pow(1 + input.growthMonthlyPct / 100, year);
    const profit = revenue * grossMargin;
    const discounted = profit / Math.pow(1 + discountRate, year);
    yearCashflows.push(discounted);
    dcf += discounted;
  }

  // FINAL
  const valuationLow = Math.min(valuationARR, dcf) * 0.7;
  const valuationHigh = Math.max(valuationARR, dcf) * 1.3;
  const valuationBase = (valuationLow + valuationHigh) / 2;
  const expectedValue = valuationBase * successProbability;

  // INVESTOR SCORE
  const investorScore =
    0.25 * growthScore +
    0.25 * unitScore +
    0.2 * pmf +
    0.15 * efficiency +
    0.15 * marketScore;

  // CONFIDENCE
  const totalFields = 18;
  const filledFields = [
    input.activeUsers,
    input.arpu,
    input.monthlyRevenue,
    input.newRevenueMonthly,
    input.salesMarketingSpend,
    input.cac,
    input.burnMonthly,
    input.cashOnHand,
    input.retentionD30,
    input.retentionD7,
    input.retentionD1,
    input.repeatPurchaseRate,
    input.organicGrowthPct,
    input.dau,
    input.mau,
    input.releasesPerMonth,
    input.tam,
    input.tamGrowthPct,
  ].filter((v) => typeof v === "number" && Number(v) > 0).length;

  const fieldsFilledRatio = totalFields > 0 ? filledFields / totalFields : 0;
  const confidence =
    0.5 * fieldsFilledRatio +
    0.3 * (input.retentionD30 > 0 ? 1 : 0) +
    0.2 * (input.monthlyRevenue > 0 ? 1 : 0);
  const confidenceScore = confidence * 100;

  // Break-even monthly revenue (gross margin offsets burn)
  const breakEvenMonthlyRevenue = input.burnMonthly > 0 && grossMargin > 0 ? input.burnMonthly / grossMargin : 0;

  // Risk decomposition outputs (0..100, higher = worse)
  const riskAvg = riskAvg01 * 100;
  const marketRisk = marketRisk01 * 100;
  const financialRisk = financialRisk01 * 100;
  const executionRisk = executionRisk01 * 100;

  // Keep legacy fields for existing UI (no longer used by the model)
  const teamMoatScore = clamp(input.moatStrength, 0, 100);
  const tractionScore = clamp(growthScore, 0, 100);
  const financialScore = clamp(efficiency, 0, 100);

  // Compatibility: keep competition/regulatory/tech risks as 0..100 from selects
  const competitionRisk =
    input.competition === "low" ? 20 : input.competition === "medium" ? 50 : 80;
  const regulatoryRisk =
    input.regulatory === "low" ? 20 : input.regulatory === "medium" ? 50 : 80;
  const techRisk =
    input.tech === "low" ? 20 : input.tech === "medium" ? 50 : 80;

  return {
    monthlyRevenue,
    arr,
    ltv,
    paybackMonths,
    churn,
    grossMargin,
    burnMultiple,
    magicNumber,
    runwayMonths,
    stickiness,
    ltvToCac,

    pmfScore: clamp(pmf, 0, 100),
    unitEconomicsScore: clamp(unitScore, 0, 100),
    growthScore: clamp(growthScore, 0, 100),
    efficiencyScore: clamp(efficiency, 0, 100),
    marketScore: clamp(marketScore, 0, 100),
    investorScore: clamp(investorScore, 0, 100),
    confidenceScore: clamp(confidenceScore, 0, 100),

    tractionScore,
    financialScore,
    teamMoatScore,

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
    dcf,
    valuationARR,

    valuationLow,
    valuationHigh,
    valuationBase,
    expectedValue,

    breakEvenMonthlyRevenue,
  };
}

