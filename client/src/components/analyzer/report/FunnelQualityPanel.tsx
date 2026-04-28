"use client";

import React from "react";
import type { StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";

function fmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}/100`;
}

export function FunnelQualityPanel({ report, viewMode }: { report: StartupAnalysisResult; viewMode: "founder" | "investor" }) {
  if (typeof report.funnelQualityScore !== "number" && !report.funnelQualityNotes?.length) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        Воронка (Funnel quality)
        <HelpTip text="Детерминированный слой (0–100) по конверсиям и time‑to‑value. Помогает понять, где начинается проблема retention." />
      </div>
      <div className="ii-panelSubtitle">
        {viewMode === "investor"
          ? "Сильная воронка при слабом D30 — красный флаг качества ценности после активации. Слабая воронка — риск «не доходит до ценности»."
          : "Если retention слабый — часто быстрее всего помогает улучшить активацию и сократить time‑to‑value."}
      </div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        <div className="ii-driverItem">
          <b>Funnel quality:</b> {fmt(report.funnelQualityScore)}
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

