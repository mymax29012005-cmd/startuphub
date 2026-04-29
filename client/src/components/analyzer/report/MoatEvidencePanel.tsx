"use client";

import React from "react";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function fmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}/100`;
}

export function MoatEvidencePanel({
  input,
  report,
  viewMode,
}: {
  input: StartupAnalysisInput;
  report: StartupAnalysisResult;
  viewMode: "founder" | "investor";
}) {
  const has = typeof report.moatEvidenceScore === "number" || (report.moatEvidenceNotes ?? []).length > 0;
  if (!has) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.moat.title}
        <HelpTip text={reportCopy.tooltips.moat} />
      </div>
      <div className="ii-panelSubtitle">{viewMode === "investor" ? reportCopy.moat.subtitle : reportCopy.moat.short}</div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Заявленный moat:</b> {Math.round(input.moatStrength || 0)}/100 · <b>Подтверждённость moat:</b> {fmt(report.moatEvidenceScore)}
          {report.moatGapFlag ? <span className="ml-2 text-rose-200">· есть разрыв</span> : null}
        </div>
        {(report.moatEvidenceNotes ?? []).slice(0, viewMode === "investor" ? 7 : 4).map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

