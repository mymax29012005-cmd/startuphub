import type {
  ActionPriorityItem,
  DecisionReasoning,
  EstimateConfidenceLabel,
  RedFlags,
  SensitivityDriver,
  StartupAnalysisInput,
  StartupAnalysisResult,
} from "../types";
import { computeRevenueQuality } from "./revenueQuality";
import { computeMoatEvidence } from "./moatEvidence";
import { computeStageEvidence } from "./stageEvidence";
import { computeMarketStructure } from "./marketStructure";
import { computeAutoSwot } from "./swot";
import { computeScenarioSummary } from "./scenarios";
import { computeFunnelQuality } from "./funnelQuality";
import { computeCompleteness } from "./completeness";
import { runConsistencyRules } from "./consistencyRules";
import { formatValuationRangeHuman, makeSuccessRange } from "./formatters";
import { getStageAnalysisConfig } from "./stageConfig";
import { reportCopy } from "../reportCopy";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickStrongest(scores: Array<{ key: string; label: string; v: number }>) {
  return scores.slice().sort((a, b) => b.v - a.v)[0]?.label ?? "—";
}

function pickBottleneck(scores: Array<{ key: string; label: string; v: number }>) {
  return scores.slice().sort((a, b) => a.v - b.v)[0]?.label ?? "—";
}

