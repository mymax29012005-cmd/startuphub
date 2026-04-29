"use client";

import React from "react";
import type { StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function fmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}/100`;
}

export function FunnelQualityPanel({ report, viewMode }: { report: StartupAnalysisResult; viewMode: "founder" | "investor" }) {
  if (typeof report.funnelQualityScore !== "number" && !report.funnelQualityNotes?.length) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.funnel.title}
        <HelpTip text={reportCopy.tooltips.funnel} />
      </div>
      <div className="ii-panelSubtitle">{reportCopy.funnel.subtitle}</div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Качество воронки:</b> {fmt(report.funnelQualityScore)}
        </div>
        {(report.funnelQualityNotes ?? []).slice(0, viewMode === "investor" ? 6 : 3).map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

