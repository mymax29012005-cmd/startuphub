"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
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
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [industryLabel, setIndustryLabel] = useState("SaaS / Продажи");

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
      title: projectTitle.trim() ? projectTitle.trim() : undefined,
      description: projectDescription.trim() ? projectDescription.trim() : undefined,
      industryLabel: industryLabel.trim() ? industryLabel.trim() : undefined,

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
    projectTitle,
    projectDescription,
    industryLabel,
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
    setProjectTitle(item.data.title ?? "");
    setProjectDescription(item.data.description ?? "");
    setIndustryLabel(item.data.industryLabel ?? "SaaS / Продажи");

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

  function resetNewAnalysis() {
    setResult(null);
    setSaved(false);
    setLastSavedId(null);
    setStep(0);
    setProjectTitle("");
    setProjectDescription("");
    setIndustryLabel("SaaS / Продажи");
    setStage("seed");
    setMode("startup");
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

  const lastAnalysisText = useMemo(() => {
    const first = history[0];
    if (!first) return "—";
    return new Date(first.createdAt).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [history]);

  const overallScore10 = useMemo(() => {
    if (!result) return null;
    return (result.successProbability * 10).toFixed(1);
  }, [result]);

  const readinessPct = useMemo(() => {
    if (!result) return null;
    return Math.round(result.successProbability * 100);
  }, [result]);

  const potentialWidthPct = useMemo(() => {
    if (!result) return 0;
    return Math.round(Math.max(0, Math.min(100, result.successProbability * 100)));
  }, [result]);

  const report = result;

  return (
    <div className="pt-24 max-w-7xl mx-auto px-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">Анализатор проекта</h1>
          <p className="text-gray-400 mt-2 text-lg">Получи глубокий AI-анализ твоего стартапа за секунды</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:text-right">
          <div>
            <div className="text-sm text-gray-400">Последний анализ</div>
            <div className="text-emerald-400 font-medium">{lastAnalysisText}</div>
          </div>
          <button
            type="button"
            onClick={resetNewAnalysis}
            className="px-6 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition"
          >
            Новый анализ
          </button>
        </div>
      </div>

      {returnTo ? (
        <div className="mb-8 bg-[#12121A] border border-white/10 rounded-3xl p-6">
          <div className="text-sm font-semibold text-white">Вы пришли из создания/редактирования карточки</div>
          <div className="mt-1 text-xs text-gray-400">
            Сохраните отчёт и выберите: прикрепить его к карточке или вернуться без прикрепления.
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" className="h-10" disabled={!result || saving} onClick={() => void ensureSavedAndGo(mode)}>
              {saving ? "…" : "Сохранить и прикрепить"}
            </Button>
            <Button type="button" variant="ghost" className="h-10" onClick={() => router.push(returnTo)}>
              Вернуться без прикрепления
            </Button>
          </div>
        </div>
      ) : null}

      <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] ring-1 ring-[rgba(124,58,237,0.35)]">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("startup")}
                  className={[
                    "px-4 py-2 rounded-2xl text-sm border transition",
                    mode === "startup" ? "border-violet-500 bg-violet-600/15 text-white" : "border-white/10 bg-white/5 text-gray-300 hover:text-white",
                  ].join(" ")}
                >
                  Стартап
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idea")}
                  className={[
                    "px-4 py-2 rounded-2xl text-sm border transition",
                    mode === "idea" ? "border-violet-500 bg-violet-600/15 text-white" : "border-white/10 bg-white/5 text-gray-300 hover:text-white",
                  ].join(" ")}
                >
                  Идея
                </button>
              </div>
              <Badge className="bg-white/5 border border-white/10">{stepLabels[Math.min(step, 3)]}</Badge>
            </div>

            <label className="block text-sm text-gray-400 mb-2">Название проекта</label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-violet-500"
              placeholder="Например: SalesAI Pro — ИИ для автоматизации продаж"
            />

            <div className="mt-8">
              <label className="block text-sm text-gray-400 mb-3">Краткое описание</label>
              <textarea
                rows={4}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-3xl px-6 py-5 focus:outline-none focus:border-violet-500"
                placeholder="Расскажи, что делает продукт, для кого он и почему это важно…"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Отрасль</label>
                <select
                  value={industryLabel}
                  onChange={(e) => setIndustryLabel(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-4 text-white"
                >
                  <option>SaaS / Продажи</option>
                  <option>Fintech</option>
                  <option>AI & Machine Learning</option>
                  <option>E-commerce</option>
                  <option>Green Tech</option>
                  <option>HealthTech</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Стадия</label>
                <select
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-6 py-4 text-white"
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

            <div className="mt-8 border-t border-white/10 pt-8">
              {step < 4 ? (
                <>
                  <div className="flex flex-col gap-2 mb-5">
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
                    <div className="text-sm text-gray-400 leading-relaxed">
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

                  {step === 0 ? (
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span>{t("analyzer.fields.competition")}</span>
                          <HelpTip text={t("analyzer.fieldHelp.competition")} />
                        </div>
                        <select
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white"
                          value={competition}
                          onChange={(e) => setCompetition(e.target.value as CompetitionLevel)}
                        >
                          {competitionLevels.map((l) => (
                            <option key={l} value={l}>
                              {t(`analyzer.levels.${l}`)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                          <div className="text-xs text-gray-400 mb-2">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.monthlyRevenue")}</span>
                          </div>
                          <MoneyInput value={monthlyRevenue} onChange={setMonthlyRevenue} placeholder="0" />
                          <div className="mt-1 text-gray-500 text-xs">{t("analyzer.hint.monthlyRevenue")}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2">{t("analyzer.fields.activeUsers")}</div>
                          <MoneyInput value={activeUsers} onChange={setActiveUsers} placeholder="0" />
                          <div className="mt-1 text-gray-500 text-xs">{t("analyzer.hint.activeUsers")}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.arpu")}</span>
                            <HelpTip text={t("analyzer.fieldHelp.arpu")} />
                          </div>
                          <MoneyInput value={arpu} onChange={setArpu} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.cac")}</span>
                            <HelpTip text={t("analyzer.fieldHelp.cac")} />
                          </div>
                          <MoneyInput value={cac} onChange={setCac} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.paybackMonths")}</span>
                            <HelpTip text={t("analyzer.fieldHelp.paybackMonths")} />
                          </div>
                          <MoneyInput value={unitPaybackMonths} onChange={setUnitPaybackMonths} placeholder="0" />
                          <div className="mt-1 text-gray-500 text-xs">{t("analyzer.hint.paybackMonths")}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
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
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.burnMonthly")}</span>
                            <HelpTip text={t("analyzer.fieldHelp.burnMonthly")} />
                          </div>
                          <MoneyInput value={burnMonthly} onChange={setBurnMonthly} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.cashOnHand")}</span>
                            <HelpTip text={t("analyzer.fieldHelp.cashOnHand")} />
                          </div>
                          <MoneyInput value={cashOnHand} onChange={setCashOnHand} placeholder="0" />
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span>{t("analyzer.fields.regulatory")}</span>
                          <HelpTip text={t("analyzer.fieldHelp.regulatory")} />
                        </div>
                        <select
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white"
                          value={regulatory}
                          onChange={(e) => setRegulatory(e.target.value as RiskLevel)}
                        >
                          {riskLevels.map((l) => (
                            <option key={l} value={l}>
                              {t(`analyzer.levels.${l}`)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span>{t("analyzer.fields.tech")}</span>
                          <HelpTip text={t("analyzer.fieldHelp.tech")} />
                        </div>
                        <select
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white"
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
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="text-xs text-gray-500">
                      Шаг {step + 1} из 4 · {stepLabels[step]}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" className="h-11" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                        Назад
                      </Button>
                      {step < 3 ? (
                        <Button type="button" className="h-11 px-6" onClick={() => setStep((s) => Math.min(3, s + 1))}>
                          Далее
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {step === 3 ? (
                    <button
                      type="button"
                      onClick={computeAndShow}
                      className="mt-6 w-full py-6 text-xl font-semibold rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 hover:brightness-110 transition flex items-center justify-center gap-3"
                    >
                      <span>✨</span>
                      Запустить глубокий анализ
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="text-sm text-gray-400">Отчёт открыт справа. Можно вернуться к параметрам и пересчитать.</div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#1A1A24] rounded-3xl p-8 border border-white/10 shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] ring-1 ring-[rgba(124,58,237,0.35)]">
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="font-semibold text-lg">Результат анализа</div>
                <div className="px-5 py-2 bg-emerald-500/20 text-emerald-400 text-sm rounded-2xl whitespace-nowrap">
                  {readinessPct == null ? "—" : `Готовность ${readinessPct}%`}
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between text-sm mb-3">
                  <span>Общий потенциал проекта</span>
                  <span className="font-bold text-2xl text-emerald-400">{overallScore10 == null ? "—" : `${overallScore10} / 10`}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="progress-bar" style={{ width: `${potentialWidthPct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#0A0A0F] rounded-2xl p-4">
                  <div className="text-3xl font-bold text-violet-400">{scores[0] ?? "—"}</div>
                  <div className="text-xs text-gray-400 mt-1">Рыночный fit</div>
                </div>
                <div className="bg-[#0A0A0F] rounded-2xl p-4">
                  <div className="text-3xl font-bold text-rose-400">{scores[3] ?? "—"}</div>
                  <div className="text-xs text-gray-400 mt-1">Команда</div>
                </div>
                <div className="bg-[#0A0A0F] rounded-2xl p-4">
                  <div className="text-3xl font-bold text-amber-400">{scores[5] ?? "—"}</div>
                  <div className="text-xs text-gray-400 mt-1">Технология</div>
                </div>
              </div>
            </div>

            <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8 shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] ring-1 ring-[rgba(124,58,237,0.35)]">
              <h3 className="font-semibold mb-5 flex items-center gap-2">💡 Ключевые insights</h3>
              <ul className="space-y-6 text-sm">
                <li className="flex gap-4">
                  <span className="text-emerald-400 text-xl">↑</span>
                  <div>
                    {report
                      ? `Вероятность успеха: ${(report.successProbability * 100).toFixed(0)}%. Ожидаемая стоимость: ${Math.round(
                          report.expectedValue,
                        ).toLocaleString("ru-RU")} ₽.`
                      : "Заполни параметры слева и запусти анализ — здесь появятся ключевые выводы."}
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-amber-400 text-xl">⚠</span>
                  <div>
                    {report ? `Средний риск: ${riskLevel}. Runway: ${report.runwayMonths.toFixed(1)} мес.` : "Риски и runway рассчитаются автоматически после запуска анализа."}
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-violet-400 text-xl">★</span>
                  <div>
                    {report
                      ? `Диапазон оценки: ${Math.round(report.valuationLow).toLocaleString("ru-RU")} ₽ — ${Math.round(
                          report.valuationHigh,
                        ).toLocaleString("ru-RU")} ₽.`
                      : "После анализа здесь появится диапазон оценки и рекомендации по следующему шагу."}
                  </div>
                </li>
              </ul>
            </div>

            {report ? (
              <div className="space-y-6">
                <div className="bg-[#1A1A24] rounded-3xl p-6 border border-white/10 shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] ring-1 ring-[rgba(124,58,237,0.35)]">
                  <div className="text-white font-semibold mb-3">{t("analyzer.report.radarTitle")}</div>
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

                <div className="bg-[#1A1A24] rounded-3xl p-6 border border-white/10 shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] ring-1 ring-[rgba(124,58,237,0.35)]">
                  <div className="text-white font-semibold mb-3">{t("analyzer.report.cashflowTitle")}</div>
                  <CashflowBars values={report.yearCashflows} />
                </div>

                <div className="bg-[#12121A] border border-white/10 rounded-3xl p-6 shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] ring-1 ring-[rgba(124,58,237,0.35)]">
                  <div className="text-white font-semibold mb-4">{t("analyzer.report.summaryTitle")}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/10">
                      <div className="text-xs text-gray-400">{t("analyzer.report.probability")}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{(report.successProbability * 100).toFixed(0)}%</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {t("analyzer.report.risk")}: {riskLevel}
                      </div>
                    </div>
                    <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/10">
                      <div className="text-xs text-gray-400">{t("analyzer.report.runway")}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{report.runwayMonths.toFixed(1)} мес</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {t("analyzer.report.burn")}: {Math.round(analysisInput.burnMonthly).toLocaleString("ru-RU")} ₽/мес
                      </div>
                    </div>
                    <div className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/10 sm:col-span-2">
                      <div className="text-xs text-gray-400">{t("analyzer.report.expectedValue")}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{Math.round(report.expectedValue).toLocaleString("ru-RU")} ₽</div>
                      <div className="mt-1 text-xs text-gray-400">{t("analyzer.report.expectedValueHint")}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col lg:flex-row gap-3 lg:justify-between lg:items-center">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" className="h-11" onClick={backToAnalyzer}>
                        {t("analyzer.actions.backToAnalyzer")}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button type="button" variant="ghost" className="h-11" onClick={backToAnalyzer}>
                        {t("analyzer.actions.dontSave")}
                      </Button>
                      <Button type="button" variant="secondary" className="h-11" disabled={!me || saving} onClick={() => ensureSavedAndGo("startup")}>
                        {t("analyzer.actions.createStartupWithAnalysis")}
                      </Button>
                      <Button type="button" variant="secondary" className="h-11" disabled={!me || saving} onClick={() => ensureSavedAndGo("idea")}>
                        {t("analyzer.actions.createIdeaWithAnalysis")}
                      </Button>
                      <Button type="button" className="h-11" disabled={!me || saving} onClick={onSave}>
                        {saving ? t("analyzer.actions.saving") : t("analyzer.actions.save")}
                      </Button>
                    </div>
                  </div>

                  {!me ? <div className="mt-3 text-xs text-gray-400">{t("analyzer.actions.loginToSave")}</div> : null}
                  {me && saved ? <div className="mt-3 text-xs text-gray-400">{t("common.success")}</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-8">История анализов</h2>
        {!me ? (
          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-6 text-sm text-gray-400">{t("analyzer.historyLogin")}</div>
        ) : historyLoading ? (
          <div className="text-sm text-gray-400">{t("analyzer.historyLoading")}</div>
        ) : history.length === 0 ? (
          <div className="text-sm text-gray-400">{t("analyzer.historyEmpty")}</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {history.slice(0, 12).map((item) => {
              const title = item.data.title?.trim() || "Анализ без названия";
              const score10 = (item.result.successProbability * 10).toFixed(1);
              const color =
                item.result.successProbability >= 0.75
                  ? "text-emerald-400"
                  : item.result.successProbability >= 0.45
                    ? "text-amber-400"
                    : "text-violet-400";
              return (
                <div key={item.id} className="transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgb(124_58_237_/_0.3)] bg-[#12121A] border border-white/10 rounded-3xl p-6">
                  <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("ru-RU")}</div>
                  <div className="font-medium mt-2 line-clamp-2">{title}</div>
                  <div className={`${color} text-sm mt-6`}>Скоринг: {score10}/10</div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" className="h-9" onClick={() => openHistoryItem(item)}>
                      {t("analyzer.historyOpen")}
                    </Button>
                    <Button variant="ghost" className="h-9" disabled={historyDeletingId === item.id} onClick={() => onDeleteHistory(item.id)}>
                      {historyDeletingId === item.id ? "…" : t("analyzer.historyDelete")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


