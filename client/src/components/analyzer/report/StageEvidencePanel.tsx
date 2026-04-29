"use client";

import React from "react";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function isEarlyStage(input: StartupAnalysisInput) {
  return input.stage === "idea" || input.stage === "seed" || input.mode === "idea";
}

export function StageEvidencePanel({
  input,
  report,
}: {
  input: StartupAnalysisInput;
  report: StartupAnalysisResult;
}) {
  if (!isEarlyStage(input)) return null;
  const hasAny =
    (input.customerInterviewsCount ?? 0) > 0 ||
    (input.pilotCount ?? 0) > 0 ||
    (input.paidPilotCount ?? 0) > 0 ||
    (input.loiCount ?? 0) > 0 ||
    (input.waitlistSize ?? 0) > 0 ||
    (input.designPartnerCount ?? 0) > 0;

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.stageEvidence.title}
        <HelpTip text={reportCopy.tooltips.stageEvidence} />
      </div>
      <div className="ii-panelSubtitle">{reportCopy.stageEvidence.subtitle}</div>
      {!hasAny ? (
        <div className="ii-driverList" style={{ marginTop: 14 }}>
          <div className="ii-driverItem">{reportCopy.stageEvidence.empty}</div>
        </div>
      ) : (
        <div className="ii-driverList" style={{ marginTop: 14 }}>
          <div className="ii-driverItem">Интервью с клиентами: {input.customerInterviewsCount ?? 0}</div>
          <div className="ii-driverItem">Пилоты: {input.pilotCount ?? 0}</div>
          <div className="ii-driverItem">Платные пилоты: {input.paidPilotCount ?? 0}</div>
          <div className="ii-driverItem">LOI: {input.loiCount ?? 0}</div>
          <div className="ii-driverItem">Список ожидания: {input.waitlistSize ?? 0}</div>
          <div className="ii-driverItem">Дизайн-партнёры: {input.designPartnerCount ?? 0}</div>
          {typeof report.stageEvidenceScore === "number" ? (
            <div className="ii-driverItem">
              <b>Оценка подтверждённости:</b> {Math.round(report.stageEvidenceScore)}/100
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

