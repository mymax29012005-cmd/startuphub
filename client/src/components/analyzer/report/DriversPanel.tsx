"use client";

import React from "react";
import type { DecisionReasoning } from "@/lib/analyzer/types";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function List({ title, items, tone }: { title: string; items: string[]; tone: "pos" | "neg" }) {
  if (!items.length) return null;
  return (
    <div className="ii-driverBlock">
      <div className="ii-driverHeader">
        <span className={`ii-driverDot ii-dot-${tone}`} aria-hidden />
        {title}
      </div>
      <div className="ii-driverList">
        {items.slice(0, 6).map((x, idx) => (
          <div key={idx} className="ii-driverItem">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DriversPanel({ decision }: { decision?: DecisionReasoning }) {
  if (!decision) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Почему именно такой вердикт</div>
      <div className="ii-panelSubtitle">{reportCopy.whyVerdict.subtitle}</div>

      <div className="ii-driversGrid">
        <div className="ii-driverCol">
          <List title={reportCopy.whyVerdict.sections.support} items={decision.topPositiveDrivers ?? []} tone="pos" />
          <List title={reportCopy.whyVerdict.sections.because} items={decision.because ?? []} tone="pos" />
        </div>
        <div className="ii-driverCol">
          <List title={reportCopy.whyVerdict.sections.limits} items={decision.topNegativeDrivers ?? []} tone="neg" />
          <List title="Блокеры" items={decision.blockers ?? []} tone="neg" />
        </div>
      </div>

      {decision.whatChangesDecision?.length ? (
        <div className="ii-driverFooter">
          <div className="ii-driverHeader">
            <span className="ii-driverDot ii-dot-pos" aria-hidden />
            {reportCopy.whyVerdict.sections.changes}
          </div>
          <div className="ii-driverList">
            {decision.whatChangesDecision.slice(0, 6).map((x, idx) => (
              <div key={idx} className="ii-driverItem">
                {x}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

