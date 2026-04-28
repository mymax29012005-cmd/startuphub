"use client";

import React from "react";
import type { DecisionReasoning, StartupAnalysisResult } from "@/lib/analyzer/types";

function LayerBadges({ report }: { report: StartupAnalysisResult }) {
  const tags: string[] = [];
  if ((report.revenueQualityScore ?? 0) > 0) tags.push("выручка");
  if ((report.moatEvidenceScore ?? 0) > 0) tags.push("moat evidence");
  if ((report.stageEvidenceScore ?? 0) > 0) tags.push("evidence");
  if ((report.funnelQualityScore ?? 0) > 0) tags.push("воронка");
  if ((report.marketStructurePressureScore ?? 0) > 0) tags.push("структура рынка");
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

export function StrengthsPanel({
  report,
  decision,
}: {
  report: StartupAnalysisResult;
  decision?: DecisionReasoning;
}) {
  const positives = (decision?.topPositiveDrivers ?? []).slice(0, 5);
  const because = (decision?.because ?? []).slice(0, 3);

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Что уже хорошо (опора для следующей стадии)</div>
      <div className="ii-panelSubtitle">Коротко: сильные сигналы, на которые можно опереться, чтобы ускорить путь к следующей вехе.</div>
      <LayerBadges report={report} />

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Сильная сторона:</b> {report.strongestArea ?? "—"}
        </div>
        {positives.map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
        {because.map((x, idx) => (
          <div key={`b-${idx}`} className="ii-driverItem">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

