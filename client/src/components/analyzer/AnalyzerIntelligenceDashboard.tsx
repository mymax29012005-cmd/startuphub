"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { ReportHero } from "@/components/analyzer/report/ReportHero";
import { MetricCard } from "@/components/analyzer/report/MetricCard";
import { ReportTopBar } from "@/components/analyzer/report/ReportTopBar";
import { RedFlagsPanel } from "@/components/analyzer/report/RedFlagsPanel";
import { ActionPrioritySystem } from "@/components/analyzer/report/ActionPrioritySystem";
import { DriversPanel } from "@/components/analyzer/report/DriversPanel";
import { RiskPressurePanel, type PressureItem } from "@/components/analyzer/report/RiskPressurePanel";
import { DataConfidencePanel } from "@/components/analyzer/report/DataConfidencePanel";
import { ScoreBreakdownPanel } from "@/components/analyzer/report/ScoreBreakdownPanel";
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

  const contradictionsFound = report.consistencyChecks?.contradictionsFound ?? 0;
  const allConsistencyWarnings = report.consistencyChecks?.warnings ?? [];
  const allConsistencyPenalties = report.consistencyChecks?.penalties ?? [];

  const dataAuditPressure = clamp(
    contradictionsFound * 18 + allConsistencyWarnings.length * 6 + allConsistencyPenalties.length * 8 + (report.redFlags?.red?.length ?? 0) * 16,
    0,
    100,
  );

  const pressureItems: PressureItem[] = [
    { label: "Давление по удержанию", value: clamp(100 - clamp(report.pmfScore ?? 0, 0, 100), 0, 100) },
    { label: "Давление по запасу денег", value: clamp(runwayM < 6 ? 82 : runwayM < 9 ? 62 : runwayM < 12 ? 48 : 30, 0, 100) },
    { label: "Риск юнит-экономики", value: clamp(100 - clamp(report.unitEconomicsScore ?? 0, 0, 100), 0, 100) },
    { label: "Давление конкуренции", value: clamp(report.competitionRisk ?? 0, 0, 100) },
    { label: "Давление качества данных", value: dataAuditPressure },
  ];

  const valuationHuman = report.valuationRangeHuman;
  const fullDoc = narrative.fullDocument || memo.executiveSummary || "";
  const [showFullDoc, setShowFullDoc] = useState(false);

  const heroSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (report.strongestArea) parts.push(`Сильная сторона: ${report.strongestArea}`);
    if (report.mainBottleneck) parts.push(`Ограничитель: ${report.mainBottleneck}`);
    return parts.join(" · ") || "—";
  }, [report.strongestArea, report.mainBottleneck]);

  return (
    <div className="ia-container space-y-4">
      <ReportTopBar
        input={analysisInput}
        report={report}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBackToParams={onBackToParams}
        onSave={onSave}
        onEnsureSavedAndGo={onEnsureSavedAndGo}
        me={me}
        saving={saving}
        saved={saved}
      />
      <ReportHero input={analysisInput} report={report} verdict={String(verdict)} spRange={spRange} valuationHuman={valuationHuman} heroSubtitle={heroSubtitle} />

      {/* KPI grid — premium metric cards like redesign.html screenshots */}
      <div className="ia-grid">
        <div className="ia-w-12 ia-card">
          <div className="text-white font-semibold mb-2">Ключевые метрики, которые хочется читать глазами</div>
          <div className="ia-small mb-4">Большие значения + короткие комментарии + мини‑индикаторы. Никаких «табличек ради таблиц».</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Рост месяц к месяцу" value={`${growthPct.toFixed(1)}%`} hint="Темп роста выручки/базы по вводным" barPct={clamp(growthPct * 4, 0, 100)} barTone="cyan" tooltip={getAnalyzerHint("growthScore")} />
            <MetricCard title="LTV / CAC" value={ltvCac > 0 ? ltvCac.toFixed(2) : "—"} hint="Экономика привлечения" barPct={clamp((ltvCac / 4) * 100, 0, 100)} barTone="violet" tooltip={getAnalyzerHint("ltvToCac")} />
            <MetricCard title="Удержание D30" value={retD30 > 0 ? `${retD30}%` : "—"} hint="Главный сигнал устойчивости ценности" barPct={clamp(retD30 * 3.2, 0, 100)} barTone="mint" tooltip={getAnalyzerHint("retentionD30")} />
            <MetricCard title="Запас денег (runway)" value={runwayLabel} hint="Сколько месяцев до кассы" barPct={clamp(runwayM * 6.5, 0, 100)} barTone="rose" tooltip={getAnalyzerHint("runwayMonths")} />

            <MetricCard title="Валовая маржа" value={`${Math.round((report.grossMargin || 0) * 100)}%`} hint="Сколько остаётся после себестоимости" barPct={clamp((report.grossMargin || 0) * 120, 0, 100)} barTone="cyan" tooltip={getAnalyzerHint("grossMarginPct")} />
            <MetricCard title="Окупаемость CAC" value={report.paybackMonths > 0 ? `${report.paybackMonths.toFixed(0)} мес` : "—"} hint="Окупаемость привлечения" barPct={clamp(report.paybackMonths > 0 ? 100 - report.paybackMonths * 6 : 0, 0, 100)} barTone="violet" tooltip={getAnalyzerHint("paybackMonths")} />
            <MetricCard title="Доля повторной выручки" value={`${Math.round((analysisInput.recurringShare || 0) * 100)}%`} hint="Повторяемость выручки" barPct={clamp((analysisInput.recurringShare || 0) * 100, 0, 100)} barTone="mint" tooltip={getAnalyzerHint("recurringShare")} />
            <MetricCard title="Burn‑мультипликатор" value={(report.burnMultiple || 0).toFixed(1)} hint="Эффективность роста (ниже — лучше)" barPct={clamp(report.burnMultiple > 0 ? 100 - report.burnMultiple * 18 : 0, 0, 100)} barTone="rose" tooltip={getAnalyzerHint("burnMultiple")} />
          </div>
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-w-8">
          <ActionPrioritySystem actions={report.actionPriorities} />
        </div>
        <div className="ia-w-4">
          <RedFlagsPanel flags={report.redFlags} />
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-w-8">
          <DriversPanel decision={report.decisionReasoning} />
        </div>
        <div className="ia-w-4">
          <RiskPressurePanel items={pressureItems} />
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-w-4">
          <DataConfidencePanel
            confidence={dataConfidence}
            completeness={completenessPct}
            consistency={consistencyScore}
            stageFit={stageFitScore}
            label={report.estimateConfidenceLabel}
            contradictionsFound={contradictionsFound}
            warnings={allConsistencyWarnings}
            penalties={allConsistencyPenalties}
            viewMode={viewMode}
          />
        </div>
        <div className="ia-w-8">
          {viewMode === "investor" ? (
            <ScoreBreakdownPanel
              pmf={report.pmfScore}
              growth={report.growthScore}
              unit={report.unitEconomicsScore}
              eff={report.efficiencyScore}
              market={report.marketScore}
              investor={report.investorScore}
            />
          ) : (
            <div className="ii-panel">
              <div className="ii-panelTitle">Почему этот отчёт хочется читать</div>
              <div className="ii-panelSubtitle">
                Это не «плохой/хороший стартап», а карта сильных сторон, ограничителей и действий на 30/60/90 дней — с отделением качества бизнеса от качества оценки.
              </div>
              <div className="ii-driverList" style={{ marginTop: 14 }}>
                {memo.executiveSummary.split(". ").slice(0, 4).map((s, idx) => (
                  <div key={idx} className="ii-driverItem">{s.trim()}{s.trim().endsWith(".") ? "" : "."}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ia-grid">
        <div className="ia-w-12">
          <div className="ii-panel">
            <div className="ii-panelTitle">Полный документ (детерминированный)</div>
            <div className="ii-panelSubtitle">
              Если нужно скопировать в Notion/Doc или приложить к сделке — здесь полный текстовый отчёт без «воды», но в одном блоке.
              <HelpTip text="Этот текст генерируется детерминированно из вводных и правил. Никакого ИИ/LLM." />
            </div>
            <div className="flex flex-wrap items-center gap-2" style={{ marginTop: 12 }}>
              <Button type="button" variant="secondary" className="h-10" onClick={() => setShowFullDoc((v) => !v)}>
                {showFullDoc ? "Скрыть текст" : "Показать текст"}
              </Button>
              <div className="ia-small">
                Версия: <b className="text-[rgba(234,240,255,0.9)]">{report.analysisVersion ?? "v1"}</b> · Формат: <b className="text-[rgba(234,240,255,0.9)]">plain</b>
              </div>
            </div>
            {showFullDoc ? (
              <pre className="ii-pre" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
                {fullDoc}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
