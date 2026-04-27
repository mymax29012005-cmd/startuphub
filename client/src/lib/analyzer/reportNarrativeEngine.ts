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
  const fullDocument = [
    memo.executiveSummary,
    memo.businessContext,
    memo.growthAnalysis,
    memo.productMarketFit,
    memo.unitEconomicsNarrative,
    memo.marketAnalysis,
    memo.riskAnalysis,
    memo.investorReasoning,
    memo.actionPriorities.map((a) => `${a.action} [${a.impact} → ${a.improves}]`).join("\n"),
    `${memo.finalVerdict.signal}. ${memo.finalVerdict.explanation} ${memo.finalVerdict.wouldChange}`,
  ].join("\n\n");

  return {
    insightsChunks: memo.insightsChunks,
    fullDocument,
    memo,
  };
}
