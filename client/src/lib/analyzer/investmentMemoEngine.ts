import type { StartupAnalysisInput, StartupAnalysisResult } from "./types";
import { investmentMemoTexts, type MarketBandRu } from "./investmentMemoTexts";

export type InvestmentMemoAction = {
  action: string;
  impact: "high" | "medium" | "low";
  improves: string;
};

export type InvestmentMemoVerdict = "BUY" | "HOLD" | "WATCH" | "AVOID";

export type InvestmentMemoReport = {
  executiveSummary: string;
  businessContext: string;
  growthAnalysis: string;
  productMarketFit: string;
  unitEconomicsNarrative: string;
  marketAnalysis: string;
  riskAnalysis: string;
  investorReasoning: string;
  actionPriorities: InvestmentMemoAction[];
  finalVerdict: {
    signal: InvestmentMemoVerdict;
    explanation: string;
    wouldChange: string;
  };
  /** Бенчмарк-лейблы по ключевым метрикам (для JSON / HTML). */
  benchmarkLabels: {
    growth: MarketBandRu;
    retentionD30: MarketBandRu;
    ltvToCac: MarketBandRu;
    runway: MarketBandRu;
  };
  /** Три связных блока текста под текущий UI «Ключевые insights». */
  insightsChunks: [string, string, string];
  /** Секции, готовые для вставки в HTML-макет (экранирование — текстовый). */
  htmlSections: Record<string, string>;
};

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    idea: "Idea",
    seed: "Seed",
    series_a: "Series A",
    series_b: "Series B",
    growth: "Growth",
    exit: "Exit",
  };
  return map[stage] ?? stage;
}

/** Ориентиры «top 25% / median / early avg» как числовые пороги по стадии (детерминированно). */
function growthThresholds(stage: string) {
  const early = stage === "idea" ? 3 : stage === "seed" ? 4 : 5;
  const median = stage === "idea" ? 6 : stage === "seed" ? 8 : 10;
  const top = stage === "idea" ? 10 : stage === "seed" ? 14 : 18;
  return { early, median, top };
}

function retentionThresholds(stage: string) {
  const early = stage === "idea" ? 0.08 : 0.1;
  const median = stage === "idea" ? 0.15 : 0.18;
  const top = stage === "idea" ? 0.22 : 0.28;
  return { early, median, top };
}

function ltvCacThresholds() {
  return { early: 1.2, median: 2.0, top: 3.0 };
}

function runwayThresholds(stage: string) {
  const months = stage === "idea" || stage === "seed" ? 9 : 12;
  return { weak: 4, mid: months, strong: months + 8 };
}

/** Выше медианы = «на рынке», верхний квартиль = «выше рынка». */
function bandGrowthStyle(value: number, top: number, median: number): MarketBandRu {
  if (value >= top) return investmentMemoTexts.bands.above as MarketBandRu;
  if (value >= median) return investmentMemoTexts.bands.at as MarketBandRu;
  return investmentMemoTexts.bands.below as MarketBandRu;
}

function bandRetention(d: number, t: { median: number; top: number }): MarketBandRu {
  if (d >= t.top) return investmentMemoTexts.bands.above as MarketBandRu;
  if (d >= t.median) return investmentMemoTexts.bands.at as MarketBandRu;
  return investmentMemoTexts.bands.below as MarketBandRu;
}

function bandRunway(m: number, t: { weak: number; mid: number; strong: number }): MarketBandRu {
  if (m >= t.strong) return investmentMemoTexts.bands.above as MarketBandRu;
  if (m >= t.mid) return investmentMemoTexts.bands.at as MarketBandRu;
  if (m >= t.weak) return investmentMemoTexts.bands.at as MarketBandRu;
  return investmentMemoTexts.bands.below as MarketBandRu;
}

