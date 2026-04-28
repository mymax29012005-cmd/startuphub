"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RadarChart } from "@/components/analyzer/RadarChart";
import { CashflowBars } from "@/components/analyzer/CashflowBars";
import { EfficiencyLineChart, GrowthLineChart, RiskBarChart } from "@/components/analyzer/IntelligenceMiniCharts";
import { HelpTip } from "@/components/analyzer/HelpTip";
import type { ReportNarrative } from "@/lib/analyzer/reportNarrativeEngine";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import type { InvestmentMemoVerdict } from "@/lib/analyzer/investmentMemoEngine";
import { getAnalyzerHint } from "@/lib/analyzer/analyzerGlossary";
import { formatCompactMoneyRu } from "@/lib/analyzer/v2/formatters";

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

function confidenceLabelRu(label: StartupAnalysisResult["estimateConfidenceLabel"]): string {
  if (label === "high") return "высокая";
  if (label === "medium") return "средняя";
  if (label === "low") return "низкая";
  return "—";
}

function priorityRu(p?: "high" | "medium" | "low") {
  if (p === "high") return "высокий";
  if (p === "medium") return "средний";
  if (p === "low") return "низкий";
  return "—";
}

function impactRu(p?: "high" | "medium" | "low") {
  if (p === "high") return "высокое";
  if (p === "medium") return "среднее";
  if (p === "low") return "низкое";
  return "—";
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
  const spRange = report.successProbabilityRange ?? { low: Math.max(0, spPct - 12), high: Math.min(100, spPct + 12) };
  const verdict = report.decisionReasoning?.verdict ?? memo.finalVerdict.signal;
  const viewModes = ["founder", "investor"] as const;
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]>("founder");

  const dataConfidence = report.dataConfidenceScore ?? report.confidenceScore ?? 0;
  const consistencyScore = report.consistencyScore ?? 0;
  const completenessPct = report.dataCompletenessPct ?? 0;
  const stageFitScore = report.stageFitScore ?? 0;
  const businessScore = report.businessScore ?? report.investorScore ?? 0;

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
  const redFlags = report.redFlags;
  const decision = report.decisionReasoning;
  const actions = report.actionPriorities ?? [];
  const drivers = report.sensitivityAnalysis?.topDrivers ?? [];
  const valuationHuman = report.valuationRangeHuman;
  const topConsistencyWarnings = report.consistencyChecks?.warnings?.slice(0, 3) ?? [];
  const allConsistencyWarnings = report.consistencyChecks?.warnings ?? [];
  const allConsistencyPenalties = report.consistencyChecks?.penalties ?? [];
  const contradictionsFound = report.consistencyChecks?.contradictionsFound ?? 0;

  const heroSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (report.strongestArea) parts.push(`Сильная сторона: ${report.strongestArea}`);
    if (report.mainBottleneck) parts.push(`Ограничитель: ${report.mainBottleneck}`);
    return parts.join(" · ") || "—";
  }, [report.strongestArea, report.mainBottleneck]);

  return (
    <div className="ia-container space-y-4">
      <div className="ia-grid">
        <div className="ia-card ia-w-8 ia-violet">
          <span className="ia-badge">Investment Intelligence</span>
          <h1 className="flex flex-wrap items-center gap-2">
            <span className={verdictAccent(verdict as InvestmentMemoVerdict)}>{verdict}</span>
            <span className="text-[rgba(234,240,255,0.85)]">{title}</span>
          </h1>
          <p className="ia-small">Вероятность успеха (диапазон): <b className="text-[rgba(234,240,255,0.9)]">{spRange.low}–{spRange.high}%</b> · Уверенность в оценке: <b className="text-[rgba(234,240,255,0.9)]">{confidenceLabelRu(report.estimateConfidenceLabel)}</b></p>
          {valuationHuman ? (
            <p className="ia-small">
              Диапазон оценки:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">
                {valuationHuman.low} · {valuationHuman.base} · {valuationHuman.high}
              </b>
              <HelpTip text={getAnalyzerHint("valuationRangeHuman")} />
            </p>
          ) : null}
          <p className="ia-small">{heroSubtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition ${viewMode === "founder" ? "bg-white/10 text-white" : "text-[rgba(234,240,255,0.75)] hover:text-white"}`}
                onClick={() => setViewMode("founder")}
              >
                Режим основателя
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition ${viewMode === "investor" ? "bg-white/10 text-white" : "text-[rgba(234,240,255,0.75)] hover:text-white"}`}
                onClick={() => setViewMode("investor")}
              >
                Режим инвестора
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="ghost" className="h-10" onClick={onBackToParams}>
              {t("analyzer.actions.backToAnalyzer")}
            </Button>
          </div>
        </div>
        <div className="ia-card ia-w-4 ia-rose">
          <h2 className="flex items-center">
            Сила бизнеса
            <HelpTip text={getAnalyzerHint("businessScore")} />
          </h2>
          <div className="ia-metric">{Math.round(businessScore)}/100</div>
          <p className="ia-small">итоговая сила бизнеса/идеи</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-3 ia-blue">
          <h3 className="flex items-center">
            Рост
            <HelpTip text={getAnalyzerHint("growthScore")} />
          </h3>
          <div className="ia-metric">+{growthPct.toFixed(1)}%</div>
          <p className="ia-small">помесячно (MoM)</p>
        </div>
        <div className="ia-card ia-w-3 ia-violet">
          <h3 className="flex items-center">
            LTV/CAC
            <HelpTip text={getAnalyzerHint("ltvToCac")} />
          </h3>
          <div className="ia-metric">{ltvCac > 0 ? ltvCac.toFixed(2) : "—"}</div>
          <p className="ia-small">экономика привлечения</p>
        </div>
        <div className="ia-card ia-w-3 ia-mint">
          <h3 className="flex items-center">
            Удержание
            <HelpTip text={getAnalyzerHint("retentionD30")} />
          </h3>
          <div className="ia-metric">{retD30 > 0 ? `${retD30}%` : "—"}</div>
          <p className="ia-small">D30 (вводные)</p>
        </div>
        <div className="ia-card ia-w-3 ia-rose">
          <h3 className="flex items-center">
            Запас денег (runway)
            <HelpTip text={getAnalyzerHint("runwayMonths")} />
          </h3>
          <div className="ia-metric">{runwayLabel}</div>
          <p className="ia-small">запас денег</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-3 ia-violet">
          <h3 className="flex items-center">
            Доверие к данным
            <HelpTip text={getAnalyzerHint("dataConfidenceScore")} />
          </h3>
          <div className="ia-metric">{Math.round(dataConfidence)}/100</div>
          <p className="ia-small">полнота + согласованность + объективные метрики</p>
        </div>
        <div className="ia-card ia-w-3 ia-blue">
          <h3 className="flex items-center">
            Согласованность
            <HelpTip text={getAnalyzerHint("consistencyScore")} />
          </h3>
          <div className="ia-metric">{Math.round(consistencyScore) || "—"}</div>
          <p className="ia-small">проверка противоречий</p>
        </div>
        <div className="ia-card ia-w-3 ia-mint">
          <h3 className="flex items-center">
            Полнота
            <HelpTip text={getAnalyzerHint("dataCompletenessPct")} />
          </h3>
          <div className="ia-metric">{Math.round(completenessPct) || "—"}%</div>
          <p className="ia-small">заполненность важных полей</p>
        </div>
        <div className="ia-card ia-w-3 ia-rose">
          <h3 className="flex items-center">
            Соответствие стадии
            <HelpTip text={getAnalyzerHint("stageFitScore")} />
          </h3>
          <div className="ia-metric">{Math.round(stageFitScore) || "—"}</div>
          <p className="ia-small">соответствие метрик стадии</p>
        </div>
      </div>

      {viewMode === "founder" ? (
        <div className="ia-grid">
          <div className="ia-card ia-w-12 ia-blue">
            <h2 className="flex items-center">
              Качество данных
              <HelpTip text={getAnalyzerHint("dataConfidenceScore")} />
            </h2>
            <p className="ia-small">
              Уверенность: <b className="text-[rgba(234,240,255,0.9)]">{confidenceLabelRu(report.estimateConfidenceLabel)}</b> · Доверие к данным:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">{Math.round(dataConfidence)}/100</b> · Полнота:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">{Math.round(completenessPct)}%</b> · Согласованность:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">{Math.round(consistencyScore) || "—"}/100</b>
            </p>

            {topConsistencyWarnings.length ? (
              <>
                <p className="ia-small mt-3"><b>Замечания по вводным:</b></p>
                {topConsistencyWarnings.map((w, idx) => (
                  <p key={idx} className="ia-small">• {w}</p>
                ))}
              </>
            ) : (
              <p className="ia-small mt-3">Замечаний по согласованности данных нет.</p>
            )}
          </div>
        </div>
      ) : null}

      {viewMode === "investor" ? (
        <div className="ia-grid">
          <div className="ia-card ia-w-12 ia-blue">
            <h2 className="flex items-center">
              Аудит данных и допущений
              <HelpTip text="Этот блок показывает, насколько вводные данные выглядят согласованными и достаточно полными. При низком качестве данных диапазоны (вероятность/оценка) расширяются, а выводы становятся менее «решительными»." />
            </h2>
            <p className="ia-small">
              Доверие к данным: <b className="text-[rgba(234,240,255,0.9)]">{Math.round(dataConfidence)}/100</b> · Полнота:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">{Math.round(completenessPct)}%</b> · Согласованность:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">{Math.round(consistencyScore) || "—"}/100</b> · Противоречия:{" "}
              <b className="text-[rgba(234,240,255,0.9)]">{contradictionsFound}</b>
            </p>
            <p className="ia-small">
              Эффект на диапазоны: при низком доверии/согласованности модель расширяет диапазон вероятности успеха и осторожнее интерпретирует вердикт (anti-gaming).
            </p>

            {allConsistencyWarnings.length ? (
              <>
                <p className="ia-small mt-3"><b>Предупреждения:</b></p>
                {allConsistencyWarnings.map((w, idx) => (
                  <p key={idx} className="ia-small">• {w}</p>
                ))}
              </>
            ) : (
              <p className="ia-small mt-3">Предупреждений по согласованности нет.</p>
            )}

            {allConsistencyPenalties.length ? (
              <>
                <p className="ia-small mt-3"><b>Штрафы (внутренние маркеры):</b></p>
                <p className="ia-small">{allConsistencyPenalties.join(" · ")}</p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {redFlags ? (
        <div className="ia-grid">
          <div className="ia-card ia-w-12 ia-rose">
            <h2>Флаги и предупреждения</h2>
            {redFlags.red.length ? <p className="ia-small"><b className="text-rose-200">Красные флаги:</b> {redFlags.red.join(" · ")}</p> : null}
            {redFlags.yellow.length ? <p className="ia-small"><b className="text-amber-200">Жёлтые флаги:</b> {redFlags.yellow.join(" · ")}</p> : null}
            {redFlags.info.length ? <p className="ia-small"><b className="text-[rgba(234,240,255,0.85)]">Замечания:</b> {redFlags.info.slice(0, 3).join(" · ")}</p> : null}
          </div>
        </div>
      ) : null}

      {decision ? (
        <div className="ia-grid">
          <div className="ia-card ia-w-8 ia-blue">
            <h2>Почему такой вердикт</h2>
            {decision.because.map((x, idx) => (
              <p key={idx} className="ia-small">• {x}</p>
            ))}
            {decision.blockers.length ? (
              <>
                <p className="ia-small mt-3"><b>Блокеры:</b></p>
                {decision.blockers.map((x, idx) => (
                  <p key={idx} className="ia-small">• {x}</p>
                ))}
              </>
            ) : null}
          </div>
          <div className="ia-card ia-w-4 ia-violet">
            <h2>Что изменит решение</h2>
            {decision.whatChangesDecision.length ? decision.whatChangesDecision.map((x, idx) => (
              <p key={idx} className="ia-small">• {x}</p>
            )) : (
              <p className="ia-small">{memo.finalVerdict.wouldChange}</p>
            )}
          </div>
        </div>
      ) : null}

      {actions.length ? (
        <div className="ia-grid">
          <div className="ia-card ia-w-12 ia-mint">
            <h2>План действий (30/60/90)</h2>
            {actions.map((a, idx) => (
              <p key={idx} className="ia-small">
                <b>Приоритет {idx + 1} ({priorityRu(a.priority)}): {a.title}</b><br />
                {a.reason}<br />
                <span className="text-[rgba(234,240,255,0.75)]">Ожидаемый эффект:</span> {a.expectedImpact}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {drivers.length && viewMode === "investor" ? (
        <div className="ia-grid">
          <div className="ia-card ia-w-12 ia-violet">
            <h2>Что сильнее всего влияет на итог</h2>
            {drivers.map((d, idx) => (
              <p key={idx} className="ia-small">
                <b>{d.label}:</b> {d.direction === "positive" ? "позитивный" : "негативный"} драйвер · влияние: {d.impactLabel}. {d.description}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ia-grid">
        <div className="ia-card ia-w-8 ia-violet">
          <h2>Нарратив бизнеса</h2>
          <p>{memo.businessContext}</p>
          <p>{memo.growthAnalysis}</p>
        </div>
        <div className="ia-card ia-w-4 ia-blue">
          <h3>Ключевые инсайты</h3>
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
          <h2>Динамика роста</h2>
          <p>{memo.growthAnalysis}</p>
        </div>
        <div className="ia-card ia-w-6">
          <h3 className="ia-small mb-2">Дисконтированные потоки по годам (прокси динамики)</h3>
          <GrowthLineChart values={report.yearCashflows.length ? report.yearCashflows : [0, 1, 2, 3, 4, 5]} />
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-4 ia-violet">
          <h2>Юнит-экономика</h2>
          <p>{memo.unitEconomicsNarrative}</p>
        </div>
        <div className="ia-card ia-w-4 ia-mint">
          <h2>Рынок</h2>
          <p>{memo.marketAnalysis}</p>
        </div>
        <div className="ia-card ia-w-4 ia-rose">
          <h2>Риски</h2>
          <p>{memo.riskAnalysis}</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-6 ia-rose">
          <h2 className="flex items-center">
            Карта рисков
            <HelpTip text={getAnalyzerHint("riskHeatmap")} />
          </h2>
          <p className="ia-small">Распределение давления по осям: отток, экономика привлечения, запас денег, рынок, технологии.</p>
          <RiskBarChart labels={["Отток", "Экономика", "Запас", "Рынок", "Тех"]} values={riskBars} />
        </div>
        <div className="ia-card ia-w-6 ia-violet">
          <h2 className="flex items-center">
            Кривая эффективности
            <HelpTip text={getAnalyzerHint("efficiencyCurve")} />
          </h2>
          <p className="ia-small">Баланс роста, юнит-экономики, PMF и операционной эффективности по стадиям модели.</p>
          <EfficiencyLineChart values={effStages} />
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-8 ia-blue">
          <h2>Интерпретация для инвестора</h2>
          <p>{memo.investorReasoning}</p>
        </div>
        <div className="ia-card ia-w-4 ia-rose">
          <h2>Сигнал решения</h2>
          <p>
            <b className={verdictAccent(memo.finalVerdict.signal)}>→ {memo.finalVerdict.signal}</b>
          </p>
          <p className="ia-small">{memo.finalVerdict.explanation}</p>
          <hr className="ia-hr" />
          <p className="ia-small mb-2">Триггеры:</p>
          <p className="ia-small">• {memo.benchmarkLabels.retentionD30} удержание D30</p>
          <p className="ia-small">• {memo.benchmarkLabels.ltvToCac} LTV/CAC</p>
          <p className="ia-small">• {memo.benchmarkLabels.growth} рост (MoM)</p>
        </div>
      </div>

      <div className="ia-card ia-w-12 ia-violet">
        <h2>Итоговый инвестиционный тезис</h2>
        <p>{memo.executiveSummary}</p>
        <p className="ia-small">{memo.finalVerdict.wouldChange}</p>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-12 ia-violet">
          <h2>Почему такой результат</h2>
          <p>{memo.investorReasoning}</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-6 ia-blue">
          <h2 className="flex items-center">
            Сравнение с бенчмарками
            <HelpTip text={getAnalyzerHint("benchmarkBands")} />
          </h2>
          <p>Рост: {memo.benchmarkLabels.growth}</p>
          <p>Удержание D30: {memo.benchmarkLabels.retentionD30}</p>
          <p>LTV/CAC: {memo.benchmarkLabels.ltvToCac}</p>
          <p>Запас денег (runway): {memo.benchmarkLabels.runway}</p>
        </div>
        <div className="ia-card ia-w-6 ia-mint">
          <h2>Интерпретация относительно рынка</h2>
          <p>{memo.productMarketFit}</p>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-12 ia-rose">
          <h2>Приоритеты (что делать дальше)</h2>
          <p className="ia-small mb-4">Ранжирование по влиянию на рост и инвестиционную привлекательность.</p>
          {memo.actionPriorities.map((a, i) => (
            <p key={i} className="mb-3">
              <b>
                Приоритет {i + 1} — {a.improves}
              </b>
              <br />
              <span className="text-[rgba(234,240,255,0.72)]">{a.action}</span>
              <span className="ia-small"> (влияние: {impactRu(a.impact)})</span>
            </p>
          ))}
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-card ia-w-12 ia-violet">
          <h2>Итоговый вердикт системы</h2>
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
            <div className="ia-metric mt-2">{spRange.low}–{spRange.high}%</div>
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
            <div className="ia-metric mt-2">{formatCompactMoneyRu(report.expectedValue)}</div>
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
