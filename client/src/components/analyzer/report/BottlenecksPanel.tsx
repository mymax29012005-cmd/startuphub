"use client";

import React from "react";
import type { DecisionReasoning, StartupAnalysisResult } from "@/lib/analyzer/types";

function LayerBadges({ report }: { report: StartupAnalysisResult }) {
  const tags: string[] = [];
  if ((report.concentrationRiskScore ?? 0) >= 60) tags.push("концентрация");
  if (report.moatGapFlag) tags.push("moat gap");
  if ((report.funnelQualityScore ?? 0) > 0) tags.push("воронка");
  if ((report.marketStructurePressureScore ?? 0) >= 70) tags.push("структура рынка");
  if ((report.dataConfidenceScore ?? 0) > 0) tags.push("data confidence");
  if (!tags.length) return null;
  return (
    <div className="ii-layerBadges">
      {tags.slice(0, 5).map((t) => (
        <span key={t} className="ii-layerBadge">
          {t}
        </span>
      ))}
    </div>
  );
}

export function BottlenecksPanel({
  report,
  decision,
}: {
  report: StartupAnalysisResult;
  decision?: DecisionReasoning;
}) {
  const negatives = (decision?.topNegativeDrivers ?? []).slice(0, 5);
  const blockers = (decision?.blockers ?? []).slice(0, 5);

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Главные ограничения (что тормозит сигнал)</div>
      <div className="ii-panelSubtitle">Понятным языком: что именно ограничивает инвестиционную привлекательность и почему.</div>
      <LayerBadges report={report} />

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Главный ограничитель:</b> {report.mainBottleneck ?? "—"}
        </div>
        {negatives.map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
        {blockers.length ? (
          <div className="ii-driverItem" style={{ borderColor: "rgba(255,79,216,0.25)" }}>
            <b>Блокеры:</b> {blockers.join(" · ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

