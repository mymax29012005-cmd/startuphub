import type { StartupAnalysisInput, StartupAnalysisResult } from "./types";
import { buildInvestmentMemo, type InvestmentMemoReport } from "./investmentMemoEngine";

export type ReportNarrative = {
  insightsChunks: [string, string, string];
  fullDocument: string;
  memo: InvestmentMemoReport;
};

/** Совместимость: делегирует в Investment Memo (VC-style narrative). */
export function reportNarrativeEngine(result: StartupAnalysisResult, input: StartupAnalysisInput): ReportNarrative {
  const memo = buildInvestmentMemo(input, result);
  const v2 = result.analysisVersion === "v2";
  const priorityRu = (p: "high" | "medium" | "low") => (p === "high" ? "высокий" : p === "medium" ? "средний" : "низкий");

  const qualityBlock = v2
    ? [
        `Сила бизнеса: ${Math.round(result.businessScore ?? 0)}/100`,
        `Надёжность оценки: ${Math.round(result.dataConfidenceScore ?? 0)}/100`,
        `Полнота данных: ${Math.round(result.dataCompletenessPct ?? 0)}%`,
        `Согласованность данных: ${Math.round(result.consistencyScore ?? 0)}/100`,
        `Соответствие стадии: ${Math.round(result.stageFitScore ?? 0)}/100`,
        `Диапазон вероятности успеха: ${result.successProbabilityRange ? `${result.successProbabilityRange.low}–${result.successProbabilityRange.high}%` : "—"}`,
      ].join("\n")
    : "";

  const consistencyBlock = v2
    ? [
        "Проверка согласованности данных:",
        ...(result.consistencyChecks?.warnings?.length ? result.consistencyChecks.warnings.map((w) => `- ${w}`) : ["- предупреждений нет"]),
      ].join("\n")
    : "";

  const decisionBlock = v2
    ? [
        "Почему такой вердикт:",
        ...(result.decisionReasoning?.because?.length ? result.decisionReasoning.because.map((x) => `- ${x}`) : []),
        ...(result.decisionReasoning?.blockers?.length ? ["Блокеры:", ...result.decisionReasoning.blockers.map((x) => `- ${x}`)] : []),
        ...(result.decisionReasoning?.whatChangesDecision?.length ? ["Что изменит решение:", ...result.decisionReasoning.whatChangesDecision.map((x) => `- ${x}`)] : []),
        ...(result.decisionReasoning?.nextMilestoneFocus?.length ? ["Следующий этап:", ...result.decisionReasoning.nextMilestoneFocus.map((x) => `- ${x}`)] : []),
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const actionsBlock = v2
    ? [
        "План действий:",
        ...(result.actionPriorities?.length
          ? result.actionPriorities.map((a, i) => `${i + 1}. ${a.title} (приоритет: ${priorityRu(a.priority)}) — ${a.reason} Ожидаемый эффект: ${a.expectedImpact}`)
          : []),
      ].join("\n")
    : "";

  const fullDocument = [
    memo.executiveSummary,
    qualityBlock,
    memo.businessContext,
    memo.growthAnalysis,
    memo.productMarketFit,
    memo.unitEconomicsNarrative,
    memo.marketAnalysis,
    memo.riskAnalysis,
    consistencyBlock,
    memo.investorReasoning,
    decisionBlock,
    actionsBlock,
    memo.actionPriorities.map((a) => `${a.action} [${a.impact} → ${a.improves}]`).join("\n"),
    `${memo.finalVerdict.signal}. ${memo.finalVerdict.explanation} ${memo.finalVerdict.wouldChange}`,
  ]
    .filter((s) => String(s || "").trim().length > 0)
    .join("\n\n");

  return {
    insightsChunks: memo.insightsChunks,
    fullDocument,
    memo,
  };
}
