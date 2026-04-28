"use client";

import React from "react";
import type { StartupAnalysisResult } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function band(v: number, low: number, high: number) {
  if (!Number.isFinite(v) || v <= 0) return "—";
  if (v >= high) return "уверенно";
  if (v >= low) return "приемлемо";
  return "ниже нормы";
}

export function VerdictShiftPanel({ report }: { report: StartupAnalysisResult }) {
  const r = report;

  const d30 = (r as any)?.inputRetentionD30Pct ?? undefined; // fallback not available; use pmfScore heuristics
  const d30Label = band(Number((r as any)?.retentionD30Pct ?? 0), 18, 22);

  const runway = Number(r.runwayMonths || 0);
  const runwayLabel = runway > 0 ? (runway >= 12 ? "уверенно" : runway >= 9 ? "приемлемо" : "ниже нормы") : "—";

  const ltvCac = Number(r.ltvToCac || 0);
  const ltvLabel = ltvCac > 0 ? (ltvCac >= 3 ? "уверенно" : ltvCac >= 2 ? "приемлемо" : "ниже нормы") : "—";

  const revQ = Number(r.revenueQualityScore || 0);
  const revLabel = revQ > 0 ? (revQ >= 65 ? "уверенно" : revQ >= 50 ? "приемлемо" : "ниже нормы") : "—";

  const moatE = Number(r.moatEvidenceScore || 0);
  const moatLabel = moatE > 0 ? (moatE >= 60 ? "уверенно" : moatE >= 45 ? "приемлемо" : "ниже нормы") : "—";

  const funnel = Number(r.funnelQualityScore || 0);
  const funnelLabel = funnel > 0 ? (funnel >= 65 ? "уверенно" : funnel >= 50 ? "приемлемо" : "ниже нормы") : "—";

  const conf = Number(r.dataConfidenceScore ?? r.confidenceScore ?? 0);
  const confLabel = conf > 0 ? (conf >= 70 ? "уверенно" : conf >= 55 ? "приемлемо" : "ниже нормы") : "—";

  const items = [
    { k: "Удержание/PMF", v: clamp(r.pmfScore ?? 0, 0, 100), label: d30Label, hint: "Ключевой сигнал устойчивости ценности (через retention/повторяемость)." },
    { k: "Runway", v: clamp((runway / 15) * 100, 0, 100), label: runwayLabel, hint: "Время до кассы: влияет на downside и способность исправлять метрики." },
    { k: "LTV/CAC", v: clamp((ltvCac / 3.5) * 100, 0, 100), label: ltvLabel, hint: "Экономика масштаба: без запаса рост часто становится дорогим." },
    { k: "Качество выручки", v: revQ ? clamp(revQ, 0, 100) : 0, label: revLabel, hint: "Повторяемость + концентрация + (NRR/GRR при наличии)." },
    { k: "Moat evidence", v: moatE ? clamp(moatE, 0, 100) : 0, label: moatLabel, hint: "Подтверждённость защитимости по структурным признакам." },
    { k: "Funnel quality", v: funnel ? clamp(funnel, 0, 100) : 0, label: funnelLabel, hint: "Конверсии и time‑to‑value: где начинается проблема retention." },
    { k: "Data confidence", v: conf ? clamp(conf, 0, 100) : 0, label: confLabel, hint: "Полнота/согласованность/объективность вводных." },
  ];

  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        Лестница смены вердикта
        <HelpTip text="Это не пересчёт. Это детерминированные условия, которые чаще всего двигают решение WATCH→HOLD→BUY (или обратно) на основе текущих слоёв." />
      </div>
      <div className="ii-panelSubtitle">
        Смысл: какие оси должны стать «приемлемо/уверенно», чтобы сигнал стал сильнее. Используйте как decision‑shift checklist.
      </div>

      <div className="ii-scoreList" style={{ marginTop: 14 }}>
        {items.map((x) => (
          <div key={x.k} className="ii-scoreRow">
            <div className="ii-scoreLabel">
              {x.k} <span className="ia-small">· {x.label}</span>
            </div>
            <div className="ii-scoreTrack">
              <div className="ii-scoreFill" style={{ width: `${clamp(x.v, 0, 100)}%` }} />
            </div>
            <div className="ii-scoreValue">{Math.round(clamp(x.v, 0, 100))}/100</div>
          </div>
        ))}
      </div>
    </div>
  );
}

