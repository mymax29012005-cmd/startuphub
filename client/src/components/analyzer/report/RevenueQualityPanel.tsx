"use client";

import React from "react";
import type { StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";

function fmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}/100`;
}

export function RevenueQualityPanel({ report, viewMode }: { report: StartupAnalysisResult; viewMode: "founder" | "investor" }) {
  if (typeof report.revenueQualityScore !== "number" && !report.revenueQualityNotes?.length) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        Качество выручки
        <HelpTip text="Слой про устойчивость выручки: повторяемость, концентрация, пилотность/разовость, (NRR/GRR при наличии). Детеминированно, без ИИ." />
      </div>
      <div className="ii-panelSubtitle">
        {viewMode === "investor"
          ? "Насколько выручка выглядит устойчивой для стадии: повторяемость + концентрация + (NRR/GRR, если доступны)."
          : "Если улучшать одно — улучшайте повторяемость и снижайте концентрацию: это быстрее всего поднимает инвестиционный сигнал."}
      </div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Revenue quality:</b> {fmt(report.revenueQualityScore)} · <b>Concentration risk:</b> {fmt(report.concentrationRiskScore)}
        </div>
        {(report.revenueQualityNotes ?? []).slice(0, viewMode === "investor" ? 6 : 3).map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

