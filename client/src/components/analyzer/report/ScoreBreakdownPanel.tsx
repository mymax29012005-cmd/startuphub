"use client";

import React from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Row({ label, value }: { label: string; value: number }) {
  const v = clamp(value, 0, 100);
  return (
    <div className="ii-scoreRow">
      <div className="ii-scoreLabel">{label}</div>
      <div className="ii-scoreTrack">
        <div className="ii-scoreFill" style={{ width: `${v}%` }} />
      </div>
      <div className="ii-scoreValue">{Math.round(v)}/100</div>
    </div>
  );
}

export function ScoreBreakdownPanel({
  pmf,
  growth,
  unit,
  eff,
  market,
  investor,
}: {
  pmf: number;
  growth: number;
  unit: number;
  eff: number;
  market: number;
  investor: number;
}) {
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Разбор оценки</div>
      <div className="ii-panelSubtitle">Как отдельные блоки оценки поддерживают или ограничивают итоговый сигнал.</div>
      <div className="ii-scoreList">
        <Row label="PMF (ценность/удержание)" value={pmf} />
        <Row label="Рост" value={growth} />
        <Row label="Юнит-экономика" value={unit} />
        <Row label="Эффективность" value={eff} />
        <Row label="Рынок" value={market} />
        <Row label="Инвест-скоринг" value={investor} />
      </div>
    </div>
  );
}

