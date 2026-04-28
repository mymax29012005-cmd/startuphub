"use client";

import React, { useMemo, useState } from "react";
import { HelpTip } from "@/components/analyzer/HelpTip";
import type { EstimateConfidenceLabel } from "@/lib/analyzer/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function labelRu(x?: EstimateConfidenceLabel) {
  if (x === "high") return "высокая";
  if (x === "medium") return "средняя";
  if (x === "low") return "низкая";
  return "—";
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = clamp(value, 0, 100);
  return (
    <div className="ii-qRow">
      <div className="ii-qLabel">{label}</div>
      <div className="ii-qTrack">
        <div className="ii-qFill" style={{ width: `${v}%` }} />
      </div>
      <div className="ii-qValue">{Math.round(v)}%</div>
    </div>
  );
}

export function DataConfidencePanel({
  confidence,
  completeness,
  consistency,
  stageFit,
  label,
  warnings,
  penalties,
  contradictionsFound,
  viewMode,
}: {
  confidence: number;
  completeness: number;
  consistency: number;
  stageFit: number;
  label?: EstimateConfidenceLabel;
  warnings?: string[];
  penalties?: string[];
  contradictionsFound?: number;
  viewMode?: "founder" | "investor";
}) {
  const warn = warnings ?? [];
  const pen = penalties ?? [];
  const contradictions = contradictionsFound ?? 0;
  const topWarnings = useMemo(() => (viewMode === "founder" ? warn.slice(0, 3) : warn), [warn, viewMode]);
  const [showAudit, setShowAudit] = useState(false);
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">Доверие к данным</div>
      <div className="ii-panelSubtitle">
        Верхнеуровневый слой доверия к анализу. Он отделяет “качество бизнеса” от “качества оценки”.
        <HelpTip text="Если данные неполные или противоречивые, диапазоны (вероятность/оценка) расширяются, а выводы становятся осторожнее." />
      </div>

      <div className="ii-qSummary">
        <div className="ii-qBig">{labelRu(label)}</div>
        <div className="ii-qSmall">Уверенность в оценке</div>
      </div>

      <div className="ii-qList">
        <Bar label="Полнота данных" value={completeness} />
        <Bar label="Согласованность данных" value={consistency} />
        <Bar label="Соответствие стадии" value={stageFit} />
        <Bar label="Сводный confidence" value={confidence} />
      </div>

      {(topWarnings.length || (viewMode === "investor" && (contradictions > 0 || pen.length))) ? (
        <div className="ii-qAudit">
          <div className="ii-qAuditTop">
            <button type="button" className="ii-qAuditBtn" onClick={() => setShowAudit((v) => !v)}>
              {showAudit ? "Скрыть аудит" : "Показать аудит"}
            </button>
            {viewMode === "investor" ? (
              <div className="ii-qAuditMeta">
                Противоречия: <b>{contradictions}</b> · Предупреждения: <b>{warn.length}</b>
              </div>
            ) : null}
          </div>

          {showAudit ? (
            <div className="ii-qAuditBody">
              {topWarnings.length ? (
                <>
                  <div className="ii-qAuditTitle">Предупреждения</div>
                  <div className="ii-qAuditList">
                    {topWarnings.map((w, idx) => (
                      <div key={idx} className="ii-qAuditItem">
                        {w}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="ii-qAuditEmpty">Предупреждений по согласованности нет.</div>
              )}

              {viewMode === "investor" && pen.length ? (
                <>
                  <div className="ii-qAuditTitle" style={{ marginTop: 10 }}>
                    Штрафы (внутренние маркеры)
                  </div>
                  <div className="ii-qAuditList">
                    {pen.slice(0, 8).map((p, idx) => (
                      <div key={idx} className="ii-qAuditItem">
                        {p}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

