"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import type { StartupAnalysisInput, StartupAnalysisResult } from "@/lib/analyzer/types";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function stageRu(stage: StartupAnalysisInput["stage"]) {
  if (stage === "idea") return "идея";
  if (stage === "seed") return "посев";
  if (stage === "series_a") return "раунд A";
  if (stage === "series_b") return "раунд B";
  if (stage === "growth") return "рост";
  return "выход";
}

function modeRu(mode: StartupAnalysisInput["mode"]) {
  return mode === "idea" ? "идея" : "стартап";
}

export function ReportTopBar({
  input,
  report,
  viewMode,
  onViewModeChange,
  onBackToParams,
  onSave,
  onEnsureSavedAndGo,
  me,
  saving,
  saved,
}: {
  input: StartupAnalysisInput;
  report: StartupAnalysisResult;
  viewMode: "founder" | "investor";
  onViewModeChange: (m: "founder" | "investor") => void;
  onBackToParams: () => void;
  onSave: () => void;
  onEnsureSavedAndGo: (target: "startup" | "idea") => void;
  me: { id: string; role: "user" | "admin" } | null;
  saving: boolean;
  saved: boolean;
}) {
  const title = (input.title ?? "").trim() || reportCopy.hero.title;
  return (
    <div className="ii-topbar">
      <div className="ii-brand">
        <div className="ii-brandTitle">{title}</div>
        <div className="ii-brandMeta">
          <span className="ii-pill">стадия: {stageRu(input.stage)}</span>
          <span className="ii-pill">формат: {modeRu(input.mode)}</span>
          <span className="ii-pill">версия: {report.analysisVersion ?? "v1"}</span>
          {saved ? <span className="ii-pill ii-pill-ok">сохранено в историю</span> : null}
        </div>
      </div>

      <div className="ii-toolbar">
        <div className="ii-tabs" role="tablist" aria-label="Режим отчёта">
          <button type="button" className={`ii-tab ${viewMode === "founder" ? "is-active" : ""}`} onClick={() => onViewModeChange("founder")}>
            Режим основателя
          </button>
          <button type="button" className={`ii-tab ${viewMode === "investor" ? "is-active" : ""}`} onClick={() => onViewModeChange("investor")}>
            Режим инвестора
          </button>
        </div>

        <Button type="button" variant="ghost" className="h-11" onClick={onBackToParams}>
          К анализатору
        </Button>
        <Button type="button" variant="secondary" className="h-11" disabled={!me || saving} onClick={() => onEnsureSavedAndGo("startup")}>
          Создать стартап
        </Button>
        <Button type="button" variant="secondary" className="h-11" disabled={!me || saving} onClick={() => onEnsureSavedAndGo("idea")}>
          Создать идею
        </Button>
        <Button type="button" className="h-11" disabled={!me || saving} onClick={onSave}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}

