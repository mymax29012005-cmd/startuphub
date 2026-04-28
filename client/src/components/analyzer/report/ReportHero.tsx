"use client";

import React from "react";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { ScoreRing } from "@/components/analyzer/report/ScoreRing";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";

function confidenceLabelRu(label: StartupAnalysisResult["estimateConfidenceLabel"]): string {
  if (label === "high") return "высокая";
  if (label === "medium") return "средняя";
  if (label === "low") return "низкая";
  return "—";
}

function verdictLabelRu(v: string) {
  if (v === "BUY") return "BUY";
  if (v === "HOLD") return "HOLD";
  if (v === "WATCH") return "WATCH";
  return "AVOID";
}

export function ReportHero({
  input,
  report,
  verdict,
  spRange,
  valuationHuman,
  heroSubtitle,
  viewMode,
}: {
  input: StartupAnalysisInput;
  report: StartupAnalysisResult;
  verdict: string;
  spRange: { low: number; high: number };
  valuationHuman?: { low: string; base: string; high: string };
  heroSubtitle: string;
  viewMode: "founder" | "investor";
}) {
  const title = (input.title ?? "").trim() || "Глубокий анализ проекта";
  const summaryFounder =
    report.decisionReasoning?.because?.[0] ??
    "Карта улучшения проекта: что сильное, что тормозит и какие шаги дадут наибольший эффект для инвестиционной привлекательности.";
  const summaryInvestor =
    report.decisionReasoning?.because?.[0] ??
    "Decision-ready review: почему вердикт именно такой, какие риски/ограничители доминируют и насколько можно доверять вводным.";
  const summary = viewMode === "investor" ? summaryInvestor : summaryFounder;

  return (
    <div className="ii-heroCard">
      <div className="ii-heroGlow" />
      <div className="ii-heroGrid">
        <div>
          <div className="ii-heroKicker">
            <span className="ii-dot" />
            Детерминированный инвестиционный анализ
          </div>

          <h1 className="ii-heroTitle">
            <span className="ii-verdict">{verdictLabelRu(verdict)}</span> {title}
          </h1>

          <p className="ii-heroSub">{summary ? summary : "Отчёт построен детерминированно из метрик, правил, бенчмарков и проверок согласованности данных."}</p>

          <div className="ii-heroSummary">
            <div className="ii-stat">
              <div className="ii-statLabel">Вероятность успеха</div>
              <div className="ii-statValue">{spRange.low}–{spRange.high}%</div>
              <div className="ii-statHelp">Диапазон вместо ложной точности</div>
            </div>
            <div className="ii-stat">
              <div className="ii-statLabel">Уверенность в оценке</div>
              <div className="ii-statValue">{confidenceLabelRu(report.estimateConfidenceLabel)}</div>
              <div className="ii-statHelp">
                {viewMode === "investor" ? "Полнота · согласованность · caveats" : "Точность ограничена качеством вводных"}
              </div>
            </div>
            <div className="ii-stat">
              <div className="ii-statLabel">Главный ограничитель</div>
              <div className="ii-statValue">{report.mainBottleneck ?? "—"}</div>
              <div className="ii-statHelp">{viewMode === "investor" ? "Что ограничивает conviction" : "Что сейчас сильнее всего тормозит рост сигнала"}</div>
            </div>
            <div className="ii-stat">
              <div className="ii-statLabel">Сильная сторона</div>
              <div className="ii-statValue">{report.strongestArea ?? "—"}</div>
              <div className="ii-statHelp">{viewMode === "investor" ? "Что поддерживает интерес" : "На что можно опереться сейчас"}</div>
            </div>
          </div>

          {valuationHuman ? (
            <div className="ii-valuationLine">
              <span className="ii-valuationLabel">Диапазон оценки:</span>
              <b className="ii-valuationValue">
                {valuationHuman.low} · {valuationHuman.base} · {valuationHuman.high}
              </b>
              <HelpTip text="Человекочитаемый диапазон оценки (низ/база/верх). Это ориентир, а не точная стоимость компании." />
            </div>
          ) : null}

          <div className="ii-heroAside">{heroSubtitle}</div>
        </div>

        <div className="ii-scoreSide">
          <ScoreRing valuePct={Math.round((report.successProbability || 0) * 100)} label={`DECISION SIGNAL — ${verdictLabelRu(verdict)}`} sublabel="Оценка выглядит честной, а не «магической»." />
          <div className="ii-scoreBadges">
            <div className="ii-miniBadge">
              <div className="ii-miniBadgeLabel">Сила бизнеса</div>
              <div className="ii-miniBadgeValue">{Math.round(report.businessScore ?? report.investorScore ?? 0)}/100</div>
            </div>
            <div className="ii-miniBadge">
              <div className="ii-miniBadgeLabel">Доверие к данным</div>
              <div className="ii-miniBadgeValue">{Math.round(report.dataConfidenceScore ?? report.confidenceScore ?? 0)}/100</div>
            </div>
            <div className="ii-miniBadge">
              <div className="ii-miniBadgeLabel">Согласованность</div>
              <div className="ii-miniBadgeValue">{Math.round(report.consistencyScore ?? 0) || "—"}/100</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

