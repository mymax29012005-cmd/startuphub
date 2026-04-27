import type { StartupAnalysisInput, StartupAnalysisResult } from "./types";
import { interpretationTexts, type InterpretationKey } from "./interpretationTexts";

export type MetricStatus = "отлично" | "нормально" | "риск" | "критично";

export type InterpretationSection = {
  title: string;
  text: string;
  keyMetrics?: Array<{ key: string; label: string; value: string; status: MetricStatus }>;
};

export type InterpretationOutput = {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  sections: {
    growth: InterpretationSection;
    unit: InterpretationSection;
    pmf: InterpretationSection;
    market: InterpretationSection;
    risk: InterpretationSection;
  };
  recommendations: string[];
  valuationComment: string;
  investorComment: string;
  confidenceComment: string;
};

function t(key: InterpretationKey) {
  return interpretationTexts[key];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmtPct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

function fmtNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

function statusByThreshold(value: number, good: number, ok: number, risk: number, invert = false): MetricStatus {
  // if invert=true, lower is better (e.g., churn)
  const v = Number.isFinite(value) ? value : 0;
  if (!invert) {
    if (v >= good) return "отлично";
    if (v >= ok) return "нормально";
    if (v >= risk) return "риск";
    return "критично";
  }
  // lower is better
  if (v <= good) return "отлично";
  if (v <= ok) return "нормально";
  if (v <= risk) return "риск";
  return "критично";
}

export function interpretationEngine(result: StartupAnalysisResult, input: StartupAnalysisInput): InterpretationOutput {
  // 3) Executive summary
  const sp = Number(result.successProbability) || 0;
  const executiveSummary =
    sp > 0.7 ? t("summary.high") : sp >= 0.4 ? t("summary.medium") : t("summary.low");

  // 4) Strengths: top-3 among key scores
  const scoreList: Array<{ key: string; label: string; v: number }> = [
    { key: "growth", label: "Рост", v: Number((result as any).growthScore ?? 0) },
    { key: "unit", label: "Юнит-экономика", v: Number((result as any).unitEconomicsScore ?? 0) },
    { key: "pmf", label: "PMF", v: Number((result as any).pmfScore ?? 0) },
    { key: "efficiency", label: "Эффективность", v: Number((result as any).efficiencyScore ?? 0) },
    { key: "market", label: "Рынок", v: Number((result as any).marketScore ?? 0) },
  ].map((x) => ({ ...x, v: clamp(x.v, 0, 100) }));

  const strengths = scoreList
    .slice()
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => `${x.label}: ${Math.round(x.v)}/100`);

  // 4) Weaknesses: rule-based
  const churn = Number((result as any).churn ?? input.monthlyChurnPct / 100) || 0;
  const ltvToCac = Number((result as any).ltvToCac ?? 0) || 0;
  const runway = Number((result as any).runwayMonths ?? 0) || 0;
  const burnMultiple = Number((result as any).burnMultiple ?? 0) || 0;

  const weaknesses: string[] = [];
  if (churn > 0.15) weaknesses.push(`Высокий churn: ${fmtPct(churn)}`);
  if (ltvToCac < 2) weaknesses.push(`Слабый LTV/CAC: ${ltvToCac.toFixed(2)}`);
  if (runway < 6) weaknesses.push(`Низкий runway: ${runway.toFixed(1)} мес`);
  if (burnMultiple > 3) weaknesses.push(`Высокий burn multiple: ${burnMultiple.toFixed(2)}`);

  const weaknessesTop = weaknesses.slice(0, 3);

  // 5) Analytical blocks
  const growthMonthlyPct = Number(input.growthMonthlyPct) || 0;
  const growthText = growthMonthlyPct > 15 ? t("growth.high") : growthMonthlyPct >= 5 ? t("growth.medium") : t("growth.low");

  const unitText = ltvToCac > 3 ? t("unit.strong") : ltvToCac >= 1 ? t("unit.ok") : t("unit.bad");

  const retentionD30 = Number(input.retentionD30) || 0;
  const pmfText = retentionD30 > 0.3 ? t("pmf.high") : retentionD30 < 0.1 ? t("pmf.low") : "Удержание на D30 в промежуточной зоне: есть потенциал, но PMF ещё не подтверждён.";

  const marketParts: string[] = [];
  const tam = Number(input.tam) || 0;
  const competitionDensity = clamp(Number(input.competitionDensity) || 0, 0, 1);
  if (tam > 1e9) marketParts.push(t("market.big"));
  if (tam > 0 && tam < 1e7) marketParts.push(t("market.small"));
  if (competitionDensity > 0.7) marketParts.push(t("market.competitive"));
  if (marketParts.length === 0) marketParts.push("Рынок выглядит умеренным по размеру и конкуренции; важно уточнить TAM и динамику рынка.");

  // Risk: pick primary risk
  let primaryRiskKey: InterpretationKey = "risk.burn";
  if (churn > 0.15) primaryRiskKey = "risk.highChurn";
  else if (runway < 6) primaryRiskKey = "risk.lowRunway";
  else if (burnMultiple > 3) primaryRiskKey = "risk.burn";

  // 6) Key metrics statuses
  const ltvToCacStatus = ltvToCac > 3 ? "отлично" : ltvToCac >= 1 ? "нормально" : "критично";
  const churnStatus = statusByThreshold(churn, 0.05, 0.1, 0.15, true);
  const growthStatus = growthMonthlyPct > 15 ? "отлично" : growthMonthlyPct >= 5 ? "нормально" : growthMonthlyPct > 0 ? "риск" : "критично";
  const runwayStatus = runway >= 12 ? "отлично" : runway >= 6 ? "нормально" : runway >= 3 ? "риск" : "критично";
  const burnMultipleStatus = statusByThreshold(burnMultiple, 1.5, 2.5, 3, true);
  const retentionD30Status = statusByThreshold(retentionD30, 0.3, 0.15, 0.1, false);

  // 7) What to improve: top-3 by weighted gap
  const improvements = [
    {
      key: "churn",
      weight: 1.5,
      gap: Math.max(0, churn - 0.05),
      text: t("recommendations.churn"),
    },
    {
      key: "ltvToCac",
      weight: 1.4,
      gap: Math.max(0, 3 - ltvToCac),
      text: t("recommendations.cac"),
    },
    {
      key: "growth",
      weight: 1.2,
      gap: Math.max(0, 15 - growthMonthlyPct),
      text: t("recommendations.growth"),
    },
    {
      key: "retention",
      weight: 1.2,
      gap: Math.max(0, 0.3 - retentionD30),
      text: t("recommendations.retention"),
    },
    {
      key: "runway",
      weight: 1.1,
      gap: Math.max(0, 12 - runway),
      text: t("recommendations.runway"),
    },
    {
      key: "burnMultiple",
      weight: 1.1,
      gap: Math.max(0, burnMultiple - 2.0),
      text: t("recommendations.burnMultiple"),
    },
  ]
    .map((x) => ({ ...x, impact: x.gap * x.weight }))
    .sort((a, b) => b.impact - a.impact)
    .filter((x) => x.impact > 0)
    .slice(0, 3)
    .map((x) => x.text);

  const recommendations = improvements.length > 0 ? improvements : ["Заполните больше метрик — анализатор сформирует более точные рекомендации."]; // fallback

  // 8) Break-even & profit text
  const profit = (Number(result.monthlyRevenue) || 0) * (Number((result as any).grossMargin ?? 0) || 0) - (Number(input.burnMonthly) || 0);
  const profitComment = profit < 0 ? t("profit.loss") : t("profit.profit");

  // 9) Valuation comment (dependency on growth + retention)
  const valuationLow = Number((result as any).valuationLow ?? 0) || 0;
  const valuationHigh = Number((result as any).valuationHigh ?? 0) || 0;
  const valuationComment =
    `Оценка чувствительна к росту и удержанию: при росте ${growthMonthlyPct.toFixed(1)}%/мес и retention D30 ${fmtPct(retentionD30)} диапазон составляет ` +
    `${fmtMoney(valuationLow)} — ${fmtMoney(valuationHigh)}. Улучшение retention и органического роста сужает риск и повышает верхнюю границу.`;

  // 10) Investor comment
  const investorScore = Number((result as any).investorScore ?? 0) || 0;
  const investorComment = investorScore > 70 ? t("investor.high") : investorScore < 40 ? t("investor.low") : "Проект может заинтересовать инвестора, но решение будет сильно зависеть от улучшения ключевых метрик и снижения рисков.";

  // 11) Confidence comment
  const confidenceScore = Number((result as any).confidenceScore ?? 0) || 0;
  const confidenceComment = confidenceScore > 70 ? t("confidence.high") : t("confidence.low");

  return {
    executiveSummary,
    strengths,
    weaknesses: weaknessesTop,
    sections: {
      growth: {
        title: "Growth",
        text: growthText,
        keyMetrics: [
          { key: "growthMonthlyPct", label: "Рост/мес", value: `${growthMonthlyPct.toFixed(1)}%`, status: growthStatus },
          { key: "organicGrowthPct", label: "Органический рост", value: `${Number(input.organicGrowthPct || 0).toFixed(0)}%`, status: Number(input.organicGrowthPct) >= 15 ? "отлично" : Number(input.organicGrowthPct) >= 5 ? "нормально" : Number(input.organicGrowthPct) > 0 ? "риск" : "критично" },
        ],
      },
      unit: {
        title: "Unit economics",
        text: unitText,
        keyMetrics: [
          { key: "ltvToCac", label: "LTV/CAC", value: ltvToCac ? ltvToCac.toFixed(2) : "—", status: ltvToCacStatus },
          { key: "payback", label: "Payback", value: Number(result.paybackMonths) ? `${Number(result.paybackMonths).toFixed(1)} мес` : "—", status: Number(result.paybackMonths) > 0 && Number(result.paybackMonths) <= 6 ? "отлично" : Number(result.paybackMonths) <= 12 ? "нормально" : Number(result.paybackMonths) <= 18 ? "риск" : "критично" },
        ],
      },
      pmf: {
        title: "PMF",
        text: pmfText,
        keyMetrics: [
          { key: "retentionD30", label: "Retention D30", value: fmtPct(retentionD30), status: retentionD30Status },
          { key: "churn", label: "Churn/мес", value: fmtPct(churn), status: churnStatus },
        ],
      },
      market: {
        title: "Market",
        text: marketParts.join(" "),
        keyMetrics: [
          { key: "tam", label: "TAM", value: tam ? fmtMoney(tam) : "—", status: tam > 1e9 ? "отлично" : tam >= 1e7 ? "нормально" : tam > 0 ? "риск" : "критично" },
          { key: "competitionDensity", label: "Конкуренция", value: `${Math.round(competitionDensity * 100)}%`, status: competitionDensity <= 0.3 ? "отлично" : competitionDensity <= 0.6 ? "нормально" : competitionDensity <= 0.8 ? "риск" : "критично" },
        ],
      },
      risk: {
        title: "Risk",
        text: `${t(primaryRiskKey)} ${profitComment}`,
        keyMetrics: [
          { key: "runway", label: "Runway", value: runway ? `${runway.toFixed(1)} мес` : "—", status: runwayStatus },
          { key: "burnMultiple", label: "Burn multiple", value: burnMultiple ? burnMultiple.toFixed(2) : "—", status: burnMultipleStatus },
        ],
      },
    },
    recommendations,
    valuationComment,
    investorComment,
    confidenceComment,
  };
}

