"use client";

import React from "react";
import type { StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";

function fmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}/100`;
}

export function MarketStructurePanel({ report, viewMode }: { report: StartupAnalysisResult; viewMode: "founder" | "investor" }) {
  if (typeof report.marketStructurePressureScore !== "number" && !report.marketStructureNotes?.length) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        Структура рынка (Porter‑lite)
        <HelpTip text="Упрощённый слой давления структуры рынка: rivalry, buyer power, substitutes, entrants. Это помогает объяснять market/risk, а не заменяет метрики." />
      </div>
      <div className="ii-panelSubtitle">
        {viewMode === "investor"
          ? "Смотрим downside: давление структуры рынка повышает требования к moat, retention и каналу."
          : "Если давление высокое — сфокусируйтесь на дифференциации, удержании и доказательствах преимущества."}
      </div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Market structure pressure:</b> {fmt(report.marketStructurePressureScore)} (выше = хуже)
        </div>
        {(report.marketStructureNotes ?? []).slice(0, viewMode === "investor" ? 6 : 3).map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

