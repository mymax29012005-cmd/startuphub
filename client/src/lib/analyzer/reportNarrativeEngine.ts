import type { StartupAnalysisInput, StartupAnalysisResult } from "./types";
import { interpretationEngine } from "./interpretationEngine";
import { reportNarrativeTexts } from "./reportNarrativeTexts";

export type ReportNarrative = {
  /** Три связных фрагмента под существующие «Ключевые insights» (без изменения вёрстки). */
  insightsChunks: [string, string, string];
  /** Полный связный текст отчёта (для копирования / API / будущего UI). */
  fullDocument: string;
};

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function truncate(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function reportNarrativeEngine(result: StartupAnalysisResult, input: StartupAnalysisInput): ReportNarrative {
  const T = reportNarrativeTexts;
  const interp = interpretationEngine(result, input);

  const sp = Number(result.successProbability) || 0;
  const spPct = Math.round(sp * 100);

  const levelKey = sp > 0.7 ? "high" : sp >= 0.4 ? "medium" : "low";
  const levelWord = T.attractiveness[levelKey];

  const bodyKey = sp > 0.7 ? "highBody" : sp >= 0.4 ? "mediumBody" : "lowBody";
  const body = T.executive[bodyKey];

  const strength = interp.strengths[0] ?? "метрики в целом выглядят сбалансированно";
  const limit = interp.weaknesses[0] ?? "нужно больше подтверждений по качеству данных и повторяемости каналов роста";

  const conclusionKey = sp > 0.7 ? "conclusionHigh" : sp >= 0.4 ? "conclusionMedium" : "conclusionLow";
  const conclusion = T.executive[conclusionKey];

  const opening = fill(T.executive.opening, { level: levelWord, spPct });

  const executiveBlock = [
    opening,
    body,
    fill(T.executive.strengthPrefix, { strength }),
    fill(T.executive.limitPrefix, { limit }),
    conclusion,
  ].join(" ");

  // Business overview (sense, not formulas)
  const title = (input.title ?? "").trim() || "Проект";
  const industry = (input.industryLabel ?? "").trim() || "не указанная отрасль";
  const desc = (input.description ?? "").trim();
  let businessOverview: string;
  if (desc.length >= 40) {
    businessOverview = fill(T.businessOverview.withDescription, {
      title,
      industry,
      descSnippet: truncate(desc, 220),
    });
  } else if ((input.title ?? "").trim().length > 0) {
    businessOverview = fill(T.businessOverview.titleOnly, { title, industry });
  } else {
    businessOverview = T.businessOverview.fallback;
  }

  const growthMonthlyPct = Number(input.growthMonthlyPct) || 0;
  const growthGrade = growthMonthlyPct > 15 ? "сильный" : growthMonthlyPct >= 5 ? "умеренный" : "слабый";
  const growthBody =
    growthMonthlyPct > 15 ? T.growth.strong : growthMonthlyPct >= 5 ? T.growth.moderate : T.growth.weak;
  const growthAnalysis = [fill(T.growth.intro, { grade: growthGrade }), growthBody, T.growth.benchmark].join(" ");

  const ltvToCac = Number((result as any).ltvToCac ?? 0) || 0;
  const payback = Number(result.paybackMonths) || 0;
  const unitBody = ltvToCac > 3 ? T.unit.strong : ltvToCac >= 1 ? T.unit.ok : T.unit.bad;
  const paybackHint = payback > 0 ? fill(T.unit.paybackHint, { payback: payback.toFixed(1) }) : "";
  const unitBlock = [T.unit.intro, unitBody, paybackHint].filter(Boolean).join(" ");

  const retentionD30 = Number(input.retentionD30) || 0;
  const pmfBody = retentionD30 > 0.3 ? T.pmf.high : retentionD30 < 0.1 ? T.pmf.low : T.pmf.mid;
  const pmfBlock = [T.pmf.intro, pmfBody].join(" ");

  const tam = Number(input.tam) || 0;
  const competitionDensity = clamp(Number(input.competitionDensity) || 0, 0, 1);
  const tamGrowth = Number(input.tamGrowthPct) || 0;
  const marketParts: string[] = [T.market.intro];
  if (tam > 1e9) marketParts.push(T.market.big);
  if (tam > 0 && tam < 1e7) marketParts.push(T.market.small);
  if (competitionDensity > 0.7) marketParts.push(T.market.competitive);
  if (tam >= 1e7 && tam <= 1e9 && competitionDensity <= 0.7) {
    marketParts.push("Размер рынка выглядит достаточным для умеренного масштаба при правильном позиционировании.");
  }
  if (tamGrowth > 0) {
    marketParts.push(fill("Потенциал роста сегмента поддерживается оценкой роста рынка около {g}% в год.", { g: tamGrowth.toFixed(0) }));
  } else {
    marketParts.push(T.market.growth);
  }
  const marketAnalysis = marketParts.join(" ");

  const churn = Number((result as any).churn ?? input.monthlyChurnPct / 100) || 0;
  const runway = Number((result as any).runwayMonths ?? 0) || 0;
  const burnMultiple = Number((result as any).burnMultiple ?? 0) || 0;

  const riskBits: string[] = [];
  if (churn > 0.15) riskBits.push(T.risk.churn);
  if (runway < 6) riskBits.push(T.risk.runway);
  if (burnMultiple > 3) riskBits.push(T.risk.burn);
  if (ltvToCac < 1) riskBits.push(T.risk.unit);
  const riskBody = riskBits.length > 0 ? riskBits.slice(0, 3).join(" ") : T.risk.none;
  const riskAnalysis = `${T.risk.lead} ${riskBody}`;

  const grossMargin = Number((result as any).grossMargin ?? 0) || 0;
  const monthlyRevenue = Number(result.monthlyRevenue) || 0;
  const burn = Number(input.burnMonthly) || 0;
  const profit = monthlyRevenue * grossMargin - burn;
  const financialBits: string[] = [T.financial.intro];
  financialBits.push(profit < 0 ? T.financial.loss : T.financial.profit);
  financialBits.push(runway < 6 ? T.financial.runwayTight : T.financial.runwayOk);
  const financialHealth = financialBits.join(" ");

  const investorScore = Number((result as any).investorScore ?? 0) || 0;
  const invBody = investorScore > 70 ? T.investment.high : investorScore < 40 ? T.investment.low : T.investment.mid;
  const investmentBlock = [T.investment.intro, invBody].join(" ");

  const recSrc = [...interp.recommendations];
  const fallbacks = [T.recommendations.fallback1, T.recommendations.fallback2, T.recommendations.fallback3] as const;
  while (recSrc.length < 3) {
    recSrc.push(fallbacks[recSrc.length]);
  }
  const top3 = recSrc.slice(0, 3);
  const recNarrative = `Во-первых, ${top3[0]!.replace(/^./, (c) => c.toLowerCase())} Во-вторых, ${top3[1]!.replace(/^./, (c) => c.toLowerCase())} В-третьих, ${top3[2]!.replace(/^./, (c) => c.toLowerCase())}`;

  const confidenceScore = Number((result as any).confidenceScore ?? 0) || 0;
  const confidenceNote = confidenceScore > 70 ? T.confidence.noteHigh : T.confidence.noteLow;

  const outlook =
    sp > 0.55 && investorScore > 55
      ? T.verdictOutlook.positive
      : sp < 0.35 || investorScore < 35
        ? T.verdictOutlook.negative
        : T.verdictOutlook.neutral;

  const potential =
    sp > 0.65 && investorScore > 60
      ? T.verdictPotential.high
      : sp > 0.4
        ? T.verdictPotential.medium
        : T.verdictPotential.low;

  const finalVerdict = fill(T.verdict.template, { outlook, potential });

  const chunk1 = [executiveBlock, businessOverview, growthAnalysis].join(" ");

  const chunk2 = [unitBlock, pmfBlock, marketAnalysis, riskAnalysis].join(" ");

  const vLow = Number((result as any).valuationLow ?? 0) || 0;
  const vHigh = Number((result as any).valuationHigh ?? 0) || 0;
  const valuationSentence =
    vLow > 0 && vHigh > 0
      ? `Ориентировочный диапазон оценки по текущим допущениям — от ${Math.round(vLow).toLocaleString("ru-RU")} до ${Math.round(vHigh).toLocaleString("ru-RU")} ₽; цифры отражают модельные допущения и не заменяют независимую оценку.`
      : "";

  const chunk3 = [
    financialHealth,
    valuationSentence,
    investmentBlock,
    `${T.recommendations.title} ${recNarrative}`,
    finalVerdict,
    confidenceNote,
  ]
    .filter(Boolean)
    .join(" ");

  const fullDocument = [chunk1, chunk2, chunk3].join("\n\n");

  return {
    insightsChunks: [chunk1, chunk2, chunk3],
    fullDocument,
  };
}
