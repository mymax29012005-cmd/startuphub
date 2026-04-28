"use client";

import React from "react";
import { HelpTip } from "@/components/analyzer/HelpTip";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function MetricCard({
  title,
  value,
  hint,
  barPct,
  barTone = "cyan",
  tooltip,
}: {
  title: string;
  value: string;
  hint?: string;
  barPct?: number; // 0..100
  barTone?: "cyan" | "violet" | "rose" | "mint";
  tooltip?: string;
}) {
  const pct = barPct == null ? null : clamp(barPct, 0, 100);
  return (
    <div className="ii-metricCard">
      <div className="ii-metricTop">
        <div className="ii-metricTitle">
          {title}
          {tooltip ? <HelpTip text={tooltip} /> : null}
        </div>
      </div>

      <div className="ii-metricValue">{value}</div>
      {hint ? <div className="ii-metricHint">{hint}</div> : null}

      {pct != null ? (
        <div className="ii-bar">
          <div className={`ii-barFill ii-bar-${barTone}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

