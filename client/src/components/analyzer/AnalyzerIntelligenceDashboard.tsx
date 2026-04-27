"use client";

import { Button } from "@/components/ui/Button";
import { RadarChart } from "@/components/analyzer/RadarChart";
import { CashflowBars } from "@/components/analyzer/CashflowBars";
import { EfficiencyLineChart, GrowthLineChart, RiskBarChart } from "@/components/analyzer/IntelligenceMiniCharts";
import type { ReportNarrative } from "@/lib/analyzer/reportNarrativeEngine";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import type { InvestmentMemoVerdict } from "@/lib/analyzer/investmentMemoEngine";

type Props = {
  report: StartupAnalysisResult;
  analysisInput: StartupAnalysisInput;
  narrative: ReportNarrative;
  scores: number[];
  radarLabels: string[];
  riskLevelLabel: string;
  t: (k: string) => string;
  me: { id: string; role: "user" | "admin" } | null;
  saving: boolean;
  saved: boolean;
  onBackToParams: () => void;
  onSave: () => void;
  onEnsureSavedAndGo: (target: "startup" | "idea") => void;
};

function verdictAccent(v: InvestmentMemoVerdict): string {
  if (v === "BUY") return "text-[#00f5d4]";
  if (v === "HOLD") return "text-[#6ea8ff]";
  if (v === "WATCH") return "text-violet-300";
  return "text-rose-300";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AnalyzerIntelligenceDashboard({
  report,
  analysisInput,
  narrative,
  scores,
  radarLabels,
  riskLevelLabel,
  t,
  me,
  saving,
  saved,
  onBackToParams,
  onSave,
  onEnsureSavedAndGo,
}: Props) {
  const memo = narrative.memo;
  const spPct = Math.round(report.successProbability * 100);
  const growthPct = Number(analysisInput.growthMonthlyPct) || 0;
  const ltvCac = Number(report.ltvToCac) || 0;
  const retD30 = Math.round((Number(analysisInput.retentionD30) || 0) * 100);
  const runwayM = Number(report.runwayMonths) || 0;
  const runwayLabel = runwayM >= 18 ? `${Math.round(runwayM)} мес` : runwayM >= 12 ? `${Math.round(runwayM)} мес` : `${runwayM.toFixed(1)} мес`;

  const riskBars = [
    clamp((Number(report.churn) || 0) * 120 + analysisInput.monthlyChurnPct * 3, 15, 95),
    clamp(ltvCac > 0 ? Math.max(20, 95 - ltvCac * 22) : 55, 15, 95),
    clamp(runwayM < 5 ? 88 : runwayM < 9 ? 62 : runwayM < 14 ? 45 : 28, 15, 95),
    clamp((report.marketRisk + report.competitionRisk) / 2, 15, 95),
    clamp(report.techRisk, 15, 95),
  ];

  const effStages = [report.growthScore, report.unitEconomicsScore, report.pmfScore, report.efficiencyScore];

  const title = (analysisInput.title ?? "").trim() || "Startup Deep Analysis";

  return (
    <div className="ia-container space-y-4">
      <div className="ia-grid">
        <div className="ia-card ia-w-8 ia-violet">
          <span className="ia-badge">Investment Intelligence</span>
          <h1>{title}</h1>
          <p>{memo.executiveSummary.slice(0, 280)}{memo.executiveSummary.length > 280 ? "…" : ""}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="ghost" className="h-10" onClick={onBackToParams}>
              {t("analyzer.actions.backToAnalyzer")}
            </Button>
          </div>
        </div>
        <div className="ia-card ia-w-4 ia-rose">
          <h2>Success Score</h2>
          <div className="ia-metric">{spPct}%</div>
          <p className="ia-small">вероятность устойчивого роста</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-3 ia-blue">
          <h3>Growth</h3>
          <div className="ia-metric">+{growthPct.toFixed(1)}%</div>
          <p className="ia-small">MoM</p>
        </div>
        <div className="ia-card ia-w-3 ia-violet">
          <h3>LTV/CAC</h3>
          <div className="ia-metric">{ltvCac > 0 ? ltvCac.toFixed(2) : "—"}</div>
          <p className="ia-small">unit efficiency</p>
        </div>
        <div className="ia-card ia-w-3 ia-mint">
          <h3>Retention</h3>
          <div className="ia-metric">{retD30 > 0 ? `${retD30}%` : "—"}</div>
          <p className="ia-small">D30 (вводные)</p>
        </div>
        <div className="ia-card ia-w-3 ia-rose">
          <h3>Runway</h3>
          <div className="ia-metric">{runwayLabel}</div>
          <p className="ia-small">cash survival</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-8 ia-violet">
          <h2>Business Narrative</h2>
          <p>{memo.businessContext}</p>
          <p>{memo.growthAnalysis}</p>
        </div>
        <div className="ia-card ia-w-4 ia-blue">
          <h3>Key Insights</h3>
          <div className="ia-insightLine">
            <span aria-hidden>✔</span>
            <span>{narrative.insightsChunks[0].slice(0, 220)}{narrative.insightsChunks[0].length > 220 ? "…" : ""}</span>
          </div>
          <div className="ia-insightLine">
            <span aria-hidden>⚠</span>
            <span>{narrative.insightsChunks[1].slice(0, 220)}{narrative.insightsChunks[1].length > 220 ? "…" : ""}</span>
          </div>
          <div className="ia-insightLine">
            <span aria-hidden>★</span>
            <span>{narrative.insightsChunks[2].slice(0, 220)}{narrative.insightsChunks[2].length > 220 ? "…" : ""}</span>
          </div>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-6 ia-blue">
          <h2>Growth Dynamics</h2>
          <p>{memo.growthAnalysis}</p>
        </div>
        <div className="ia-card ia-w-6">
          <h3 className="ia-small mb-2">Discounted cashflow по годам (прокси динамики)</h3>
          <GrowthLineChart values={report.yearCashflows.length ? report.yearCashflows : [0, 1, 2, 3, 4, 5]} />
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-4 ia-violet">
          <h2>Unit Economics</h2>
          <p>{memo.unitEconomicsNarrative}</p>
        </div>
        <div className="ia-card ia-w-4 ia-mint">
          <h2>Market</h2>
          <p>{memo.marketAnalysis}</p>
        </div>
        <div className="ia-card ia-w-4 ia-rose">
          <h2>Risk</h2>
          <p>{memo.riskAnalysis}</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-6 ia-rose">
          <h2>Risk Heatmap</h2>
          <p className="ia-small">Распределение давления по осям: churn, экономика привлечения, runway, рынок, технологии.</p>
          <RiskBarChart labels={["Churn", "CAC/LTV", "Runway", "Market", "Tech"]} values={riskBars} />
        </div>
        <div className="ia-card ia-w-6 ia-violet">
          <h2>Economic Efficiency Curve</h2>
          <p className="ia-small">Баланс роста, юнит-экономики, PMF и операционной эффективности по стадиям модели.</p>
          <EfficiencyLineChart values={effStages} />
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-8 ia-blue">
          <h2>Investor Interpretation</h2>
          <p>{memo.investorReasoning}</p>
        </div>
        <div className="ia-card ia-w-4 ia-rose">
          <h2>Decision Signal</h2>
          <p>
            <b className={verdictAccent(memo.finalVerdict.signal)}>→ {memo.finalVerdict.signal}</b>
          </p>
          <p className="ia-small">{memo.finalVerdict.explanation}</p>
          <hr className="ia-hr" />
          <p className="ia-small mb-2">Триггеры:</p>
          <p className="ia-small">• {memo.benchmarkLabels.retentionD30} удержание D30</p>
          <p className="ia-small">• {memo.benchmarkLabels.ltvToCac} LTV/CAC</p>
          <p className="ia-small">• {memo.benchmarkLabels.growth} рост MoM</p>
        </div>
      </div>

      <div className="ia-card ia-w-12 ia-violet">
        <h2>Final Investment Thesis</h2>
        <p>{memo.executiveSummary}</p>
        <p className="ia-small">{memo.finalVerdict.wouldChange}</p>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-12 ia-violet">
          <h2>Why this score? (Reasoning Layer)</h2>
          <p>{memo.investorReasoning}</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-6 ia-blue">
          <h2>Market Benchmark Comparison</h2>
          <p>Growth: {memo.benchmarkLabels.growth}</p>
          <p>Retention D30: {memo.benchmarkLabels.retentionD30}</p>
          <p>LTV/CAC: {memo.benchmarkLabels.ltvToCac}</p>
          <p>Runway: {memo.benchmarkLabels.runway}</p>
        </div>
        <div className="ia-card ia-w-6 ia-mint">
          <h2>Interpretation vs Market</h2>
          <p>{memo.productMarketFit}</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-12 ia-rose">
          <h2>Action Priority System (What to do next)</h2>
          <p className="ia-small mb-4">Ранжирование по влиянию на рост и инвестиционную привлекательность.</p>
          {memo.actionPriorities.map((a, i) => (
            <p key={i} className="mb-3">
              <b>
                Priority {i + 1} — {a.improves}
              </b>
              <br />
              <span className="text-[rgba(234,240,255,0.72)]">{a.action}</span>
              <span className="ia-small"> ({a.impact})</span>
            </p>
          ))}
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-12 ia-violet">
          <h2>System Final Verdict</h2>
          <p>
            <b className={verdictAccent(memo.finalVerdict.signal)}>{memo.finalVerdict.signal}</b> — {memo.finalVerdict.explanation}
          </p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-6">
          <div className="text-white font-semibold mb-3">{t("analyzer.report.radarTitle")}</div>
          <RadarChart labels={radarLabels} values={scores} />
        </div>
        <div className="ia-card ia-w-6">
          <div className="text-white font-semibold mb-3">{t("analyzer.report.cashflowTitle")}</div>
          <CashflowBars values={report.yearCashflows} />
        </div>
      </div>

      <div className="ia-card ia-w-12">
        <h2 className="text-lg font-semibold text-white mb-4">{t("analyzer.report.summaryTitle")}</h2>
        <div className="ia-grid">
          <div className="ia-card ia-w-4" style={{ background: "rgba(10,10,15,0.6)" }}>
            <div className="ia-small">{t("analyzer.report.probability")}</div>
            <div className="ia-metric mt-2">{(report.successProbability * 100).toFixed(0)}%</div>
            <div className="ia-small mt-1">
              {t("analyzer.report.risk")}: {riskLevelLabel}
            </div>
          </div>
          <div className="ia-card ia-w-4" style={{ background: "rgba(10,10,15,0.6)" }}>
            <div className="ia-small">{t("analyzer.report.runway")}</div>
            <div className="ia-metric mt-2">{runwayM.toFixed(1)} мес</div>
            <div className="ia-small mt-1">
              {t("analyzer.report.burn")}: {Math.round(analysisInput.burnMonthly).toLocaleString("ru-RU")} ₽/мес
            </div>
          </div>
          <div className="ia-card ia-w-4" style={{ background: "rgba(10,10,15,0.6)" }}>
            <div className="ia-small">{t("analyzer.report.expectedValue")}</div>
            <div className="ia-metric mt-2">{Math.round(report.expectedValue).toLocaleString("ru-RU")} ₽</div>
            <div className="ia-small mt-1">{t("analyzer.report.expectedValueHint")}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col flex-wrap gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" className="h-11" onClick={onBackToParams}>
              {t("analyzer.actions.dontSave")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="h-11" disabled={!me || saving} onClick={() => onEnsureSavedAndGo("startup")}>
              {t("analyzer.actions.createStartupWithAnalysis")}
            </Button>
            <Button type="button" variant="secondary" className="h-11" disabled={!me || saving} onClick={() => onEnsureSavedAndGo("idea")}>
              {t("analyzer.actions.createIdeaWithAnalysis")}
            </Button>
            <Button type="button" className="h-11" disabled={!me || saving} onClick={onSave}>
              {saving ? t("analyzer.actions.saving") : t("analyzer.actions.save")}
            </Button>
          </div>
        </div>
        {!me ? <div className="mt-3 ia-small">{t("analyzer.actions.loginToSave")}</div> : null}
        {me && saved ? <div className="mt-3 ia-small">{t("common.success")}</div> : null}
      </div>
    </div>
  );
}