function estimateLabel(score: number): EstimateConfidenceLabel {
  if (score >= 72) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function computeStageFit(input: StartupAnalysisInput, stage: string, completenessPct: number) {
  // Simple: later stages require more objective metrics; early stages are tolerant.
  if (stage === "idea" || input.mode === "idea") {
    const hasAdvanced = input.monthlyRevenue > 0 || input.cac > 0 || input.unitPaybackMonths > 0;
    return clamp((hasAdvanced ? 80 : 92) - Math.max(0, 60 - completenessPct) * 0.4, 35, 100);
  }
  if (stage === "seed") {
    const must = (input.retentionD30 > 0 ? 1 : 0) + (input.burnMonthly > 0 ? 1 : 0) + (input.cashOnHand > 0 ? 1 : 0);
    return clamp(55 + must * 15 + (completenessPct - 50) * 0.35, 25, 100);
  }
  // later
  const must =
    (input.monthlyRevenue > 0 ? 1 : 0) +
    (input.cac > 0 ? 1 : 0) +
    (input.unitPaybackMonths > 0 ? 1 : 0) +
    (input.retentionD30 > 0 ? 1 : 0);
  return clamp(40 + must * 14 + (completenessPct - 55) * 0.4, 15, 100);
}

function computeBusinessScore(input: StartupAnalysisInput, r: StartupAnalysisResult) {
  const cfg = getStageAnalysisConfig(input.stage, input.mode);
  const w = cfg.weights;

  const subjectiveIdeaSignals =
    0.34 * clamp(input.marketValidation, 0, 100) +
    0.33 * clamp(input.teamStrength, 0, 100) +
    0.33 * clamp(input.moatStrength, 0, 100);

  const score =
    w.growth * clamp(r.growthScore, 0, 100) +
    w.unit * clamp(r.unitEconomicsScore, 0, 100) +
    w.pmf * clamp(r.pmfScore, 0, 100) +
    w.efficiency * clamp(r.efficiencyScore, 0, 100) +
    w.market * clamp(r.marketScore, 0, 100) +
    w.subjectiveIdeaSignals * clamp(subjectiveIdeaSignals, 0, 100);

  return clamp(score, 0, 100);
}

function computeActionPriorities(input: StartupAnalysisInput, r: StartupAnalysisResult): ActionPriorityItem[] {
  const items: ActionPriorityItem[] = [];
  const stage = input.stage;

  const churn = Number(r.churn) || 0;

  if (stage === "idea" || input.mode === "idea") {
    const interviews = input.customerInterviewsCount ?? 0;
    const pilots = input.pilotCount ?? 0;
    const waitlist = input.waitlistSize ?? 0;
    if (interviews < 15) {
      items.push({
        title: "Подтвердить проблему через интервью",
        reason: reportCopy.templates.actions[0],
        expectedImpact: "Улучшение здесь создаёт базу для следующего уровня оценки.",
        improves: ["Подтверждённость спроса", "Соответствие стадии", "Надёжность оценки"],
        priority: "high",
      });
    }
    if (pilots < 3 && input.monthlyRevenue === 0) {
      items.push({
        title: "Запустить 1–3 пилота или LOI",
        reason: reportCopy.templates.actions[1],
        expectedImpact: "Это действие одновременно снижает риск и усиливает качество сигнала.",
        improves: ["Надёжность оценки", "PMF"],
        priority: "high",
      });
    }
    if (waitlist < 100) {
      items.push({
        title: "Собрать список ожидания и метрику конверсии в активацию",
        reason: reportCopy.templates.actions[2],
        expectedImpact: "Самый короткий путь усилить сигнал — улучшить этот показатель.",
        improves: ["Рост", "PMF"],
        priority: "medium",
      });
    }
    if (!input.foundersFullTime) {
      items.push({
        title: "Усилить full‑time commitment фаундеров",
        reason: reportCopy.templates.actions[4],
        expectedImpact: "Это действие одновременно снижает риск и усиливает качество сигнала.",
        improves: ["Риск исполнения", "Надёжность оценки"],
        priority: "medium",
      });
    }
    return items.slice(0, 5);
  }

  if (input.retentionD30 > 0 && input.retentionD30 < 0.18) {
    items.push({
      title: "Поднять D30 удержание",
      reason: reportCopy.templates.actions[0],
      expectedImpact: "Если начать с этого, эффект на общую оценку будет быстрее всего заметен.",
      improves: ["PMF", "LTV", "Сила бизнеса"],
      priority: "high",
    });
  }
  if (churn > 0.12) {
    items.push({
      title: "Снизить churn и улучшить онбординг",
      reason: reportCopy.templates.actions[2],
      expectedImpact: "Самый короткий путь усилить сигнал — улучшить этот показатель.",
      improves: ["Риск", "Юнит-экономика"],
      priority: churn > 0.18 ? "high" : "medium",
    });
  }
  if (r.ltvToCac > 0 && r.ltvToCac < 2.0) {
    items.push({
      title: "Улучшить LTV/CAC",
      reason: reportCopy.templates.actions[1],
      expectedImpact: "Улучшение здесь создаёт базу для следующего уровня оценки.",
      improves: ["Юнит-экономика", "Инвестиционный сигнал"],
      priority: "high",
    });
  }
  if (r.runwayMonths > 0 && r.runwayMonths < 9) {
    items.push({
      title: "Продлить запас денег",
      reason: reportCopy.templates.actions[3],
      expectedImpact: "Это действие одновременно снижает риск и усиливает качество сигнала.",
      improves: ["Риск", "Надёжность оценки"],
      priority: r.runwayMonths < 6 ? "high" : "medium",
    });
  }
  if (input.grossMarginPct < 55 && input.grossMarginPct > 0) {
    items.push({
      title: "Поднять валовую маржу",
      reason: reportCopy.templates.actions[4],
      expectedImpact: "Если начать с этого, эффект на общую оценку будет быстрее всего заметен.",
      improves: ["Юнит-экономика", "Эффективность"],
      priority: "medium",
    });
  }
  return items.slice(0, 5);
}

function computeRedFlags(input: StartupAnalysisInput, r: StartupAnalysisResult, consistency: { warnings: string[]; contradictionsFound: number }, cfg: ReturnType<typeof getStageAnalysisConfig>): RedFlags {
  const red: string[] = [];
  const yellow: string[] = [];
  const info: string[] = [];

  if (r.runwayMonths > 0 && r.runwayMonths < cfg.thresholds.runwayRedMonths) red.push(`Запас денег меньше ${cfg.thresholds.runwayRedMonths} мес`);
  else if (r.runwayMonths > 0 && r.runwayMonths < cfg.thresholds.runwayYellowMonths) yellow.push(`Запас денег меньше ${cfg.thresholds.runwayYellowMonths} мес`);

  if (r.churn > cfg.thresholds.churnRed) red.push("Слишком высокий churn");
  else if (r.churn > cfg.thresholds.churnYellow) yellow.push("Повышенный churn");

  if (input.retentionD30 > 0 && input.retentionD30 < cfg.thresholds.retentionD30Red) red.push("Очень слабое удержание D30");
  else if (input.retentionD30 > 0 && input.retentionD30 < cfg.thresholds.retentionD30Yellow) yellow.push("Удержание D30 ниже нормы для стадии");

  if (!input.foundersFullTime) yellow.push("Фаундеры не full‑time");
  if (input.regulatory === "high") yellow.push("Высокая регуляторная неопределённость");
  if (input.tech === "high") yellow.push("Высокий технический риск");

  if (consistency.contradictionsFound >= 3) red.push("Обнаружены сильные противоречия во вводных данных");
  else if (consistency.contradictionsFound >= 1) info.push("Есть предупреждения по согласованности данных");

  // surface first warnings as info hints (short list in UI)
  for (const w of consistency.warnings.slice(0, 3)) info.push(w);

  return { red, yellow, info };
}

function computeDecisionReasoning(
  input: StartupAnalysisInput,
  r: StartupAnalysisResult,
  businessScore: number,
  dataConfidenceScore: number,
  stageFitScore: number,
  consistencyScore: number,
): DecisionReasoning {
  const stage = input.stage;
  const because: string[] = [];
  const blockers: string[] = [];
  const topPositiveDrivers: string[] = [];
  const topNegativeDrivers: string[] = [];
  const whatChangesDecision: string[] = [];
  const nextMilestoneFocus: string[] = [];

  const risk = r.riskAvg;

  // Drivers (simple & explainable)
  if (r.growthScore >= 65) topPositiveDrivers.push(`Темп роста выглядит сильным для текущих вводных. ${reportCopy.templates.strengths[0]}`);
  if (r.unitEconomicsScore >= 65) topPositiveDrivers.push(`Юнит-экономика близка к устойчивой. ${reportCopy.templates.strengths[2]}`);
  if (r.pmfScore >= 60) topPositiveDrivers.push(`Есть признаки PMF (удержание/органика/повтор). ${reportCopy.templates.strengths[3]}`);
  if (r.runwayMonths >= 12) topPositiveDrivers.push(`Запас денег даёт достаточно времени на улучшения. ${reportCopy.templates.strengths[1]}`);
  if ((r.revenueQualityScore ?? 0) >= 65) topPositiveDrivers.push(`Профиль выручки выглядит устойчивым. ${reportCopy.templates.revenue[0]}`);
  if ((r.moatEvidenceScore ?? 0) >= 60) topPositiveDrivers.push(`Есть признаки подтверждённой защитимости. ${reportCopy.templates.moat[0]}`);
  if ((r.stageEvidenceScore ?? 0) >= 60 && (stage === "idea" || stage === "seed" || input.mode === "idea"))
    topPositiveDrivers.push(`Сильная доказательная база на ранней стадии. ${reportCopy.templates.strengths[4]}`);
  if ((r.funnelQualityScore ?? 0) >= 65) topPositiveDrivers.push(`Качество воронки выглядит здоровым. ${reportCopy.templates.strengths[1]}`);

  if (input.retentionD30 > 0 && input.retentionD30 < 0.15) topNegativeDrivers.push(`Удержание D30 низкое. ${reportCopy.templates.weaknesses[0]}`);
  if (r.ltvToCac > 0 && r.ltvToCac < 2) topNegativeDrivers.push(`LTV/CAC ниже комфортного уровня для масштаба. ${reportCopy.templates.weaknesses[1]}`);
  if (r.runwayMonths > 0 && r.runwayMonths < 9) topNegativeDrivers.push(`Короткий запас денег усиливает риск «не успеть исправить». ${reportCopy.templates.weaknesses[4]}`);
  if (dataConfidenceScore < 55) topNegativeDrivers.push(`Надёжность оценки снижает доверие к выводам. ${reportCopy.templates.trust[1]}`);
  if ((r.concentrationRiskScore ?? 0) >= 70) topNegativeDrivers.push(`Высокая концентрация выручки. ${reportCopy.templates.revenue[3]}`);
  if ((r.moatGapFlag ?? false) === true) topNegativeDrivers.push(`Есть разрыв между заявленным moat и подтверждённостью. ${reportCopy.templates.moat[3]}`);
  if ((r.funnelQualityScore ?? 0) > 0 && (r.funnelQualityScore ?? 0) < 45) topNegativeDrivers.push(`Качество воронки слабое: проблема может начинаться до удержания. ${reportCopy.templates.weaknesses[2]}`);
  if ((r.marketStructurePressureScore ?? 0) >= 70) topNegativeDrivers.push(`Высокое давление структуры рынка. ${reportCopy.templates.risks[0]}`);

  // Verdict (stage-aware, deterministic)
  let verdict: DecisionReasoning["verdict"] = "WATCH";
  if (businessScore >= 72 && risk <= 45 && dataConfidenceScore >= 62 && stageFitScore >= 60) verdict = "BUY";
  else if (businessScore >= 56 && risk <= 62 && dataConfidenceScore >= 52) verdict = "HOLD";
  else if (businessScore >= 38 && risk <= 78) verdict = "WATCH";
  else verdict = "AVOID";

  // Early stage bias: never jump to BUY on idea with low confidence
  if ((stage === "idea" || input.mode === "idea") && dataConfidenceScore < 65) {
    if (verdict === "BUY") verdict = "HOLD";
  }

  because.push(
    `Вердикт ${verdict} определяется балансом силы бизнеса (${Math.round(businessScore)}/100), риск-профиля (${Math.round(risk)}/100) и доверия к данным (${Math.round(dataConfidenceScore)}/100).`,
  );
  because.push(`Соответствие выбранной стадии по метрикам: ${Math.round(stageFitScore)}/100; согласованность данных: ${Math.round(consistencyScore)}/100.`);

  if (verdict === "WATCH") blockers.push("недостаточно доказательств устойчивости (PMF/экономики/повторяемости)");
  if (dataConfidenceScore < 55) blockers.push("низкая полнота/согласованность метрик ограничивает точность выводов");
  if (r.runwayMonths > 0 && r.runwayMonths < 6) blockers.push("запас денег слишком короткий — риск кассового разрыва доминирует");

  if (verdict === "WATCH") {
    whatChangesDecision.push("Поднять удержание D30 и/или снизить churn на когортах.");
    whatChangesDecision.push("Улучшить LTV/CAC (через снижение CAC или рост LTV).");
    whatChangesDecision.push("Продлить запас денег до безопасного коридора (>= 9-12 месяцев).");
    if ((r.revenueQualityScore ?? 0) > 0 && (r.revenueQualityScore ?? 0) < 60) whatChangesDecision.push("Улучшить качество выручки: повысить повторяемость и снизить концентрацию.");
    if ((r.moatEvidenceScore ?? 0) > 0 && (r.moatEvidenceScore ?? 0) < 55) whatChangesDecision.push("Собрать подтверждения moat: данные, switching costs, интеграции, канал.");
    if ((r.funnelQualityScore ?? 0) > 0 && (r.funnelQualityScore ?? 0) < 60) whatChangesDecision.push("Сократить time-to-value и поднять активацию до улучшения удержания.");
  } else if (verdict === "HOLD") {
    whatChangesDecision.push("Доказать устойчивую экономику канала (payback, LTV/CAC) на масштабе.");
    whatChangesDecision.push("Показать воспроизводимый рост без деградации удержания.");
  } else if (verdict === "AVOID") {
    whatChangesDecision.push("Исправить доминирующий риск: churn, запас денег или юнит-экономику.");
    whatChangesDecision.push("Повысить полноту и проверяемость метрик, чтобы убрать неопределённость.");
  }

  if (stage === "idea" || input.mode === "idea") {
    nextMilestoneFocus.push("доказать спрос: интервью → пилоты/LOI → повторяемые активации");
    nextMilestoneFocus.push("сформулировать ICP и ценностное предложение с измеримой конверсией");
    nextMilestoneFocus.push("зафиксировать следующий шаг (60–90 дней) и метрику успеха");
  } else if (stage === "seed") {
    nextMilestoneFocus.push("закрыть петлю удержания и активации (D30, активация)");
    nextMilestoneFocus.push("показать первые признаки воспроизводимого канала роста");
  } else {
    nextMilestoneFocus.push("подтвердить экономику масштаба: LTV/CAC, окупаемость, burn‑мультипликатор");
    nextMilestoneFocus.push("показать устойчивость удержания и качество роста (NRR/расширение, если применимо)");
  }

  return {
    verdict,
    because,
    blockers,
    topPositiveDrivers,
    topNegativeDrivers,
    whatChangesDecision,
    nextMilestoneFocus,
  };
}

function computeSensitivityDrivers(input: StartupAnalysisInput, r: StartupAnalysisResult): SensitivityDriver[] {
  const drivers: SensitivityDriver[] = [];

  const d30 = input.retentionD30 || 0;
  drivers.push({
    key: "retentionD30",
    label: "Удержание D30",
    direction: d30 >= 0.18 ? "positive" : "negative",
    impactLabel: d30 >= 0.22 ? "сильное" : d30 >= 0.15 ? "среднее" : "высокое",
    description: d30 >= 0.18 ? "Удержание поддерживает PMF и рост LTV." : "Низкое удержание снижает LTV и делает рост дорогим.",
  });

  const runway = r.runwayMonths || 0;
  drivers.push({
    key: "runwayMonths",
    label: "Запас денег",
    direction: runway >= 12 ? "positive" : "negative",
    impactLabel: runway >= 15 ? "сильное" : runway >= 9 ? "среднее" : "высокое",
    description: runway >= 12 ? "Есть окно для улучшений без давления по кассе." : "Короткий запас денег усиливает риск и снижает качество решения.",
  });

  const ltvCac = r.ltvToCac || 0;
  drivers.push({
    key: "ltvToCac",
    label: "LTV/CAC",
    direction: ltvCac >= 2.5 ? "positive" : "negative",
    impactLabel: ltvCac >= 3 ? "сильное" : ltvCac >= 2 ? "среднее" : "высокое",
    description: ltvCac >= 2.5 ? "Экономика привлечения позволяет масштабировать каналы." : "Низкий LTV/CAC ограничивает масштабирование.",
  });

  const gm = (r.grossMargin || 0) * 100;
  drivers.push({
    key: "grossMargin",
    label: "Валовая маржа",
    direction: gm >= 65 ? "positive" : "negative",
    impactLabel: gm >= 75 ? "сильное" : gm >= 60 ? "среднее" : "высокое",
    description: gm >= 65 ? "Маржа оставляет ресурс на рост и покрытие burn." : "Низкая маржа ухудшает payback и эффективность.",
  });

  const founders = input.foundersFullTime;
  drivers.push({
    key: "foundersFullTime",
    label: "Full‑time фаундеров",
    direction: founders ? "positive" : "negative",
    impactLabel: founders ? "среднее" : "высокое",
    description: founders ? "Снижает execution‑риск." : "Повышает риск недоисполнения плана.",
  });

  return drivers.slice(0, 5);
}

export function enrichAnalysisV2(input: StartupAnalysisInput, base: StartupAnalysisResult): StartupAnalysisResult {
  const cfg = getStageAnalysisConfig(input.stage, input.mode);

  const completeness = computeCompleteness(input, [...cfg.required, ...cfg.desired]);
  const consistency = runConsistencyRules(input, base);
  const consistencyScore = clamp(100 - consistency.penaltyPoints * 2.2 - Math.max(0, consistency.contradictionsFound - 1) * 8, 0, 100);

  const completenessPct = clamp(completeness.pct, 0, 100);
  const stageFitScore = computeStageFit(input, input.stage, completenessPct);

  // Objective presence: encourage real metrics on later stages
  const objectiveSignals =
    (input.retentionD30 > 0 ? 1 : 0) +
    (input.monthlyRevenue > 0 ? 1 : 0) +
    (input.cac > 0 ? 1 : 0) +
    (input.burnMonthly > 0 && input.cashOnHand > 0 ? 1 : 0);
  const objectiveScore = clamp((objectiveSignals / 4) * 100, 0, 100);

  let dataConfidenceScore = 0.45 * completenessPct + 0.35 * consistencyScore + 0.2 * objectiveScore;
  // Idea stage: more uncertainty by default
  if (input.stage === "idea" || input.mode === "idea") dataConfidenceScore -= 8;
  dataConfidenceScore = clamp(dataConfidenceScore, 0, 100);

  const businessScore = computeBusinessScore(input, base);
  const estimateConfidenceLabel = estimateLabel(dataConfidenceScore);
  const successProbabilityRange = makeSuccessRange(base.successProbability, dataConfidenceScore, input.stage);
  const valuationRangeHuman = formatValuationRangeHuman(base.valuationLow, base.valuationBase, base.valuationHigh);

  const componentScores = [
    { key: "growth", label: "рост", v: base.growthScore },
    { key: "unit", label: "юнит-экономика", v: base.unitEconomicsScore },
    { key: "pmf", label: "PMF", v: base.pmfScore },
    { key: "eff", label: "эффективность", v: base.efficiencyScore },
    { key: "market", label: "рынок", v: base.marketScore },
  ];
  const strongestArea = pickStrongest(componentScores);
  const mainBottleneck = pickBottleneck(componentScores);

  const decisionReasoning: DecisionReasoning = computeDecisionReasoning(
    input,
    base,
    businessScore,
    dataConfidenceScore,
    stageFitScore,
    consistencyScore,
  );

  const actionPriorities = computeActionPriorities(input, base);
  const redFlags: RedFlags = computeRedFlags(input, base, consistency, cfg);
  const sensitivityAnalysis = { topDrivers: computeSensitivityDrivers(input, base) as SensitivityDriver[] };

  const revenueQuality = computeRevenueQuality(input);
  const moatEvidence = computeMoatEvidence(input);
  const stageEvidence = computeStageEvidence(input);
  const marketStructure = computeMarketStructure(input);
  const funnelQuality = computeFunnelQuality(input);

  const scenarioSummary = computeScenarioSummary(input, {
    ...base,
    dataConfidenceScore,
  } as StartupAnalysisResult);

  const swot = computeAutoSwot(input, {
    ...base,
    dataConfidenceScore,
    revenueQualityScore: revenueQuality?.revenueQualityScore,
    concentrationRiskScore: revenueQuality?.concentrationRiskScore,
    moatEvidenceScore: moatEvidence?.moatEvidenceScore,
    stageEvidenceScore: stageEvidence?.stageEvidenceScore,
    funnelQualityScore: funnelQuality?.funnelQualityScore,
  } as StartupAnalysisResult);

  return {
    ...base,
    analysisVersion: "v2",
    businessScore,
    dataConfidenceScore,
    dataCompletenessPct: completenessPct,
    stageFitScore,
    consistencyScore,
    estimateConfidenceLabel,
    successProbabilityRange,
    valuationRangeHuman,
    strongestArea,
    mainBottleneck,
    decisionReasoning,
    consistencyChecks: {
      warnings: consistency.warnings,
      penalties: consistency.penalties,
      contradictionsFound: consistency.contradictionsFound,
    },
    sensitivityAnalysis,
    actionPriorities,
    redFlags,

    revenueQualityScore: revenueQuality?.revenueQualityScore,
    concentrationRiskScore: revenueQuality?.concentrationRiskScore,
    customerConcentrationRisk: revenueQuality?.customerConcentrationRisk,
    revenueQualityNotes: revenueQuality?.notes,

    moatEvidenceScore: moatEvidence?.moatEvidenceScore,
    moatGapFlag: moatEvidence?.moatGapFlag,
    moatEvidenceNotes: moatEvidence?.notes,

    stageEvidenceScore: stageEvidence?.stageEvidenceScore,
    stageEvidenceNotes: stageEvidence?.notes,

    funnelQualityScore: funnelQuality?.funnelQualityScore,
    funnelQualityNotes: funnelQuality?.notes,

    marketStructurePressureScore: marketStructure?.marketStructurePressureScore,
    marketStructureNotes: marketStructure?.notes,

    swot,
    scenarioSummary,
  };
}

