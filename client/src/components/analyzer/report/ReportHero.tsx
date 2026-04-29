"use client";

import React from "react";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { ScoreRing } from "@/components/analyzer/report/ScoreRing";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import { reportCopy } from "@/lib/analyzer/reportCopy";

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
  const title = (input.title ?? "").trim() || reportCopy.hero.title;
  const summaryFounder =
    report.decisionReasoning?.because?.[0] ??
    "Что уже хорошо, что ограничивает результат и на чём лучше сфокусироваться в первую очередь.";
  const summaryInvestor =
    report.decisionReasoning?.because?.[0] ??
    "Почему вердикт именно такой, какие ограничения доминируют и насколько надёжны входные данные.";
  const summary = viewMode === "investor" ? summaryInvestor : summaryFounder;

  return (
    <div className="ii-heroCard">
      <div className="ii-heroGlow" />
      <div className="ii-heroGrid">
        <div>
          <div className="ii-heroKicker">
            <span className="ii-dot" />
            {reportCopy.hero.badge}
          </div>

          <h1 className="ii-heroTitle">
            <span className="ii-verdict">{verdictLabelRu(verdict)}</span> {title}
          </h1>

          <p className="ii-heroSub">{summary ? summary : "Отчёт построен детерминированно из метрик, правил, бенчмарков и проверок согласованности данных."}</p>

          <div className="ii-heroSummary">
            <div className="ii-stat">
              <div className="ii-statLabel">{reportCopy.hero.labels.success}</div>
              <div className="ii-statValue">{spRange.low}–{spRange.high}%</div>
              <div className="ii-statHelp">{reportCopy.hero.sub.range}</div>
            </div>
            <div className="ii-stat">
              <div className="ii-statLabel">{reportCopy.hero.labels.reliability}</div>
              <div className="ii-statValue">{confidenceLabelRu(report.estimateConfidenceLabel)}</div>
              <div className="ii-statHelp">{reportCopy.hero.sub.reliability}</div>
            </div>
            <div className="ii-stat">
              <div className="ii-statLabel">{reportCopy.hero.labels.bottleneck}</div>
              <div className="ii-statValue">{report.mainBottleneck ?? "—"}</div>
              <div className="ii-statHelp">{reportCopy.hero.sub.bottleneck}</div>
            </div>
            <div className="ii-stat">
              <div className="ii-statLabel">{reportCopy.hero.labels.strongest}</div>
              <div className="ii-statValue">{report.strongestArea ?? "—"}</div>
              <div className="ii-statHelp">{reportCopy.hero.sub.strongest}</div>
            </div>
          </div>

          {valuationHuman ? (
            <div className="ii-valuationLine">
              <span className="ii-valuationLabel">Диапазон оценки:</span>
              <b className="ii-valuationValue">
                {valuationHuman.low} · {valuationHuman.base} · {valuationHuman.high}
              </b>
              <HelpTip text="Диапазон оценки в формате низ/база/верх. Используйте как ориентир для обсуждения сделки, а не как финальную стоимость компании." />
            </div>
          ) : null}

          <div className="ii-heroAside">{heroSubtitle}</div>
        </div>

        <div className="ii-scoreSide">
          <ScoreRing valuePct={Math.round((report.successProbability || 0) * 100)} label={`${reportCopy.hero.labels.signal} — ${verdictLabelRu(verdict)}`} sublabel="Оценка выглядит честной, а не «магической»." />
          <div className="ii-scoreBadges">
            <div className="ii-miniBadge">
              <div className="ii-miniBadgeLabel">{reportCopy.hero.labels.business}</div>
              <div className="ii-miniBadgeValue">{Math.round(report.businessScore ?? report.investorScore ?? 0)}/100</div>
            </div>
            <div className="ii-miniBadge">
              <div className="ii-miniBadgeLabel">{reportCopy.hero.labels.data}</div>
              <div className="ii-miniBadgeValue">{Math.round(report.dataConfidenceScore ?? report.confidenceScore ?? 0)}/100</div>
            </div>
            <div className="ii-miniBadge">
              <div className="ii-miniBadgeLabel">{reportCopy.hero.labels.consistency}</div>
              <div className="ii-miniBadgeValue">{Math.round(report.consistencyScore ?? 0) || "—"}/100</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

