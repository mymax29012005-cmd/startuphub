"use client";

import React from "react";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { buildThesisWeakeningItems, reportCopy } from "@/lib/analyzer/reportCopy";

export function ThesisWeakeningPanel({
  input,
  report,
}: {
  input: StartupAnalysisInput;
  report: StartupAnalysisResult;
}) {
  const items = buildThesisWeakeningItems(input, report);
  if (!items.length) return null;

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.weakening.title}
        <HelpTip text={reportCopy.tooltips.ladder} />
      </div>
      <div className="ii-panelSubtitle">{reportCopy.weakening.subtitle}</div>
      <div className="ii-driverList" style={{ marginTop: 14 }}>
        {items.map((line, idx) => (
          <div key={idx} className="ii-driverItem">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

