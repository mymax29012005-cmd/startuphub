"use client";

import React from "react";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { buildMissingConfidenceItems, reportCopy } from "@/lib/analyzer/reportCopy";

export function MissingConfidencePanel({ input, report }: { input: StartupAnalysisInput; report: StartupAnalysisResult }) {
  const items = buildMissingConfidenceItems(input, report);
  if (!items.length) return null;

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.missing.title}
        <HelpTip text={reportCopy.tooltips.reliability} />
      </div>
      <div className="ii-panelSubtitle">{reportCopy.missing.subtitle}</div>
      <div className="ii-driverList" style={{ marginTop: 14 }}>
        {items.map((it, idx) => (
          <div key={idx} className="ii-driverItem">
            <b>{it.what}</b>
            <div className="ia-small" style={{ marginTop: 6 }}>
              Почему это важно: {it.why}
            </div>
            <div className="ia-small" style={{ marginTop: 4 }}>
              Что даст: {it.effect}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

