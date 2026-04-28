"use client";

import React from "react";
import { HelpTip } from "@/components/analyzer/HelpTip";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type PressureItem = {
  label: string;
  value: number; // 0..100 (higher = worse)
};

export function RiskPressurePanel({ items }: { items: PressureItem[] }) {
  const list = items.slice(0, 6).map((x) => ({ ...x, value: clamp(x.value, 0, 100) }));
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Профиль риска</div>
      <div className="ii-panelSubtitle">
        Визуальная “тележка давления” по осям риска. Чем длиннее и ярче полоса, тем сильнее давление на итог.
        <HelpTip text="Это не точная наука: цель — быстро увидеть доминирующие оси риска и приоритеты для плана." />
      </div>

      <div className="ii-pressureList">
        {list.map((x) => (
          <div key={x.label} className="ii-pressureRow">
            <div className="ii-pressureLabel">{x.label}</div>
            <div className="ii-pressureTrack">
              <div className="ii-pressureFill" style={{ width: `${x.value}%` }} />
            </div>
            <div className="ii-pressureValue">{Math.round(x.value)}/100</div>
          </div>
        ))}
      </div>
    </div>
  );
}

