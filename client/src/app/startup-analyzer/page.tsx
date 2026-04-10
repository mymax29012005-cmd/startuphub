"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RadarChart } from "@/components/analyzer/RadarChart";
import { CashflowBars } from "@/components/analyzer/CashflowBars";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { useI18n } from "@/i18n/I18nProvider";
import { computeStartupAnalysis } from "@/lib/analyzer/computeStartupAnalysis";
import type {
  CompetitionLevel,
  RiskLevel,
  StartupAnalysisInput,
  StartupStage,
} from "@/lib/analyzer/types";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";

const stages: StartupStage[] = ["idea", "seed", "series_a", "series_b", "growth", "exit"];
const competitionLevels: CompetitionLevel[] = ["low", "medium", "high"];
const riskLevels: RiskLevel[] = ["low", "medium", "high"];

type HistoryItem = {
  id: string;
  createdAt: string;
  data: StartupAnalysisInput;
  result: ReturnType<typeof computeStartupAnalysis>;
};

function parseDigits(s: string) {
  const clean = stripNonDigits(s);
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      inputMode="numeric"
      placeholder={placeholder}
      value={formatDigitsWithSpaces(value)}
      onChange={(e) => onChange(stripNonDigits(e.target.value))}
    />
  );
}

export default function AnalyzerPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-[rgba(234,240,255,0.72)]">Загрузка…</div>}>
      <AnalyzerInner />
    </Suspense>
  );
}

function AnalyzerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useI18n();
  const [me, setMe] = useState<{ id: string; role: "user" | "admin" } | null>(null);

  const returnTo = searchParams.get("returnTo");
  const returnMode = searchParams.get("mode") as "startup" | "idea" | null;

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"startup" | "idea">("startup");
  const [stage, setStage] = useState<StartupStage>("seed");

  // Step 1: market & moat
  const [marketValidation, setMarketValidation] = useState(60);
  const [competition, setCompetition] = useState<CompetitionLevel>("medium");
  const [moatStrength, setMoatStrength] = useState(50);

  // Step 2: traction & team
  const [tractionScore, setTractionScore] = useState(55);
  const [teamStrength, setTeamStrength] = useState(60);

  // Step 3: unit economics
  const [grossMarginPct, setGrossMarginPct] = useState(60);
  const [recurringShare, setRecurringShare] = useState(0.7);
  const [monthlyChurnPct, setMonthlyChurnPct] = useState(2);
  const [activeUsers, setActiveUsers] = useState("200");
  const [arpu, setArpu] = useState("5000");
  const [monthlyRevenue, setMonthlyRevenue] = useState("0");
  const [cac, setCac] = useState("20000");
  const [unitPaybackMonths, setUnitPaybackMonths] = useState("12");
  const [growthMonthlyPct, setGrowthMonthlyPct] = useState(4);

  // Step 4: finance & risk
  const [burnMonthly, setBurnMonthly] = useState("300000");
  const [cashOnHand, setCashOnHand] = useState("1000000");
  const [regulatory, setRegulatory] = useState<RiskLevel>("medium");
  const [tech, setTech] = useState<RiskLevel>("medium");

  const [result, setResult] = useState<ReturnType<typeof computeStartupAnalysis> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDeletingId, setHistoryDeletingId] = useState<string | null>(null);

  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (returnMode === "startup" || returnMode === "idea") setMode(returnMode);
  }, [returnMode]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as { id: string; role: "user" | "admin" };
        if (!cancelled) setMe(data);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!me) return;
      setHistoryLoading(true);
      try {
        const r = await fetch("/api/v1/startup-analysis", {
          credentials: "include",
        });
        if (!r.ok) return;
        const json = (await r.json()) as { items: HistoryItem[] };
        if (!cancelled) setHistory(json.items);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [me?.id]);

  const analysisInput: StartupAnalysisInput = useMemo(() => {
    return {
      mode,
      stage,

      marketValidation,
      competition,
      moatStrength,

      tractionScore,
      teamStrength,

      grossMarginPct,
      activeUsers: parseDigits(activeUsers),
      arpu: parseDigits(arpu),
      recurringShare,
      monthlyChurnPct,
      cac: parseDigits(cac),
      unitPaybackMonths: parseDigits(unitPaybackMonths),
      growthMonthlyPct,

      monthlyRevenue: parseDigits(monthlyRevenue),
      burnMonthly: parseDigits(burnMonthly),
      cashOnHand: parseDigits(cashOnHand),

      regulatory,
      tech,
    };
  }, [
    mode,
    stage,
    marketValidation,
    competition,
    moatStrength,
    tractionScore,
    teamStrength,
    grossMarginPct,
    activeUsers,
    arpu,
    recurringShare,
    monthlyChurnPct,
    cac,
    unitPaybackMonths,
    growthMonthlyPct,
    monthlyRevenue,
    burnMonthly,
    cashOnHand,
    regulatory,
    tech,
  ]);

  const scores = useMemo(() => {
    // Convert "risk" components into "strength" scores for visualization.
    // Keep deterministic mapping from input rather than recomputing private internals.
    const marketRisk = clamp(100 - marketValidation, 0, 100);
    const competitionRisk = competition === "low" ? 20 : competition === "medium" ? 50 : 80;
    const regulatoryRisk = regulatory === "low" ? 20 : regulatory === "medium" ? 50 : 80;
    const techRisk = tech === "low" ? 20 : tech === "medium" ? 50 : 80;

    // Strength scores (0..100)
    const marketScore = 100 - marketRisk;
    const competitionScore = 100 - competitionRisk;
    const financialScoreGuess = result ? result.financialScore : 60;
    const unitScoreGuess = result ? result.unitEconomicsScore : 60;
    const teamScore = teamStrength * 0.7 + moatStrength * 0.3;
    const riskAdjustedTechScore = 100 - (regulatoryRisk * 0.35 + techRisk * 0.65);
    const traction = result ? result.tractionScore : tractionScore;

    return [
      clamp(marketScore, 0, 100),
      clamp(unitScoreGuess, 0, 100),
      clamp(traction, 0, 100),
      clamp(teamScore, 0, 100),
      clamp(financialScoreGuess, 0, 100),
      clamp(riskAdjustedTechScore, 0, 100),
    ];
  }, [marketValidation, competition, regulatory, tech, result, teamStrength, moatStrength, tractionScore]);

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  const stepLabels = useMemo(() => {
    return [
      t("analyzer.steps.market"),
      t("analyzer.steps.traction"),
      t("analyzer.steps.unit"),
      t("analyzer.steps.finance"),
      t("analyzer.steps.report"),
    ];
  }, [lang]);

  function computeAndShow() {
    const r = computeStartupAnalysis(analysisInput);
    setResult(r);
    setSaved(false);
    setStep(4);
  }

  function openHistoryItem(item: HistoryItem) {
    setMode(item.data.mode);
    setStage(item.data.stage);

    setMarketValidation(item.data.marketValidation);
    setCompetition(item.data.competition);
    setMoatStrength(item.data.moatStrength);

    setTractionScore(item.data.tractionScore);
    setTeamStrength(item.data.teamStrength);

    setGrossMarginPct(item.data.grossMarginPct);
    setRecurringShare(item.data.recurringShare);
    setMonthlyChurnPct(item.data.monthlyChurnPct);
    setActiveUsers(String(item.data.activeUsers));
    setArpu(String(item.data.arpu));
    setMonthlyRevenue(String(item.data.monthlyRevenue));
    setCac(String(item.data.cac));
    setUnitPaybackMonths(String(item.data.unitPaybackMonths));
    setGrowthMonthlyPct(item.data.growthMonthlyPct);

    setBurnMonthly(String(item.data.burnMonthly));
    setCashOnHand(String(item.data.cashOnHand));
    setRegulatory(item.data.regulatory);
    setTech(item.data.tech);

    setResult(item.result);
    setSaved(false);
    setLastSavedId(item.id);
    setStep(4);
  }

  function backToAnalyzer() {
    setResult(null);
    setSaved(false);
    setLastSavedId(null);
    setStep(0);
    // keep inputs as-is so user can tweak quickly
  }

  async function onSave() {
    if (!result) return;
    setSaving(true);
    try {
      const r = await fetch("/api/v1/startup-analysis", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: analysisInput,
          result,
        }),
      });
      setSaved(r.ok);
      if (r.ok) {
        const json = (await r.json().catch(() => null)) as { id?: string } | null;
        setLastSavedId(json?.id ?? null);
      }
      if (r.ok && me) {
        // Refresh history right away (so the new record appears).
        const hr = await fetch("/api/v1/startup-analysis", { credentials: "include" });
        if (hr.ok) {
          const json = (await hr.json()) as { items: HistoryItem[] };
          setHistory(json.items);
        }
      }
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  async function ensureSavedAndGo(target: "startup" | "idea") {
    if (!me || !result) return;
    let analysisId = lastSavedId;

    if (!analysisId) {
      setSaving(true);
      try {
        const r = await fetch("/api/v1/startup-analysis", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: analysisInput, result }),
        });
        if (!r.ok) return;
        const json = (await r.json().catch(() => null)) as { id?: string } | null;
        analysisId = json?.id ?? null;
        setLastSavedId(analysisId);

        const hr = await fetch("/api/v1/startup-analysis", { credentials: "include" });
        if (hr.ok) {
          const json = (await hr.json()) as { items: HistoryItem[] };
          setHistory(json.items);
        }
      } finally {
        setSaving(false);
      }
    }

    if (!analysisId) return;
    if (returnTo) {
      const sep = returnTo.includes("?") ? "&" : "?";
      router.push(`${returnTo}${sep}analysisId=${analysisId}`);
      return;
    }
    router.push(target === "startup" ? `/add-startup?analysisId=${analysisId}` : `/add-idea?analysisId=${analysisId}`);
  }

  async function onDeleteHistory(id: string) {
    if (!me) return;
    setHistoryDeletingId(id);
    try {
      const r = await fetch(`/api/v1/startup-analysis/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) return;
      setHistory((h) => h.filter((x) => x.id !== id));
    } catch {
      // ignore
    } finally {
      setHistoryDeletingId(null);
    }
  }

  const riskLevel = useMemo(() => {
    if (!result) return null;
    if (result.riskAvg <= 35) return t("analyzer.risk.low");
    if (result.riskAvg <= 65) return t("analyzer.risk.medium");
    return t("analyzer.risk.high");
  }, [result, lang]);

  const report = result;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[rgba(234,240,255,0.72)] text-sm">{t("analyzer.breadcrumb")}</div>
            <h1 className="text-2xl font-semibold text-white">{t("analyzer.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/startups">
              <Button variant="ghost" className="h-10">{t("analyzer.backToStartups")}</Button>
            </Link>
          </div>
        </div>
      </div>

      {returnTo ? (
        <div className="mb-6 glass rounded-3xl p-4 border border-[rgba(110,168,255,0.25)]">
          <div className="text-sm font-semibold text-white">Вы пришли из создания/редактирования карточки</div>
          <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
            Сохраните отчёт и выберите: прикрепить его к карточке или вернуться без прикрепления.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              disabled={!result || saving}
              onClick={() => void ensureSavedAndGo(mode)}
            >
              {saving ? "…" : "Сохранить и прикрепить"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10"
              onClick={() => router.push(returnTo)}
            >
              Вернуться без прикрепления
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        {stepLabels.map((lab, idx) => {
          const active = idx === step;
          const done = idx < step;
          return (
            <div
              key={lab}
              className={[
                "glass rounded-3xl p-4 border transition",
                active
                  ? "border-[rgba(110,168,255,0.45)]"
                  : done
                    ? "border-[rgba(110,168,255,0.25)]"
                    : "border-[rgba(255,255,255,0.12)]",
              ].join(" ")}
            >
              <div className="text-xs text-[rgba(234,240,255,0.72)]">{lab}</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-6 md:p-10 border border-[rgba(255,255,255,0.10)]">
        {step < 4 ? (
          <>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
              <div>
                <div className="text-white font-semibold">
                  {t(
                    step === 0
                      ? "analyzer.section.market"
                      : step === 1
                        ? "analyzer.section.traction"
                        : step === 2
                          ? "analyzer.section.unit"
                          : "analyzer.section.finance",
                  )}
                </div>
                <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                  {t(
                    step === 0
                      ? "analyzer.help.market"
                      : step === 1
                        ? "analyzer.help.traction"
                        : step === 2
                          ? "analyzer.help.unit"
                          : "analyzer.help.finance",
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge>{mode === "startup" ? t("analyzer.modes.startup") : t("analyzer.modes.idea")}</Badge>
                <select
                  className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as StartupStage)}
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {t(`analyzer.stages.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {step === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>
                      {t("analyzer.fields.marketValidation")} ({marketValidation})
                    </span>
                    <HelpTip text={t("analyzer.fieldHelp.marketValidation")} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={marketValidation}
                    onChange={(e) => setMarketValidation(Number(e.target.value))}
                    className="w-full"
                  />

                  <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>{t("analyzer.fields.competition")}</span>
                    <HelpTip text={t("analyzer.fieldHelp.competition")} />
                  </div>
                  <select
                    className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value as CompetitionLevel)}
                  >
                    {competitionLevels.map((l) => (
                      <option key={l} value={l}>
                        {t(`analyzer.levels.${l}`)}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>
                      {t("analyzer.fields.moatStrength")} ({moatStrength})
                    </span>
                    <HelpTip text={t("analyzer.fieldHelp.moatStrength")} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={moatStrength}
                    onChange={(e) => setMoatStrength(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
                  <div className="text-sm font-semibold text-white">{t("analyzer.tip.market")}</div>
                  <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                    {t("analyzer.tipText.market")}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant={mode === "startup" ? "secondary" : "ghost"}
                      type="button"
                      onClick={() => setMode("startup")}
                      className="h-10"
                    >
                      {t("analyzer.modes.startup")}
                    </Button>
                    <Button
                      variant={mode === "idea" ? "secondary" : "ghost"}
                      type="button"
                      onClick={() => setMode("idea")}
                      className="h-10"
                    >
                      {t("analyzer.modes.idea")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>
                      {t("analyzer.fields.tractionScore")} ({tractionScore})
                    </span>
                    <HelpTip text={t("analyzer.fieldHelp.tractionScore")} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={tractionScore}
                    onChange={(e) => setTractionScore(Number(e.target.value))}
                    className="w-full"
                  />

                  <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>
                      {t("analyzer.fields.teamStrength")} ({teamStrength})
                    </span>
                    <HelpTip text={t("analyzer.fieldHelp.teamStrength")} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={teamStrength}
                    onChange={(e) => setTeamStrength(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
                  <div className="text-sm font-semibold text-white">{t("analyzer.tip.traction")}</div>
                  <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                    {t("analyzer.tipText.traction")}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>
                      {t("analyzer.fields.grossMargin")} ({grossMarginPct}%)
                    </span>
                    <HelpTip text={t("analyzer.fieldHelp.grossMargin")} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={grossMarginPct}
                    onChange={(e) => setGrossMarginPct(Number(e.target.value))}
                    className="w-full"
                  />

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>
                          {t("analyzer.fields.monthlyChurnPct")} ({monthlyChurnPct}%)
                        </span>
                        <HelpTip text={t("analyzer.fieldHelp.monthlyChurnPct")} />
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={15}
                        step={0.1}
                        value={monthlyChurnPct}
                        onChange={(e) => setMonthlyChurnPct(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2">
                        {t("analyzer.fields.growthMonthly")} ({growthMonthlyPct}%)
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        step={0.5}
                        value={growthMonthlyPct}
                        onChange={(e) => setGrowthMonthlyPct(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>{t("analyzer.fields.monthlyRevenue")}</span>
                      </div>
                      <MoneyInput value={monthlyRevenue} onChange={setMonthlyRevenue} placeholder="0" />
                      <div className="mt-1 text-[rgba(234,240,255,0.60)] text-xs">{t("analyzer.hint.monthlyRevenue")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2">{t("analyzer.fields.activeUsers")}</div>
                      <MoneyInput value={activeUsers} onChange={setActiveUsers} placeholder="0" />
                      <div className="mt-1 text-[rgba(234,240,255,0.60)] text-xs">{t("analyzer.hint.activeUsers")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>{t("analyzer.fields.arpu")}</span>
                        <HelpTip text={t("analyzer.fieldHelp.arpu")} />
                      </div>
                      <MoneyInput value={arpu} onChange={setArpu} placeholder="0" />
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>{t("analyzer.fields.cac")}</span>
                        <HelpTip text={t("analyzer.fieldHelp.cac")} />
                      </div>
                      <MoneyInput value={cac} onChange={setCac} placeholder="0" />
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>{t("analyzer.fields.paybackMonths")}</span>
                        <HelpTip text={t("analyzer.fieldHelp.paybackMonths")} />
                      </div>
                      <MoneyInput value={unitPaybackMonths} onChange={setUnitPaybackMonths} placeholder="0" />
                      <div className="mt-1 text-[rgba(234,240,255,0.60)] text-xs">{t("analyzer.hint.paybackMonths")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>
                          {t("analyzer.fields.recurringShare")} ({Math.round(recurringShare * 100)}%)
                        </span>
                        <HelpTip text={t("analyzer.fieldHelp.recurringShare")} />
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={recurringShare}
                        onChange={(e) => setRecurringShare(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
                  <div className="text-sm font-semibold text-white">{t("analyzer.tip.unit")}</div>
                  <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                    {t("analyzer.tipText.unit")}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>{t("analyzer.fields.burnMonthly")}</span>
                        <HelpTip text={t("analyzer.fieldHelp.burnMonthly")} />
                      </div>
                      <MoneyInput value={burnMonthly} onChange={setBurnMonthly} placeholder="0" />
                    </div>
                    <div>
                      <div className="text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                        <span>{t("analyzer.fields.cashOnHand")}</span>
                        <HelpTip text={t("analyzer.fieldHelp.cashOnHand")} />
                      </div>
                      <MoneyInput value={cashOnHand} onChange={setCashOnHand} placeholder="0" />
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>{t("analyzer.fields.regulatory")}</span>
                    <HelpTip text={t("analyzer.fieldHelp.regulatory")} />
                  </div>
                  <select
                    className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                    value={regulatory}
                    onChange={(e) => setRegulatory(e.target.value as RiskLevel)}
                  >
                    {riskLevels.map((l) => (
                      <option key={l} value={l}>
                        {t(`analyzer.levels.${l}`)}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 text-xs text-[rgba(234,240,255,0.72)] mb-2 flex items-center">
                    <span>{t("analyzer.fields.tech")}</span>
                    <HelpTip text={t("analyzer.fieldHelp.tech")} />
                  </div>
                  <select
                    className="focus-ring [color-scheme:dark] text-white w-full rounded-2xl border border-[rgba(255,255,255,0.14)] bg-white/5 px-4 py-2 text-sm"
                    value={tech}
                    onChange={(e) => setTech(e.target.value as RiskLevel)}
                  >
                    {riskLevels.map((l) => (
                      <option key={l} value={l}>
                        {t(`analyzer.levels.${l}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)]">
                  <div className="text-sm font-semibold text-white">{t("analyzer.tip.finance")}</div>
                  <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                    {t("analyzer.tipText.finance")}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={step === 0}
                  className="h-11 px-6"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  ← {t("analyzer.actions.back")}
                </Button>
              </div>
              <div className="flex gap-3">
                {step < 3 ? (
                  <Button type="button" className="h-11 px-6" onClick={() => setStep((s) => Math.min(3, s + 1))}>
                    {t("analyzer.actions.next")}
                  </Button>
                ) : (
                  <Button type="button" className="h-11 px-6" onClick={computeAndShow}>
                    {t("analyzer.actions.calculate")}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {report ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <div className="text-white font-semibold">{t("analyzer.report.radarTitle")}</div>
                  <div className="mt-3">
                    <RadarChart
                      labels={[
                        t("analyzer.report.labels.market"),
                        t("analyzer.report.labels.unit"),
                        t("analyzer.report.labels.traction"),
                        t("analyzer.report.labels.team"),
                        t("analyzer.report.labels.financial"),
                        t("analyzer.report.labels.risk"),
                      ]}
                      values={scores}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="text-white font-semibold">{t("analyzer.report.cashflowTitle")}</div>
                    <div className="mt-3">
                      <CashflowBars values={report.yearCashflows} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <div className="text-white font-semibold">{t("analyzer.report.summaryTitle")}</div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-4 glass rounded-3xl">
                      <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.probability")}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {(report.successProbability * 100).toFixed(0)}%
                      </div>
                      <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
                        {t("analyzer.report.risk")}: {riskLevel}
                      </div>
                    </Card>
                    <Card className="p-4 glass rounded-3xl">
                      <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.runway")}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{report.runwayMonths.toFixed(1)} мес</div>
                      <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
                        {t("analyzer.report.burn")}: {report ? Math.round(analysisInput.burnMonthly).toLocaleString("ru-RU") : "—"} ₽/мес
                      </div>
                    </Card>

                    <Card className="p-4 glass rounded-3xl">
                      <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.expectedValue")}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{Math.round(report.expectedValue).toLocaleString("ru-RU")} ₽</div>
                      <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.expectedValueHint")}</div>
                    </Card>

                    <Card className="p-4 glass rounded-3xl">
                      <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.unitEconomicsTitle")}</div>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.ltv")}</div>
                          <div className="text-lg font-semibold text-white">{Math.round(report.ltv).toLocaleString("ru-RU")} ₽</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.payback")}</div>
                          <div className="text-lg font-semibold text-white">{report.paybackMonths.toFixed(1)} мес</div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white">{t("analyzer.report.valuationTitle")}</div>
                    <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                      {t("analyzer.report.valuationText1")}
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:gap-4">
                      <div>
                        <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.valuationLow")}</div>
                        <div className="text-2xl font-semibold text-white">
                          {Math.round(report.valuationLow).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.valuationHigh")}</div>
                        <div className="text-2xl font-semibold text-white">
                          {Math.round(report.valuationHigh).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-semibold text-white">{t("analyzer.report.financialTitle")}</div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <Card className="p-4 glass rounded-3xl border border-[rgba(255,255,255,0.12)]">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.arr")}</div>
                            <div className="text-lg font-semibold text-white">
                              {Math.round(report.annualRecurringRevenue).toLocaleString("ru-RU")} ₽/год
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.multiple")}</div>
                            <div className="text-lg font-semibold text-white">{report.multiple.toFixed(2)}x</div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 glass rounded-3xl border border-[rgba(255,255,255,0.12)]">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.breakeven")}</div>
                            <div className="text-lg font-semibold text-white">
                              {Math.round(report.breakEvenMonthlyRevenue).toLocaleString("ru-RU")} ₽/мес
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.report.npv")}</div>
                            <div className="text-lg font-semibold text-white">{Math.round(report.npv).toLocaleString("ru-RU")} ₽</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-semibold text-white">{t("analyzer.report.riskBreakdownTitle")}</div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {(
                        [
                          { key: "market", value: report.marketRisk, label: t("analyzer.report.riskDrivers.market") },
                          { key: "competition", value: report.competitionRisk, label: t("analyzer.report.riskDrivers.competition") },
                          { key: "execution", value: report.executionRisk, label: t("analyzer.report.riskDrivers.execution") },
                          { key: "financial", value: report.financialRisk, label: t("analyzer.report.riskDrivers.financial") },
                          { key: "regulatory", value: report.regulatoryRisk, label: t("analyzer.report.riskDrivers.regulatory") },
                          { key: "tech", value: report.techRisk, label: t("analyzer.report.riskDrivers.tech") },
                        ] as const
                      ).map((r) => (
                        <div key={r.key} className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-white">{r.label}</div>
                            <div className="text-xs text-[rgba(234,240,255,0.72)]">{Math.round(r.value)}/100</div>
                          </div>
                          <div className="mt-3 h-3 rounded-full bg-white/5 overflow-hidden border border-[rgba(255,255,255,0.10)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round(r.value)}%`,
                                background:
                                  "linear-gradient(90deg, rgba(175,110,255,0.90), rgba(61,123,255,0.95))",
                              }}
                            />
                          </div>
                          <div className="mt-2 text-xs text-[rgba(234,240,255,0.70)]">{t("analyzer.report.riskNote")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                    <div className="flex gap-3">
                      <Button type="button" variant="ghost" className="h-11" onClick={backToAnalyzer}>
                        {t("analyzer.actions.backToAnalyzer")}
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="ghost" className="h-11" onClick={backToAnalyzer}>
                        {t("analyzer.actions.dontSave")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11"
                        disabled={!me || saving}
                        onClick={() => ensureSavedAndGo("startup")}
                      >
                        {t("analyzer.actions.createStartupWithAnalysis")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11"
                        disabled={!me || saving}
                        onClick={() => ensureSavedAndGo("idea")}
                      >
                        {t("analyzer.actions.createIdeaWithAnalysis")}
                      </Button>
                      <Button
                        type="button"
                        className="h-11"
                        disabled={!me || saving}
                        onClick={onSave}
                      >
                        {saving ? t("analyzer.actions.saving") : t("analyzer.actions.save")}
                      </Button>
                    </div>
                  </div>
                  {!me ? (
                    <div className="mt-3 text-xs text-[rgba(234,240,255,0.72)]">
                      {t("analyzer.actions.loginToSave")}
                    </div>
                  ) : null}
                  {me && saved ? (
                    <div className="mt-3 text-xs text-[rgba(234,240,255,0.72)]">{t("common.success")}</div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-[rgba(234,240,255,0.72)]">{t("analyzer.report.empty")}</div>
            )}
          </>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-white font-semibold text-lg">{t("analyzer.historyTitle")}</div>
            <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
              {me ? t("analyzer.historySubtitle") : t("analyzer.historyLogin")}
            </div>
          </div>
        </div>

        {!me ? (
          <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)] text-xs text-[rgba(234,240,255,0.72)]">
            {t("analyzer.historyLogin")}
          </div>
        ) : (
          <>
            {historyLoading ? (
              <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.historyLoading")}</div>
            ) : history.length === 0 ? (
              <div className="text-xs text-[rgba(234,240,255,0.72)]">{t("analyzer.historyEmpty")}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {history.map((item) => {
                  const riskLabel =
                    item.result.riskAvg <= 35
                      ? t("analyzer.risk.low")
                      : item.result.riskAvg <= 65
                        ? t("analyzer.risk.medium")
                        : t("analyzer.risk.high");

                  return (
                    <div key={item.id} className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs text-[rgba(234,240,255,0.72)]">
                            {new Date(item.createdAt).toLocaleString("ru-RU")}
                          </div>
                          <div className="mt-2 text-white font-semibold">
                            {Math.round(item.result.valuationLow).toLocaleString("ru-RU")} ₽ -{" "}
                            {Math.round(item.result.valuationHigh).toLocaleString("ru-RU")} ₽
                          </div>
                          <div className="mt-2 text-xs text-[rgba(234,240,255,0.72)]">
                            {t("analyzer.report.expectedValue")}: {Math.round(item.result.expectedValue).toLocaleString("ru-RU")} ₽
                          </div>
                          <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
                            {t("analyzer.report.risk")}: {riskLabel}
                          </div>
                        </div>
                        <Button variant="secondary" className="h-10" onClick={() => openHistoryItem(item)}>
                          {t("analyzer.historyOpen")}
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-10"
                          disabled={historyDeletingId === item.id}
                          onClick={() => onDeleteHistory(item.id)}
                        >
                          {historyDeletingId === item.id ? "…" : t("analyzer.historyDelete")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


