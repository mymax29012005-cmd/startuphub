"use client";

import React from "react";
import type { ScenarioSummary } from "@/lib/analyzer/types";
import { HelpTip } from "@/components/analyzer/HelpTip";

function caseRu(c: ScenarioSummary["case"]) {
  if (c === "base") return "База";
  if (c === "upside") return "Апсайд";
  return "Стресс";
}

export function ScenariosPanel({ scenarios, viewMode }: { scenarios?: ScenarioSummary[]; viewMode: "founder" | "investor" }) {
  if (!scenarios?.length) return null;
  return (
    <div className="ii-panel">
      <div className="ii-panelTitle">
        Сценарии (base / upside / stress)
        <HelpTip text="Сценарии — это не «новые расчёты», а детерминированная рамка вокруг диапазонов и ключевых драйверов. Без ложной точности." />
      </div>
      <div className="ii-panelSubtitle">
        {viewMode === "investor"
          ? "Показывает, как диапазон интерпретируется при улучшении/ухудшении ключевых драйверов."
          : "Помогает выбрать, что улучшать: какие изменения дают наибольший сдвиг диапазона."}
      </div>

      <div className="ii-driverList" style={{ marginTop: 14 }}>
        {scenarios.slice(0, 3).map((s) => (
          <div key={s.case} className="ii-driverItem">
            <b>{caseRu(s.case)}:</b>{" "}
            {s.successProbabilityRange ? `${s.successProbabilityRange.low}–${s.successProbabilityRange.high}%` : "—"}
            {s.notes?.length ? <div className="ia-small" style={{ marginTop: 6 }}>{s.notes.join(" ")}</div> : null}
            {viewMode === "investor" && s.assumptions?.length ? (
              <div className="ia-small" style={{ marginTop: 6, opacity: 0.85 }}>
                Допущения: {s.assumptions.slice(0, 2).join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

