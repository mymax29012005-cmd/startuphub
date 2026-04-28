"use client";

import React, { useMemo } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ScoreRing({
  valuePct,
  label,
  sublabel,
}: {
  valuePct: number; // 0..100
  label: string;
  sublabel?: string;
}) {
  const v = clamp(Number(valuePct) || 0, 0, 100);
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  const dashArray = useMemo(() => `${dash} ${c - dash}`, [dash, c]);

  return (
    <div className="ii-scorePanel">
      <div className="ii-scoreHeader">{label}</div>
      <div className="ii-ringWrap" aria-label={label}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ii-ringSvg" aria-hidden>
          <defs>
            <linearGradient id="iiRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,79,216,0.95)" />
              <stop offset="55%" stopColor="rgba(124,58,237,0.95)" />
              <stop offset="100%" stopColor="rgba(86,199,255,0.95)" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#iiRingGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={dashArray}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="ii-ringProgress"
          />
        </svg>

        <div className="ii-ringCenter">
          <div className="ii-ringValue">{Math.round(v)}%</div>
          <div className="ii-ringCaption">success score</div>
        </div>
      </div>

      {sublabel ? <div className="ii-scoreNote">{sublabel}</div> : null}
    </div>
  );
}

