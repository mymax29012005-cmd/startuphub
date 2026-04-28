"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { HelpTip } from "@/components/analyzer/HelpTip";
import { useI18n } from "@/i18n/I18nProvider";
import { computeStartupAnalysis } from "@/lib/analyzer/computeStartupAnalysis";
import { reportNarrativeEngine } from "@/lib/analyzer/reportNarrativeEngine";
import { enrichAnalysisV2 } from "@/lib/analyzer/v2/engine";
import { getAnalyzerHint } from "@/lib/analyzer/analyzerGlossary";
import { runAnalyzerSmokeScenarios } from "@/lib/analyzer/v2/smokeScenarios";
import type {
  CompetitionLevel,
  RiskLevel,
  StartupAnalysisInput,
  StartupStage,
} from "@/lib/analyzer/types";
import { formatDigitsWithSpaces, stripNonDigits } from "@/lib/numberFormat";
import { AnalyzerIntelligenceDashboard } from "@/components/analyzer/AnalyzerIntelligenceDashboard";
import "./intelligence-shell.css";

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
  const debugSmoke = searchParams.get("debugSmoke") === "1";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("cosmic-bg");
    document.documentElement.classList.add("cosmic-bg");
    return () => {
      document.body.classList.remove("cosmic-bg");
      document.documentElement.classList.remove("cosmic-bg");
    };
  }, []);

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
  const [newRevenueMonthly, setNewRevenueMonthly] = useState("0");
  const [salesMarketingSpend, setSalesMarketingSpend] = useState("0");
  const [cac, setCac] = useState("20000");
  const [unitPaybackMonths, setUnitPaybackMonths] = useState("12");
  const [growthMonthlyPct, setGrowthMonthlyPct] = useState(4);

  // Step 4: finance & risk
  const [burnMonthly, setBurnMonthly] = useState("300000");
  const [cashOnHand, setCashOnHand] = useState("1000000");
  const [regulatory, setRegulatory] = useState<RiskLevel>("medium");
  const [tech, setTech] = useState<RiskLevel>("medium");

  // Product / usage
  const [dau, setDau] = useState("0");
  const [mau, setMau] = useState("0");
  const [retentionD1Pct, setRetentionD1Pct] = useState(0);
  const [retentionD7Pct, setRetentionD7Pct] = useState(0);
  const [retentionD30Pct, setRetentionD30Pct] = useState(0);
  const [activationRatePct, setActivationRatePct] = useState(0);
  const [conversionRatePct, setConversionRatePct] = useState(0);
  const [organicGrowthPct, setOrganicGrowthPct] = useState(0);
  const [viralCoefficient, setViralCoefficient] = useState("0");

  // Revenue / repeat
  const [repeatPurchaseRatePct, setRepeatPurchaseRatePct] = useState(0);

  // Operations / execution
  const [releasesPerMonth, setReleasesPerMonth] = useState("0");
  const [teamSize, setTeamSize] = useState("0");
  const [foundersFullTime, setFoundersFullTime] = useState<"yes" | "no">("yes");

  // Market (new)
  const [tam, setTam] = useState("0");
  const [tamGrowthPct, setTamGrowthPct] = useState(0);
  const [competitionDensityPct, setCompetitionDensityPct] = useState(50);

  // Evidence (v2)
  const [customerInterviewsCount, setCustomerInterviewsCount] = useState("0");
  const [pilotCount, setPilotCount] = useState("0");
  const [loiCount, setLoiCount] = useState("0");
  const [waitlistSize, setWaitlistSize] = useState("0");

  // Mature-stage (v2)
  const [nrrPct, setNrrPct] = useState(0);
  const [revenueConcentrationPct, setRevenueConcentrationPct] = useState(0);
  const [topCustomerSharePct, setTopCustomerSharePct] = useState(0);

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
      newRevenueMonthly: parseDigits(newRevenueMonthly),
      salesMarketingSpend: parseDigits(salesMarketingSpend),
      burnMonthly: parseDigits(burnMonthly),
      cashOnHand: parseDigits(cashOnHand),

      dau: parseDigits(dau),
      mau: parseDigits(mau),
      retentionD1: clamp(retentionD1Pct / 100, 0, 1),
      retentionD7: clamp(retentionD7Pct / 100, 0, 1),
      retentionD30: clamp(retentionD30Pct / 100, 0, 1),
      activationRate: clamp(activationRatePct / 100, 0, 1),
      conversionRate: clamp(conversionRatePct / 100, 0, 1),
      organicGrowthPct,
      viralCoefficient: Number(String(viralCoefficient).replace(",", ".")) || 0,

      repeatPurchaseRate: clamp(repeatPurchaseRatePct / 100, 0, 1),

      releasesPerMonth: parseDigits(releasesPerMonth),
      teamSize: parseDigits(teamSize),
      foundersFullTime: foundersFullTime === "yes",

      tam: parseDigits(tam),
      tamGrowthPct,
      competitionDensity: clamp(competitionDensityPct / 100, 0, 1),

      regulatory,
      tech,

      customerInterviewsCount: parseDigits(customerInterviewsCount),
      pilotCount: parseDigits(pilotCount),
      loiCount: parseDigits(loiCount),
      waitlistSize: parseDigits(waitlistSize),

      nrrPct,
      revenueConcentrationPct,
      topCustomerSharePct,
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
    newRevenueMonthly,
    salesMarketingSpend,
    burnMonthly,
    cashOnHand,
    dau,
    mau,
    retentionD1Pct,
    retentionD7Pct,
    retentionD30Pct,
    activationRatePct,
    conversionRatePct,
    organicGrowthPct,
    viralCoefficient,
    repeatPurchaseRatePct,
    releasesPerMonth,
    teamSize,
    foundersFullTime,
    tam,
    tamGrowthPct,
    competitionDensityPct,
    regulatory,
    tech,
    customerInterviewsCount,
    pilotCount,
    loiCount,
    waitlistSize,
    nrrPct,
    revenueConcentrationPct,
    topCustomerSharePct,
  ]);

  const scores = useMemo(() => {
    if (result) {
      // Radar values must match the report (fixed formulas, no subjectivity).
      return [
        clamp((result as any).growthScore ?? 0, 0, 100),
        clamp((result as any).unitEconomicsScore ?? 0, 0, 100),
        clamp((result as any).pmfScore ?? 0, 0, 100),
        clamp((result as any).efficiencyScore ?? 0, 0, 100),
        clamp((result as any).marketScore ?? 0, 0, 100),
        clamp(100 - clamp((result as any).riskAvg ?? 0, 0, 100), 0, 100),
      ];
    }
    return [60, 60, 60, 60, 60, 60];
  }, [result]);

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
    setNewRevenueMonthly(String((item.data as any).newRevenueMonthly ?? 0));
    setSalesMarketingSpend(String((item.data as any).salesMarketingSpend ?? 0));
    setCac(String(item.data.cac));
    setUnitPaybackMonths(String(item.data.unitPaybackMonths));
    setGrowthMonthlyPct(item.data.growthMonthlyPct);

    setBurnMonthly(String(item.data.burnMonthly));
    setCashOnHand(String(item.data.cashOnHand));
    setRegulatory(item.data.regulatory);
    setTech(item.data.tech);

    setDau(String((item.data as any).dau ?? 0));
    setMau(String((item.data as any).mau ?? 0));
    setRetentionD1Pct(Math.round(((item.data as any).retentionD1 ?? 0) * 100));
    setRetentionD7Pct(Math.round(((item.data as any).retentionD7 ?? 0) * 100));
    setRetentionD30Pct(Math.round(((item.data as any).retentionD30 ?? 0) * 100));
    setActivationRatePct(Math.round(((item.data as any).activationRate ?? 0) * 100));
    setConversionRatePct(Math.round(((item.data as any).conversionRate ?? 0) * 100));
    setOrganicGrowthPct(Number((item.data as any).organicGrowthPct ?? 0));
    setViralCoefficient(String((item.data as any).viralCoefficient ?? 0));
    setRepeatPurchaseRatePct(Math.round(((item.data as any).repeatPurchaseRate ?? 0) * 100));
    setReleasesPerMonth(String((item.data as any).releasesPerMonth ?? 0));
    setTeamSize(String((item.data as any).teamSize ?? 0));
    setFoundersFullTime(((item.data as any).foundersFullTime ?? true) ? "yes" : "no");
    setTam(String((item.data as any).tam ?? 0));
    setTamGrowthPct(Number((item.data as any).tamGrowthPct ?? 0));
    setCompetitionDensityPct(Math.round(((item.data as any).competitionDensity ?? 0.5) * 100));

    setCustomerInterviewsCount(String((item.data as any).customerInterviewsCount ?? 0));
    setPilotCount(String((item.data as any).pilotCount ?? 0));
    setLoiCount(String((item.data as any).loiCount ?? 0));
    setWaitlistSize(String((item.data as any).waitlistSize ?? 0));

    setNrrPct(Number((item.data as any).nrrPct ?? 0));
    setRevenueConcentrationPct(Number((item.data as any).revenueConcentrationPct ?? 0));
    setTopCustomerSharePct(Number((item.data as any).topCustomerSharePct ?? 0));

    // Backward compatibility: if old saved result has no v2 layers, enrich it on the client.
    const enriched = (item.result as any)?.analysisVersion === "v2" ? item.result : enrichAnalysisV2(item.data as any, item.result as any);
    setResult(enriched as any);
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

  const report = result;
  const narrative = useMemo(() => {
    if (!report) return null;
    return reportNarrativeEngine(report as any, analysisInput);
  }, [report, analysisInput]);

  const showIntelligenceDashboard = Boolean(result && step === 4 && narrative);

  return (
    <div className="ia-shell pt-24 mx-auto max-w-[1200px] px-4 pb-20 sm:px-6">
      {debugSmoke ? (
        <div className="ia-container mb-6">
          <div className="ia-card ia-w-12 ia-blue">
            <div className="text-white font-semibold mb-2">Smoke-сценарии анализатора (debug)</div>
            <div className="text-xs text-gray-400 mb-4">
              Этот блок отображается только при <b>?debugSmoke=1</b>. Нужен для быстрой проверки детерминированной логики.
            </div>
            <div className="space-y-3 text-sm text-[rgba(234,240,255,0.8)]">
              {runAnalyzerSmokeScenarios().map((x) => (
                <div key={x.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">{x.title}</div>
                    <div className={x.ok ? "text-emerald-300" : "text-rose-300"}>{x.ok ? "OK" : "FAIL"}</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    verdict: {x.verdict ?? "—"} · confidence: {x.confidence ?? "—"} · completeness: {x.completenessPct ?? "—"}% · consistency: {x.consistencyScore ?? "—"}
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    {x.notes.join(" · ")}
                  </div>
                  {x.warnings?.length ? (
                    <div className="mt-2 text-xs text-gray-400">
                      warnings: {x.warnings.slice(0, 3).join(" · ")}{x.warnings.length > 3 ? " …" : ""}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!showIntelligenceDashboard ? (
        <div className="ia-container mb-6">
          <div className="ia-grid">
            <div className="ia-card ia-w-8 ia-violet">
              <span className="ia-badge">Investment Intelligence</span>
              <h1 className="!mb-2 text-xl font-semibold tracking-tight sm:text-2xl">Анализатор проекта</h1>
              <p className="text-[rgba(234,240,255,0.72)] text-sm sm:text-base">
                Data-driven анализ: рост, юнит-экономика, PMF, эффективность, рынок и риск — в формате инвестиционного меморандума.
              </p>
            </div>
            <div className="ia-card ia-w-4 ia-mint">
              <h2 className="text-base font-semibold text-white">История</h2>
              <p className="ia-small">Последний анализ</p>
              <p className="ia-metric text-lg !text-[#eaf0ff]">{lastAnalysisText}</p>
              <button
                type="button"
                onClick={resetNewAnalysis}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-4 py-3 text-sm font-semibold text-white hover:brightness-110 transition"
              >
                Новый анализ
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

      {!showIntelligenceDashboard ? (
      <div className="ia-container">
      <div className="ia-card p-6 sm:p-8 md:p-10">
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
              className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-5 py-4 text-base sm:px-6 sm:text-lg focus:outline-none focus:border-violet-500"
              placeholder="Например: SalesAI Pro — ИИ для автоматизации продаж"
            />

            <div className="mt-8">
              <label className="block text-sm text-gray-400 mb-3">Краткое описание</label>
              <textarea
                rows={4}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-3xl px-5 py-4 sm:px-6 sm:py-5 focus:outline-none focus:border-violet-500"
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
                          <HelpTip text={getAnalyzerHint("marketValidation", t("analyzer.fieldHelp.marketValidation"))} />
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
                          <HelpTip text={getAnalyzerHint("competition", t("analyzer.fieldHelp.competition"))} />
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
                          <HelpTip text={getAnalyzerHint("moatStrength", t("analyzer.fieldHelp.moatStrength"))} />
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

                      {stage === "idea" || mode === "idea" ? (
                        <div className="mt-2 rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="text-white font-semibold mb-1">Доказательства спроса (опционально, но повышает точность)</div>
                          <div className="text-xs text-gray-400 mb-4">Эти поля повышают доверие к оценке и снижают риск «самооценки».</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-400 mb-2 flex items-center">
                                <span>Интервью с клиентами</span>
                                <HelpTip text={getAnalyzerHint("customerInterviewsCount")} />
                              </div>
                              <MoneyInput value={customerInterviewsCount} onChange={setCustomerInterviewsCount} placeholder="0" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-2 flex items-center">
                                <span>Пилоты</span>
                                <HelpTip text={getAnalyzerHint("pilotCount")} />
                              </div>
                              <MoneyInput value={pilotCount} onChange={setPilotCount} placeholder="0" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-2 flex items-center">
                                <span>LOI</span>
                                <HelpTip text={getAnalyzerHint("loiCount")} />
                              </div>
                              <MoneyInput value={loiCount} onChange={setLoiCount} placeholder="0" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-2 flex items-center">
                                <span>Лист ожидания</span>
                                <HelpTip text={getAnalyzerHint("waitlistSize")} />
                              </div>
                              <MoneyInput value={waitlistSize} onChange={setWaitlistSize} placeholder="0" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span>
                            {t("analyzer.fields.tractionScore")} ({tractionScore})
                          </span>
                          <HelpTip text={getAnalyzerHint("tractionScore", t("analyzer.fieldHelp.tractionScore"))} />
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
                          <HelpTip text={getAnalyzerHint("teamStrength", t("analyzer.fieldHelp.teamStrength"))} />
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
                          <HelpTip text={getAnalyzerHint("grossMarginPct", t("analyzer.fieldHelp.grossMargin"))} />
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
                            <HelpTip text={getAnalyzerHint("monthlyChurnPct", t("analyzer.fieldHelp.monthlyChurnPct"))} />
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
                            <span>{t("analyzer.fields.newRevenueMonthly")}</span>
                            <HelpTip text={getAnalyzerHint("newRevenueMonthly", t("analyzer.fieldHelp.newRevenueMonthly"))} />
                          </div>
                          <MoneyInput value={newRevenueMonthly} onChange={setNewRevenueMonthly} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.salesMarketingSpend")}</span>
                            <HelpTip text={getAnalyzerHint("salesMarketingSpend", t("analyzer.fieldHelp.salesMarketingSpend"))} />
                          </div>
                          <MoneyInput value={salesMarketingSpend} onChange={setSalesMarketingSpend} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.arpu")}</span>
                            <HelpTip text={getAnalyzerHint("arpu", t("analyzer.fieldHelp.arpu"))} />
                          </div>
                          <MoneyInput value={arpu} onChange={setArpu} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.cac")}</span>
                            <HelpTip text={getAnalyzerHint("cac", t("analyzer.fieldHelp.cac"))} />
                          </div>
                          <MoneyInput value={cac} onChange={setCac} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.paybackMonths")}</span>
                            <HelpTip text={getAnalyzerHint("paybackMonths", t("analyzer.fieldHelp.paybackMonths"))} />
                          </div>
                          <MoneyInput value={unitPaybackMonths} onChange={setUnitPaybackMonths} placeholder="0" />
                          <div className="mt-1 text-gray-500 text-xs">{t("analyzer.hint.paybackMonths")}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>
                              {t("analyzer.fields.recurringShare")} ({Math.round(recurringShare * 100)}%)
                            </span>
                            <HelpTip text={getAnalyzerHint("recurringShare", t("analyzer.fieldHelp.recurringShare"))} />
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

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.dau")}</span>
                            <HelpTip text={getAnalyzerHint("dau", t("analyzer.fieldHelp.dau"))} />
                          </div>
                          <MoneyInput value={dau} onChange={setDau} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.mau")}</span>
                            <HelpTip text={getAnalyzerHint("mau", t("analyzer.fieldHelp.mau"))} />
                          </div>
                          <MoneyInput value={mau} onChange={setMau} placeholder="0" />
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.retentionD30")} ({retentionD30Pct}%)</span>
                            <HelpTip text={getAnalyzerHint("retentionD30", t("analyzer.fieldHelp.retentionD30"))} />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={80}
                            step={1}
                            value={retentionD30Pct}
                            onChange={(e) => setRetentionD30Pct(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.repeatPurchaseRate")} ({repeatPurchaseRatePct}%)</span>
                            <HelpTip text={getAnalyzerHint("repeatPurchaseRate", t("analyzer.fieldHelp.repeatPurchaseRate"))} />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={repeatPurchaseRatePct}
                            onChange={(e) => setRepeatPurchaseRatePct(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.organicGrowthPct")} ({organicGrowthPct}%)</span>
                            <HelpTip text={getAnalyzerHint("organicGrowthPct", t("analyzer.fieldHelp.organicGrowthPct"))} />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={40}
                            step={1}
                            value={organicGrowthPct}
                            onChange={(e) => setOrganicGrowthPct(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.viralCoefficient")}</span>
                            <HelpTip text={getAnalyzerHint("viralCoefficient", t("analyzer.fieldHelp.viralCoefficient"))} />
                          </div>
                          <MoneyInput value={viralCoefficient} onChange={setViralCoefficient} placeholder="0" />
                        </div>
                      </div>

                      {stage === "series_b" || stage === "growth" || stage === "exit" ? (
                        <div className="mt-2 rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="text-white font-semibold mb-1">Метрики зрелого бизнеса (опционально)</div>
                          <div className="text-xs text-gray-400 mb-4">
                            Для поздних стадий эти поля существенно влияют на уверенность в оценке (качество роста и риск концентрации).
                          </div>

                          <div>
                            <div className="text-xs text-gray-400 mb-2 flex items-center">
                              <span>NRR (Net Revenue Retention): {nrrPct}%</span>
                              <HelpTip text={getAnalyzerHint("nrrPct")} />
                            </div>
                            <input type="range" min={0} max={160} step={1} value={nrrPct} onChange={(e) => setNrrPct(Number(e.target.value))} className="w-full" />
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-400 mb-2 flex items-center">
                                <span>Доля выручки топ‑клиента: {topCustomerSharePct}%</span>
                                <HelpTip text={getAnalyzerHint("topCustomerSharePct")} />
                              </div>
                              <input type="range" min={0} max={100} step={1} value={topCustomerSharePct} onChange={(e) => setTopCustomerSharePct(Number(e.target.value))} className="w-full" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-2 flex items-center">
                                <span>Концентрация выручки (оценка): {revenueConcentrationPct}%</span>
                                <HelpTip text={getAnalyzerHint("revenueConcentrationPct")} />
                              </div>
                              <input type="range" min={0} max={100} step={1} value={revenueConcentrationPct} onChange={(e) => setRevenueConcentrationPct(Number(e.target.value))} className="w-full" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.burnMonthly")}</span>
                            <HelpTip text={getAnalyzerHint("burnMonthly", t("analyzer.fieldHelp.burnMonthly"))} />
                          </div>
                          <MoneyInput value={burnMonthly} onChange={setBurnMonthly} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.cashOnHand")}</span>
                            <HelpTip text={getAnalyzerHint("cashOnHand", t("analyzer.fieldHelp.cashOnHand"))} />
                          </div>
                          <MoneyInput value={cashOnHand} onChange={setCashOnHand} placeholder="0" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.releasesPerMonth")}</span>
                            <HelpTip text={getAnalyzerHint("releasesPerMonth", t("analyzer.fieldHelp.releasesPerMonth"))} />
                          </div>
                          <MoneyInput value={releasesPerMonth} onChange={setReleasesPerMonth} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.teamSize")}</span>
                            <HelpTip text={getAnalyzerHint("teamSize", t("analyzer.fieldHelp.teamSize"))} />
                          </div>
                          <MoneyInput value={teamSize} onChange={setTeamSize} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.foundersFullTime")}</span>
                            <HelpTip text={getAnalyzerHint("foundersFullTime", t("analyzer.fieldHelp.foundersFullTime"))} />
                          </div>
                          <select
                            className="w-full bg-[#1A1A24] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white"
                            value={foundersFullTime}
                            onChange={(e) => setFoundersFullTime(e.target.value as "yes" | "no")}
                          >
                            <option value="yes">Да</option>
                            <option value="no">Нет</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.tam")}</span>
                            <HelpTip text={getAnalyzerHint("tam", t("analyzer.fieldHelp.tam"))} />
                          </div>
                          <MoneyInput value={tam} onChange={setTam} placeholder="0" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.tamGrowthPct")} ({tamGrowthPct}%)</span>
                            <HelpTip text={getAnalyzerHint("tamGrowthPct", t("analyzer.fieldHelp.tamGrowthPct"))} />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={30}
                            step={1}
                            value={tamGrowthPct}
                            onChange={(e) => setTamGrowthPct(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-2 flex items-center">
                            <span>{t("analyzer.fields.competitionDensity")} ({competitionDensityPct}%)</span>
                            <HelpTip text={getAnalyzerHint("competitionDensity", t("analyzer.fieldHelp.competitionDensity"))} />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={competitionDensityPct}
                            onChange={(e) => setCompetitionDensityPct(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span>{t("analyzer.fields.regulatory")}</span>
                          <HelpTip text={getAnalyzerHint("regulatoryRisk", t("analyzer.fieldHelp.regulatory"))} />
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
                          <HelpTip text={getAnalyzerHint("techRisk", t("analyzer.fieldHelp.tech"))} />
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
                        <Button
                          type="button"
                          className="h-11 px-6"
                          onClick={() => {
                            if (step === 0 && !me) {
                              router.push(`/login?returnTo=${encodeURIComponent("/startup-analyzer")}`);
                              return;
                            }
                            setStep((s) => Math.min(3, s + 1));
                          }}
                        >
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
                <div className="text-sm text-gray-400">После запуска анализа откроется экран Investment Intelligence.</div>
              )}
            </div>
          </div>
      </div>
      </div>
      ) : report && narrative ? (
        <AnalyzerIntelligenceDashboard
          report={report}
          analysisInput={analysisInput}
          narrative={narrative}
          scores={scores}
          radarLabels={[
            t("analyzer.report.labels.growth"),
            t("analyzer.report.labels.unit"),
            t("analyzer.report.labels.pmf"),
            t("analyzer.report.labels.efficiency"),
            t("analyzer.report.labels.market"),
            t("analyzer.report.labels.risk"),
          ]}
          riskLevelLabel={riskLevel ?? "—"}
          t={t}
          me={me}
          saving={saving}
          saved={saved}
          onBackToParams={backToAnalyzer}
          onSave={() => void onSave()}
          onEnsureSavedAndGo={(target) => void ensureSavedAndGo(target)}
        />
      ) : null}

      <div className="ia-container mt-16">
        <h2 className="mb-8 text-xl font-semibold tracking-tight text-white sm:text-2xl">История анализов</h2>
        {!me ? (
          <div className="ia-card ia-w-12 text-sm text-[rgba(234,240,255,0.72)]">{t("analyzer.historyLogin")}</div>
        ) : historyLoading ? (
          <div className="ia-small">{t("analyzer.historyLoading")}</div>
        ) : history.length === 0 ? (
          <div className="ia-small">{t("analyzer.historyEmpty")}</div>
        ) : (
          <div className="ia-grid">
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
                <div key={item.id} className="ia-card ia-w-4 transition hover:-translate-y-1">
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


