"use client";

import React from "react";
import type { StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function fmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}/100`;
}

export function RevenueQualityPanel({ report, viewMode }: { report: StartupAnalysisResult; viewMode: "founder" | "investor" }) {
  if (typeof report.revenueQualityScore !== "number" && !report.revenueQualityNotes?.length) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.revenue.title}
        <HelpTip text={reportCopy.tooltips.revenue} />
      </div>
      <div className="ii-panelSubtitle">{viewMode === "investor" ? reportCopy.revenue.subtitle : reportCopy.revenue.short}</div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Качество выручки:</b> {fmt(report.revenueQualityScore)} · <b>Риск концентрации выручки:</b> {fmt(report.concentrationRiskScore)}
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