function bandLtvCac(x: number, th: { early: number; median: number; top: number }): MarketBandRu {
  if (x >= th.top) return investmentMemoTexts.bands.above as MarketBandRu;
  if (x >= th.median) return investmentMemoTexts.bands.at as MarketBandRu;
  if (x >= th.early) return investmentMemoTexts.bands.at as MarketBandRu;
  return investmentMemoTexts.bands.below as MarketBandRu;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paragraph(className: string, text: string) {
  return `<p class="${className}">${escapeHtml(text)}</p>`;
}

export function buildInvestmentMemo(input: StartupAnalysisInput, result: StartupAnalysisResult): InvestmentMemoReport {
  const stage = input.stage;
  const gTh = growthThresholds(stage);
  const rTh = retentionThresholds(stage);
  const lTh = ltvCacThresholds();
  const runTh = runwayThresholds(stage);

  const growthPct = Number(input.growthMonthlyPct) || 0;
  const retentionD30 = Number(input.retentionD30) || 0;
  const churn = Number(result.churn) || Math.max(Number(input.monthlyChurnPct) / 100, 0.0001);
  const ltvMemo = Number(input.arpu) / Math.max(Number(input.monthlyChurnPct) / 100, 0.01);
  const ltvCacMemo = ltvMemo / Math.max(Number(input.cac), 1);
  const ltvCacDisplay = Number(result.ltvToCac) > 0 ? Number(result.ltvToCac) : ltvCacMemo;

  const runway = Number(result.runwayMonths) || (Number(input.burnMonthly) > 0 ? Number(input.cashOnHand) / Math.max(Number(input.burnMonthly), 1) : 0);

  const growthBench = bandGrowthStyle(growthPct, gTh.top, gTh.median);
  const retBench = bandRetention(retentionD30, { median: rTh.median, top: rTh.top });
  const ltvBench = bandLtvCac(ltvCacDisplay, lTh);
  const runwayBench = bandRunway(runway, runTh);

  const sp = Number(result.successProbability) || 0;
  const spPct = Math.round(sp * 100);

  const growthScore = Number(result.growthScore) || 0;
  const unitScore = Number(result.unitEconomicsScore) || 0;
  const pmfScore = Number(result.pmfScore) || 0;
  const marketScore = Number(result.marketScore) || 0;
  const effScore = Number(result.efficiencyScore) || 0;
  const invScore = Number(result.investorScore) || 0;
  const riskAvg = Number(result.riskAvg) || 0;

  const title = (input.title ?? "").trim() || "Проект без названия";
  const industry = (input.industryLabel ?? "").trim() || "не указанная вертикаль";
  const productLine =
    input.mode === "idea"
      ? "инициатива на стадии формулировки ценности и проверки спроса."
      : "цифровой продукт с потенциалом повторяемой выручки и масштабирования базы пользователей.";

  const openKey = (sp > 0.65 ? "openStrong" : sp >= 0.4 ? "openMid" : "openWeak") as keyof typeof investmentMemoTexts.executive;
  const qualityKey = (unitScore >= 62 && pmfScore >= 55 ? "qualityStrong" : unitScore >= 45 && pmfScore >= 40 ? "qualityMid" : "qualityWeak") as keyof typeof investmentMemoTexts.executive;
  const closeKey = (sp > 0.65 ? "closeStrong" : sp >= 0.4 ? "closeMid" : "closeWeak") as keyof typeof investmentMemoTexts.executive;

  const ranked = [
    { k: "рост", v: growthScore },
    { k: "юнит-экономика", v: unitScore },
    { k: "PMF", v: pmfScore },
    { k: "рынок", v: marketScore },
    { k: "операционная эффективность", v: effScore },
  ].sort((a, b) => b.v - a.v);
  const strength = `${ranked[0]!.k} (${Math.round(ranked[0]!.v)}/100)`;

  const weaknesses: string[] = [];
  if (churn > 0.15) weaknesses.push("высокий churn ограничивает LTV");
  if (ltvCacDisplay < 2) weaknesses.push("LTV/CAC ниже комфортного коридора для агрессивного масштаба");
  if (runway < 6) weaknesses.push("узкий runway сокращает время на исправления");
  if (Number(result.burnMultiple) > 3) weaknesses.push("высокий burn multiple относительно новой выручки");
  const weakness = weaknesses[0] ?? "недостаточная полнота входных данных для сужения ключевого ограничения";

  const executiveSummary = [
    fill(investmentMemoTexts.executive[openKey], { stage: stageLabel(stage), spPct }),
    fill(investmentMemoTexts.executive.whatIs, { title, productLine, industry }),
    investmentMemoTexts.executive[qualityKey],
    fill(investmentMemoTexts.executive.strengthPrefix, { strength }),
    fill(investmentMemoTexts.executive.weaknessPrefix, { weakness }),
    fill(investmentMemoTexts.executive.benchLine, {
      growthBench,
      retBench,
      ltvBench,
      runwayBench,
      stage: stageLabel(stage),
    }),
    investmentMemoTexts.executive[closeKey],
  ].join(" ");

  const businessContext = [
    investmentMemoTexts.business.default,
    stage === "idea" ? investmentMemoTexts.business.idea : fill(investmentMemoTexts.business.growthStage, { stage: stageLabel(stage) }),
  ].join(" ");

  const growthIsAggressive = growthPct >= gTh.top * 0.85;
  const growthAnalysis = [
    growthIsAggressive ? investmentMemoTexts.growth.expHint : investmentMemoTexts.growth.linear,
    investmentMemoTexts.growth.drivers,
    retentionD30 >= rTh.median && ltvCacDisplay >= lTh.median ? investmentMemoTexts.growth.sustainOk : investmentMemoTexts.growth.sustainBad,
    fill("Сопоставление с рынком: темп MoM {growthBench} для стадии {stage}.", {
      growthBench,
      stage: stageLabel(stage),
    }),
  ].join(" ");

  const recurring = Number(input.recurringShare) || 0;
  let pmfText: string;
  if (retentionD30 > 0.28 && growthPct > 12 && recurring >= 0.55) {
    pmfText = investmentMemoTexts.pmf.strong;
  } else if ((retentionD30 > 0.15 || growthPct > 6) && recurring >= 0.35) {
    pmfText = investmentMemoTexts.pmf.partial;
  } else {
    pmfText = investmentMemoTexts.pmf.weak;
  }
  const productMarketFit = [
    pmfText,
    fill(
      "Обоснование: D30 {d30} при порогах top/median/early {top}/{med}/{ea} для стадии {stage}; доля повторяемой выручки {rec}%.",
      {
        d30: `${Math.round(retentionD30 * 100)}%`,
        top: `${Math.round(rTh.top * 100)}%`,
        med: `${Math.round(rTh.median * 100)}%`,
        ea: `${Math.round(rTh.early * 100)}%`,
        stage: stageLabel(stage),
        rec: `${Math.round(recurring * 100)}`,
      },
    ),
  ].join(" ");

  const unitKey = (ltvCacDisplay > 3 ? "ltvCacStrong" : ltvCacDisplay >= 1 ? "ltvCacMid" : "ltvCacBad") as keyof typeof investmentMemoTexts.unit;
  const payback = Number(result.paybackMonths) || 0;
  const unitEconomicsNarrative = [
    investmentMemoTexts.unit.intro,
    fill(investmentMemoTexts.unit[unitKey], { ltvCac: ltvCacDisplay.toFixed(2) }),
    payback > 0 ? fill(investmentMemoTexts.unit.payback, { payback: payback.toFixed(1) }) : "",
    fill("Бенчмарк LTV/CAC: {b} относительно медианы {med} и сильного уровня {top} для венчурных SaaS на стадии {stage}.", {
      b: ltvBench,
      med: String(lTh.median),
      top: String(lTh.top),
      stage: stageLabel(stage),
    }),
  ]
    .filter(Boolean)
    .join(" ");

  const tam = Number(input.tam) || 0;
  const compDense = Number(input.competitionDensity) > 0.7;
  const tamGrowth = Number(input.tamGrowthPct) || 0;
  const marketParts: string[] = [investmentMemoTexts.market.intro];
  if (tam > 1e9) marketParts.push(investmentMemoTexts.market.bigTam);
  if (tam > 0 && tam < 1e7) marketParts.push(investmentMemoTexts.market.smallTam);
  if (compDense) marketParts.push(investmentMemoTexts.market.compDense);

  const tamBench2: MarketBandRu =
    tam > 1e9
      ? (investmentMemoTexts.bands.above as MarketBandRu)
      : tam >= 1e7
        ? (investmentMemoTexts.bands.at as MarketBandRu)
        : tam > 0
          ? (investmentMemoTexts.bands.below as MarketBandRu)
          : (investmentMemoTexts.bands.at as MarketBandRu);

  const compBench: MarketBandRu =
    input.competition === "high" || compDense
      ? (investmentMemoTexts.bands.below as MarketBandRu)
      : input.competition === "low"
        ? (investmentMemoTexts.bands.above as MarketBandRu)
        : (investmentMemoTexts.bands.at as MarketBandRu);

  const marketAnalysis = [
    ...marketParts,
    fill(investmentMemoTexts.market.bench, {
      tamBench: tamBench2,
      compBench,
    }),
    fill("Темп роста рынка по вводным: {tg}% год-к году; это влияет на допустимую агрессию GTM.", { tg: tamGrowth.toFixed(0) }),
  ].join(" ");

  type RiskDom = "churn" | "runway" | "unit" | "burn";
  const riskScores: Array<{ k: RiskDom; w: number }> = [
    { k: "churn", w: churn > 0.15 ? 3.5 : churn * 10 },
    { k: "runway", w: runway < 6 ? 3.2 : runway < 9 ? 1.5 : 0.4 },
    { k: "unit", w: ltvCacDisplay < 1 ? 3.0 : ltvCacDisplay < 2 ? 1.8 : 0.5 },
    { k: "burn", w: Number(result.burnMultiple) > 3 ? 2.6 : 0.6 },
  ];
  const dom = riskScores.sort((a, b) => b.w - a.w)[0]!.k;
  const domText =
    dom === "churn"
      ? investmentMemoTexts.risk.churnDom
      : dom === "runway"
        ? investmentMemoTexts.risk.runwayDom
        : dom === "unit"
          ? investmentMemoTexts.risk.unitDom
          : investmentMemoTexts.risk.burnDom;

  const secondaryBits: string[] = [];
  if (dom !== "churn" && churn > 0.12) secondaryBits.push("повышенный churn");
  if (dom !== "runway" && runway < 9) secondaryBits.push("средний runway");
  if (dom !== "unit" && ltvCacDisplay < 2.2) secondaryBits.push("пограничная юнит-экономика");
  if (dom !== "burn" && Number(result.burnMultiple) > 2.5) secondaryBits.push("напряжённый burn multiple");
  const secondary = secondaryBits.length ? secondaryBits.join(", ") : "конкуренция за внимание пользователя и скорость продуктовых релизов";

  const riskAnalysis = [investmentMemoTexts.risk.lead, domText, fill(investmentMemoTexts.risk.secondary, { secondary })].join(" ");

  const grossMargin = Number(result.grossMargin) || 0;
  const monthlyRevenue = Number(result.monthlyRevenue) || 0;
  const burn = Number(input.burnMonthly) || 0;
  const profit = monthlyRevenue * grossMargin - burn;

  const dominantFactors =
    dom === "churn"
      ? "churn и его влияние на LTV"
      : dom === "runway"
        ? "runway и чувствительность к burn"
        : dom === "unit"
          ? "LTV/CAC и окупаемость привлечения"
          : "burn multiple и соотношение новой выручки к расходам";

  const investorReasoning = [
    fill(investmentMemoTexts.reasoning.lead, {
      g: growthScore.toFixed(0),
      u: unitScore.toFixed(0),
      p: pmfScore.toFixed(0),
      m: marketScore.toFixed(0),
      e: effScore.toFixed(0),
      r: riskAvg.toFixed(0),
      inv: invScore.toFixed(0),
    }),
    fill(investmentMemoTexts.reasoning.sp, { spPct, dominant: dominantFactors }),
    investmentMemoTexts.reasoning.interactions,
    fill(
      "Финансовый слой: валовая прибыль минус burn даёт {sign}; runway {rm} мес читается как {rb}.",
      {
        sign: profit < 0 ? "отрицательный вклад в текущем месяце" : "неотрицательный вклад при введённых допущениях",
        rm: runway.toFixed(1),
        rb: runwayBench,
      },
    ),
  ].join(" ");

  type Gap = { action: string; impact: "high" | "medium" | "low"; improves: string; score: number };
  const gaps: Gap[] = [];
  const churnGap = Math.max(0, churn - 0.05);
  if (churnGap > 0) gaps.push({ action: "Снизить churn через продуктовый onboarding и ценность в первые 14 дней.", impact: churnGap > 0.08 ? "high" : "medium", improves: "LTV / PMF", score: churnGap * 1.5 });
  const ltvGap = Math.max(0, 3 - ltvCacDisplay);
  if (ltvGap > 0) gaps.push({ action: "Оптимизировать CAC: сузить каналы, усилить конверсию и квалификацию лида.", impact: ltvGap > 1.2 ? "high" : "medium", improves: "LTV/CAC", score: ltvGap * 1.4 });
  const growthGap = Math.max(0, 15 - growthPct);
  if (growthGap > 0) gaps.push({ action: "Ускорить рост MoM за счёт воспроизводимых GTM-механик и апсейла.", impact: growthGap > 8 ? "high" : "medium", improves: "Growth", score: growthGap * 1.2 });
  const retGap = Math.max(0, 0.28 - retentionD30);
  if (retGap > 0) gaps.push({ action: "Усилить удержание: ключевые сценарии активации и привычка к продукту.", impact: retGap > 0.12 ? "high" : "medium", improves: "Retention D30", score: retGap * 1.25 });
  const runwayGap = Math.max(0, 12 - runway);
  if (runwayGap > 0) gaps.push({ action: "Продлить runway: снизить burn или ускорить приток выручки по уже работающим воронкам.", impact: runwayGap > 6 ? "high" : "low", improves: "Runway", score: runwayGap * 1.0 });
  gaps.sort((a, b) => b.score - a.score);
  while (gaps.length < 3) {
    gaps.push({
      action: "Заполнить недостающие метрики (удержание, выручка, маркетинг) для снижения неопределённости модели.",
      impact: "medium",
      improves: "Confidence",
      score: 0.01,
    });
  }
  const actionPriorities = gaps.slice(0, 5).map(({ action, impact, improves }) => ({ action, impact, improves }));

  let signal: InvestmentMemoVerdict;
  let verdictBody: string;
  if (sp >= 0.72 && invScore >= 68 && riskAvg <= 42) {
    signal = "BUY";
    verdictBody = investmentMemoTexts.verdict.buy;
  } else if (sp >= 0.48 && invScore >= 48 && riskAvg <= 62) {
    signal = "HOLD";
    verdictBody = investmentMemoTexts.verdict.hold;
  } else if (sp >= 0.28 && riskAvg < 78) {
    signal = "WATCH";
    verdictBody = investmentMemoTexts.verdict.watch;
  } else {
    signal = "AVOID";
    verdictBody = investmentMemoTexts.verdict.avoid;
  }

  const finalVerdict = {
    signal,
    explanation: verdictBody,
    wouldChange: fill(
      "Решение меняется при сдвиге: LTV/CAC выше {ltvOk}, churn ниже {chOk}, runway выше {rwOk} мес при сохранении темпа роста.",
      { ltvOk: "2.5", chOk: "12%", rwOk: "9" },
    ),
  };

  const actionsNarrative = actionPriorities
    .slice(0, 3)
    .map((a, i) => `Пункт ${i + 1} (влияние ${a.impact}, метрика ${a.improves}): ${a.action}`)
    .join(" ");

  const insightsChunks: [string, string, string] = [
    [executiveSummary, businessContext].join(" "),
    [growthAnalysis, productMarketFit, unitEconomicsNarrative, marketAnalysis].join(" "),
    [riskAnalysis, investorReasoning, `${investmentMemoTexts.actions.title} ${actionsNarrative}`, `${signal}. ${verdictBody}`, finalVerdict.wouldChange].join(" "),
  ];

  const htmlSections: Record<string, string> = {
    executive: `<section class="memo-section">${paragraph("small", executiveSummary)}</section>`,
    business: `<section class="memo-section">${paragraph("small", businessContext)}</section>`,
    growth: `<section class="memo-section">${paragraph("small", growthAnalysis)}</section>`,
    pmf: `<section class="memo-section">${paragraph("small", productMarketFit)}</section>`,
    unit: `<section class="memo-section">${paragraph("small", unitEconomicsNarrative)}</section>`,
    market: `<section class="memo-section">${paragraph("small", marketAnalysis)}</section>`,
    risk: `<section class="memo-section">${paragraph("small", riskAnalysis)}</section>`,
    reasoning: `<section class="memo-section">${paragraph("small", investorReasoning)}</section>`,
    actions: `<section class="memo-section">${paragraph("small", `${investmentMemoTexts.actions.title} ${actionPriorities.map((a) => `${a.action} (${a.impact} → ${a.improves})`).join(" ")}`)}</section>`,
    verdict: `<section class="memo-section">${paragraph("small", `${signal}. ${verdictBody} ${finalVerdict.wouldChange}`)}</section>`,
  };

  return {
    executiveSummary,
    businessContext,
    growthAnalysis,
    productMarketFit,
    unitEconomicsNarrative,
    marketAnalysis,
    riskAnalysis,
    investorReasoning,
    actionPriorities,
    finalVerdict,
    benchmarkLabels: {
      growth: growthBench,
      retentionD30: retBench,
      ltvToCac: ltvBench,
      runway: runwayBench,
    },
    insightsChunks,
    htmlSections,
  };
}
