"use client";

import React from "react";
import type { AutoSwot, SwotItem } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";

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
        SWOT (авто, rule‑based)
        <HelpTip text="SWOT строится автоматически по метрикам/скорингам и служит структурным summary. Это не ручной текст и не «магический интеллект»." />
      </div>
      <div className="ii-panelSubtitle">
        {viewMode === "investor"
          ? "Короткий структурный снимок: strengths/weaknesses как internal факты, opportunities/threats как внешний контекст."
          : "Стратегический снимок: что усиливать, где уязвимость и где апсайд."}
      </div>

      <div className="ii-driversGrid" style={{ marginTop: 14 }}>
        <Quad title="Strengths" items={swot.strengths} tone="pos" />
        <Quad title="Weaknesses" items={swot.weaknesses} tone="neg" />
        <Quad title="Opportunities" items={swot.opportunities} tone="pos" />
        <Quad title="Threats" items={swot.threats} tone="neg" />
      </div>
    </div>
  );
}

