"use client";

import React from "react";
import type { AutoSwot, SwotItem } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function Quad({ title, items, tone }: { title: string; items: SwotItem[]; tone: "pos" | "neg" }) {
  return (
    <div className="ii-panel" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="ii-panelTitle" style={{ fontSize: 14 }}>
        <span className={`ii-driverDot ii-dot-${tone}`} aria-hidden style={{ display: "inline-block", marginRight: 10, verticalAlign: "middle" }} />
        {title}
      </div>
      <div className="ii-driverList" style={{ marginTop: 12 }}>
        {items.length ? (
          items.slice(0, 4).map((it, idx) => (
            <div key={idx} className="ii-driverItem">
              <b>{it.title}</b>
              {it.evidence?.length ? (
                <div className="ia-small" style={{ marginTop: 6 }}>
                  Доказательства: {it.evidence.join(" · ")}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="ii-driverItem">—</div>
        )}
      </div>
    </div>
  );
}

export function SwotPanel({ swot, viewMode }: { swot?: AutoSwot; viewMode: "founder" | "investor" }) {
  if (!swot) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        {reportCopy.swot.title}
        <HelpTip text={reportCopy.tooltips.swot} />
      </div>
      <div className="ii-panelSubtitle">{reportCopy.swot.subtitle}</div>

      <div className="ii-driversGrid" style={{ marginTop: 14 }}>
        <Quad title={reportCopy.swot.quad.strengths} items={swot.strengths} tone="pos" />
        <Quad title={reportCopy.swot.quad.weaknesses} items={swot.weaknesses} tone="neg" />
        <Quad title={reportCopy.swot.quad.opportunities} items={swot.opportunities} tone="pos" />
        <Quad title={reportCopy.swot.quad.threats} items={swot.threats} tone="neg" />
      </div>
    </div>
  );
}

