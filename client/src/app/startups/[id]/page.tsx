"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { RadarChart } from "@/components/analyzer/RadarChart";
import { CashflowBars } from "@/components/analyzer/CashflowBars";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";

type StartupProfileExtra = {
  tagline?: string;
  valuationPreMoney?: number;
  equityOfferedPct?: number;
  kpis?: { value?: string; label?: string }[];
  milestones?: string;
  team?: { name: string; role: string }[];
  videoPitchUrl?: string;
};

type StartupDetail = {
  id: string;
  title: string;
  description: string;
  profileExtra?: StartupProfileExtra | null;
  category: string;
  price: number;
  stage: string;
  format: string;
  isOnline: boolean;
  analysisId?: string | null;
  analysis?: null | { id: string; createdAt: string; result: any };
  attachments?: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
  }>;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
  };
  auction: null | { currentPrice: number; endsAt: string };
};

type Me = { id: string; role: "user" | "admin" };

export default function StartupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { lang } = useI18n();
  const { id } = useReact(params);
  const [me, setMe] = useState<Me | null>(null);
  const [startup, setStartup] = useState<StartupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [creatingAuction, setCreatingAuction] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [auctionStartDate, setAuctionStartDate] = useState("");
  const [auctionStartTime, setAuctionStartTime] = useState("18:00");
  const [auctionRegEndDate, setAuctionRegEndDate] = useState("");
  const [auctionRegEndTime, setAuctionRegEndTime] = useState("17:30");
  const [auctionStartPrice, setAuctionStartPrice] = useState("");
  const [auctionErr, setAuctionErr] = useState<string | null>(null);

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const m = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (m.ok) {
          const data = (await m.json()) as Me;
          if (!cancelled) setMe(data);
        }
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
    async function run() {
      setLoading(true);
      setDbError(false);
      try {
        const r = await fetch(`/api/v1/startups/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("detail_not_ok");
        const data = (await r.json()) as StartupDetail;
        if (!cancelled) setStartup(data);
      } catch {
        // Fallback: try to find the entity in list endpoint.
        // This avoids "not found" when detail endpoints aren't available/consistent.
        try {
          const listR = await fetch(`/api/v1/startups`, { cache: "no-store" });
          if (!listR.ok) throw new Error("list");
          const list = (await listR.json()) as StartupDetail[];
          const found = list.find((x) => x.id === id) ?? null;
          if (!cancelled) setStartup(found);
        } catch {
          if (!cancelled) setDbError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/favorites", { credentials: "include" });
        if (!r.ok) return;
        const data = await r.json();
        const isFav =
          Array.isArray(data) &&
          data.some((f: any) => f.type === "startup" && f.startup?.id === id);
        if (!cancelled) setFavorited(isFav);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [me, id]);

  const ownerBlock = useMemo(() => {
    if (!startup) return null;
    return (
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-3xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
          {startup.owner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={startup.owner.avatarUrl} alt={startup.owner.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <Link
            href={`/users/${startup.owner.id}`}
            className="text-sm font-semibold text-white hover:text-[var(--accent)]"
          >
            {startup.owner.name}
          </Link>
          <div className="text-xs text-[rgba(234,240,255,0.72)]">Рейтинг: {startup.owner.rating.toFixed(1)}</div>
        </div>
      </div>
    );
  }, [startup]);

  function heroGradient(cat: string) {
    const c = (cat || "").toLowerCase();
    if (c.includes("ai") || c.includes("ии")) return "from-violet-600 via-fuchsia-600 to-rose-500";
    return "from-violet-600 via-fuchsia-600 to-rose-500";
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/marketplace?tab=startups" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад к стартапам
        </Link>
        <div className="flex items-center gap-2">
          {me && startup && me.id === startup.owner.id && !startup.auction ? (
            <Button
              variant="secondary"
              className="h-10"
              disabled={creatingAuction}
              onClick={() => {
                setAuctionErr(null);
                setShowAuctionForm((v) => !v);
                if (!showAuctionForm) {
                  const base = startup.price.toLocaleString("ru-RU");
                  if (!auctionStartPrice) setAuctionStartPrice(String(startup.price));
                  void base;
                }
              }}
            >
              {showAuctionForm ? "Скрыть" : "Создать аукцион"}
            </Button>
          ) : null}
          {me && startup && (me.role === "admin" || me.id === startup.owner.id) ? (
            <Link href={`/startups/${id}/edit`}>
              <Button variant="secondary" className="h-10">
                Редактировать
              </Button>
            </Link>
          ) : null}
          {me && startup && (me.role === "admin" || me.id === startup.owner.id) ? (
            <DeleteResourceButton
              apiUrl={`/api/v1/startups/${id}`}
              onDeleted={() => router.push("/marketplace?tab=startups")}
            />
          ) : null}
          {me ? (
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-2xl border border-[rgba(255,255,255,0.16)]"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const next = !favorited;
                  const r = await fetch("/api/v1/favorites/toggle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ type: "startup", id }),
                  });
                  if (!r.ok) return;
                  setFavorited(next);
                } catch {
                  // ignore
                }
              }}
            >
              <span className={favorited ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"}>
                {favorited ? "♥" : "♡"}
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      {me && startup && me.id === startup.owner.id && !startup.auction && showAuctionForm ? (
        <Card className="p-5 mb-6">
          <div className="text-sm font-semibold text-white">Новый аукцион</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Старт</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  value={auctionStartDate}
                  onChange={(e) => setAuctionStartDate(e.target.value)}
                  type="date"
                  className="h-11 w-full rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 text-sm text-white"
                />
                <input
                  value={auctionStartTime}
                  onChange={(e) => setAuctionStartTime(e.target.value)}
                  inputMode="numeric"
                  placeholder="18:00"
                  className="h-11 w-full rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 text-sm text-white placeholder:text-[rgba(234,240,255,0.35)]"
                />
              </div>
              <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.5)]">Время: HH:MM (24 часа)</div>
            </div>

            <div>
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Регистрация до</div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  value={auctionRegEndDate}
                  onChange={(e) => setAuctionRegEndDate(e.target.value)}
                  type="date"
                  className="h-11 w-full rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 text-sm text-white"
                />
                <input
                  value={auctionRegEndTime}
                  onChange={(e) => setAuctionRegEndTime(e.target.value)}
                  inputMode="numeric"
                  placeholder="17:30"
                  className="h-11 w-full rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 text-sm text-white placeholder:text-[rgba(234,240,255,0.35)]"
                />
              </div>
              <div className="mt-1 text-[10px] text-[rgba(234,240,255,0.5)]">Время: HH:MM (24 часа)</div>
            </div>

            <div>
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Стартовая цена (₽)</div>
              <input
                value={auctionStartPrice}
                onChange={(e) => setAuctionStartPrice(e.target.value)}
                inputMode="numeric"
                placeholder="1000"
                className="mt-1 h-11 w-full rounded-2xl bg-white/[0.06] border border-[rgba(255,255,255,0.12)] px-3 text-sm text-white placeholder:text-[rgba(234,240,255,0.35)]"
              />
            </div>
          </div>

          {auctionErr ? <div className="mt-3 text-sm text-[rgba(255,160,160,0.95)]">{auctionErr}</div> : null}

          <div className="mt-4 flex items-center gap-3">
            <Button
              className="h-11"
              disabled={creatingAuction}
              onClick={async () => {
                function parseTime24(s: string) {
                  const m = s.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
                  if (!m) return null;
                  return { hh: Number(m[1]), mm: Number(m[2]) };
                }
                function buildLocalDateTime(dateStr: string, timeStr: string) {
                  if (!dateStr) return null;
                  const t = parseTime24(timeStr);
                  if (!t) return null;
                  const [y, mo, d] = dateStr.split("-").map((x) => Number(x));
                  if (!y || !mo || !d) return null;
                  const dt = new Date(y, mo - 1, d, t.hh, t.mm, 0, 0);
                  return Number.isFinite(dt.getTime()) ? dt : null;
                }

                const startsAt = buildLocalDateTime(auctionStartDate, auctionStartTime);
                const registrationEndsAt = buildLocalDateTime(auctionRegEndDate, auctionRegEndTime);
                const startPrice = Number(String(auctionStartPrice).replace(/\s/g, "").replace(",", "."));

                if (!startsAt) return setAuctionErr("Выберите дату старта и введите время в формате HH:MM (24 часа).");
                if (!registrationEndsAt)
                  return setAuctionErr("Выберите дату окончания регистрации и введите время в формате HH:MM (24 часа).");
                if (!Number.isFinite(startPrice) || startPrice <= 0) return setAuctionErr("Введите корректную стартовую цену.");
                setAuctionErr(null);

                setCreatingAuction(true);
                try {
                  const r = await fetch(`/api/v1/startups/${id}/auction`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      startsAt: startsAt.toISOString(),
                      registrationEndsAt: registrationEndsAt.toISOString(),
                      startPrice,
                    }),
                  });
                  if (!r.ok) {
                    const j = await r.json().catch(() => null);
                    setAuctionErr(j?.error ?? "Не удалось создать аукцион. Проверьте времена.");
                    return;
                  }
                  router.push("/auction");
                } finally {
                  setCreatingAuction(false);
                }
              }}
            >
              Создать
            </Button>
            <Button variant="ghost" className="h-11" onClick={() => setShowAuctionForm(false)}>
              Отмена
            </Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div className="text-[rgba(234,240,255,0.72)]">Загрузка…</div>
      ) : dbError ? (
        <div className="text-[rgba(234,240,255,0.72)]">База данных недоступна.</div>
      ) : !startup ? (
        <div className="text-[rgba(234,240,255,0.72)]">Стартап не найден.</div>
      ) : (
        <div>
          <div
            className={`relative mb-12 h-[min(460px,70vh)] overflow-hidden rounded-3xl bg-gradient-to-br ${heroGradient(startup.category)}`}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-3xl bg-white/20 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
                  {startup.category}
                </span>
                <span className="rounded-3xl bg-emerald-500/80 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
                  {stageLabelsByLang[lang]?.[startup.stage] ?? startup.stage}
                </span>
                {startup.auction ? (
                  <span className="rounded-3xl bg-rose-500/80 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
                    Аукцион
                  </span>
                ) : null}
              </div>
              <h1 className="text-4xl font-bold leading-none tracking-tighter text-white md:text-6xl">{startup.title}</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-2xl">
                {startup.profileExtra?.tagline?.trim()
                  ? startup.profileExtra.tagline
                  : startup.description.length > 160
                    ? `${startup.description.slice(0, 160)}…`
                    : startup.description}
              </p>
            </div>
            <div className="absolute right-6 top-6 rounded-3xl bg-black/70 px-6 py-4 text-center backdrop-blur-xl md:right-10 md:top-10">
              <div className="text-sm font-medium text-emerald-400">
                {startup.isOnline ? "Онлайн" : "Офлайн"} · {formatLabelsByLang[lang]?.[startup.format] ?? startup.format}
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">{startup.price.toLocaleString("ru-RU")} ₽</div>
              <div className="text-xs text-gray-400">цель привлечения</div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              <div>
                <h2 className="mb-6 text-3xl font-semibold text-white">О проекте</h2>
                <p className="text-lg leading-relaxed text-gray-300">{startup.description}</p>
              </div>

              {startup.profileExtra &&
              (startup.profileExtra.valuationPreMoney != null ||
                startup.profileExtra.equityOfferedPct != null) ? (
                <div>
                  <h2 className="mb-4 text-2xl font-semibold text-white">Инвестиционные условия</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {startup.profileExtra.valuationPreMoney != null ? (
                      <div className="rounded-2xl border border-white/10 bg-[#1A1A24] p-5">
                        <div className="text-xs text-gray-500">Оценка (pre-money)</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {Math.round(Number(startup.profileExtra.valuationPreMoney)).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    ) : null}
                    {startup.profileExtra.equityOfferedPct != null ? (
                      <div className="rounded-2xl border border-white/10 bg-[#1A1A24] p-5">
                        <div className="text-xs text-gray-500">Доля к инвестору</div>
                        <div className="mt-1 text-lg font-semibold text-rose-300">
                          {Math.round(Number(startup.profileExtra.equityOfferedPct))}%
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {startup.profileExtra?.kpis?.length ? (
                <div>
                  <h2 className="mb-4 text-2xl font-semibold text-white">Ключевые показатели</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {startup.profileExtra.kpis.map((k, i) =>
                      k.value || k.label ? (
                        <div key={i} className="rounded-2xl border border-white/10 bg-[#1A1A24] p-4">
                          <div className="text-lg font-semibold text-white">{k.value || "—"}</div>
                          <div className="mt-1 text-sm text-gray-400">{k.label || ""}</div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null}

              {startup.profileExtra?.milestones?.trim() ? (
                <div>
                  <h2 className="mb-4 text-2xl font-semibold text-white">Что уже сделано</h2>
                  <p className="text-lg leading-relaxed text-gray-300">{startup.profileExtra.milestones}</p>
                </div>
              ) : null}

              {startup.profileExtra?.team?.length ? (
                <div>
                  <h2 className="mb-4 text-2xl font-semibold text-white">Команда</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {startup.profileExtra.team.map((m, i) => (
                      <div key={i} className="rounded-2xl border border-white/10 bg-[#1A1A24] px-4 py-3">
                        <div className="font-medium text-white">{m.name}</div>
                        <div className="text-sm text-gray-400">{m.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {startup.profileExtra?.videoPitchUrl?.trim() ? (
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-white">Видео-питч</h2>
                  <a
                    href={startup.profileExtra.videoPitchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] hover:text-white"
                  >
                    {startup.profileExtra.videoPitchUrl}
                  </a>
                </div>
              ) : null}

          {startup.analysis ? (
            <div className="rounded-3xl border border-[rgba(175,110,255,0.25)] bg-[rgba(175,110,255,0.07)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Отчёт анализатора</div>
                  <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
                    {new Date(startup.analysis.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10"
                    onClick={() => setAnalysisExpanded((v) => !v)}
                  >
                    {analysisExpanded ? "Свернуть полный отчёт" : "Показать полный отчёт"}
                  </Button>
                  <Link
                    href="/startup-analyzer"
                    className="text-[var(--accent)] hover:text-white text-sm font-medium"
                  >
                    Открыть анализатор
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">Вероятность успеха</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {startup.analysis.result?.successProbability != null
                      ? `${Math.round(Number(startup.analysis.result.successProbability) * 100)}%`
                      : "—"}
                  </div>
                </div>
                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">Риск</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {startup.analysis.result?.riskAvg != null
                      ? `${Math.round(Number(startup.analysis.result.riskAvg))}/100`
                      : "—"}
                  </div>
                </div>
                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">Оценка (диапазон)</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {startup.analysis.result?.valuationLow != null && startup.analysis.result?.valuationHigh != null
                      ? `${Math.round(Number(startup.analysis.result.valuationLow)).toLocaleString("ru-RU")} ₽ – ${Math.round(
                          Number(startup.analysis.result.valuationHigh),
                        ).toLocaleString("ru-RU")} ₽`
                      : "—"}
                  </div>
                </div>
              </div>

              {analysisExpanded ? (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2">
                    <div className="text-sm font-semibold text-white">Визуализация</div>
                    <div className="mt-3">
                      <RadarChart
                        labels={["Рынок", "Unit", "Тяга", "Команда", "Финансы", "Риски"]}
                        values={[
                          startup.analysis.result?.marketRisk != null
                            ? clamp(100 - Number(startup.analysis.result.marketRisk), 0, 100)
                            : 60,
                          startup.analysis.result?.unitEconomicsScore != null
                            ? clamp(Number(startup.analysis.result.unitEconomicsScore), 0, 100)
                            : 60,
                          startup.analysis.result?.tractionScore != null
                            ? clamp(Number(startup.analysis.result.tractionScore), 0, 100)
                            : 60,
                          startup.analysis.result?.teamMoatScore != null
                            ? clamp(Number(startup.analysis.result.teamMoatScore), 0, 100)
                            : 60,
                          startup.analysis.result?.financialScore != null
                            ? clamp(Number(startup.analysis.result.financialScore), 0, 100)
                            : 60,
                          startup.analysis.result?.riskAvg != null
                            ? clamp(100 - Number(startup.analysis.result.riskAvg), 0, 100)
                            : 60,
                        ]}
                      />
                    </div>

                    {Array.isArray(startup.analysis.result?.yearCashflows) ? (
                      <div className="mt-6">
                        <div className="text-sm font-semibold text-white">Денежные потоки (5 лет)</div>
                        <div className="mt-3">
                          <CashflowBars values={startup.analysis.result.yearCashflows.map((x: any) => Number(x) || 0)} />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="lg:col-span-3">
                    <div className="text-sm font-semibold text-white">Разбор риска</div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {(
                        [
                          { key: "market", label: "Рынок", v: startup.analysis.result?.marketRisk },
                          { key: "competition", label: "Конкуренция", v: startup.analysis.result?.competitionRisk },
                          { key: "execution", label: "Исполнение/команда", v: startup.analysis.result?.executionRisk },
                          { key: "financial", label: "Финансовая устойчивость", v: startup.analysis.result?.financialRisk },
                          { key: "regulatory", label: "Регуляторные риски", v: startup.analysis.result?.regulatoryRisk },
                          { key: "tech", label: "Технологические риски", v: startup.analysis.result?.techRisk },
                        ] as const
                      ).map((r) => {
                        const value = r.v != null ? clamp(Number(r.v), 0, 100) : null;
                        return (
                          <div key={r.key} className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-white">{r.label}</div>
                              <div className="text-xs text-[rgba(234,240,255,0.72)]">{value == null ? "—" : `${Math.round(value)}/100`}</div>
                            </div>
                            <div className="mt-3 h-3 rounded-full bg-white/5 overflow-hidden border border-[rgba(255,255,255,0.10)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${value == null ? 0 : Math.round(value)}%`,
                                  background:
                                    "linear-gradient(90deg, rgba(175,110,255,0.90), rgba(61,123,255,0.95))",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {startup.auction ? (
            <div className="rounded-3xl border border-[rgba(110,168,255,0.25)] bg-[rgba(110,168,255,0.08)] p-5">
              <div className="text-sm font-semibold text-white">Аукцион</div>
              <div className="mt-2 text-[rgba(234,240,255,0.72)]">
                Текущая цена:{" "}
                <b className="text-white">{startup.auction.currentPrice.toLocaleString("ru-RU")} ₽</b>
              </div>
              <div className="mt-1 text-[rgba(234,240,255,0.72)]">
                Окончание: {new Date(startup.auction.endsAt).toLocaleString("ru-RU")}
              </div>
              <div className="mt-3 text-xs text-[rgba(234,240,255,0.72)]">
                Ставки появятся в следующем шаге.
              </div>
            </div>
          ) : null}

          {(startup.attachments && startup.attachments.length > 0) || startup.analysis ? (
            <div>
              <h2 className="mb-6 text-3xl font-semibold text-white">Материалы</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {startup.attachments?.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="upload-box flex min-h-[120px] flex-col justify-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.18)] bg-[#1A1A24] p-5 text-white transition hover:border-[rgba(110,168,255,0.45)]"
                  >
                    <div className="text-xs uppercase tracking-wide text-[rgba(234,240,255,0.55)]">Файл</div>
                    <div className="mt-2 text-sm font-semibold text-white/95">{a.filename}</div>
                    <div className="mt-2 text-xs text-[var(--accent)]">Скачать →</div>
                  </a>
                ))}
                {startup.analysis ? (
                  <button
                    type="button"
                    onClick={() => setAnalysisExpanded(true)}
                    className="upload-box flex min-h-[120px] flex-col justify-center rounded-2xl border border-dashed border-[rgba(175,110,255,0.35)] bg-[#1A1A24] p-5 text-left text-white transition hover:border-[rgba(175,110,255,0.55)]"
                  >
                    <div className="text-xs uppercase tracking-wide text-[rgba(234,240,255,0.55)]">Отчёт анализатора</div>
                    <div className="mt-2 text-sm font-semibold text-white/95">
                      {startup.analysis.result?.successProbability != null
                        ? `Вероятность успеха: ${Math.round(Number(startup.analysis.result.successProbability) * 100)}%`
                        : "Результат анализа"}
                    </div>
                    <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
                      {new Date(startup.analysis.createdAt).toLocaleString("ru-RU")}
                    </div>
                    <div className="mt-2 text-xs text-[var(--accent)]">Развернуть отчёт ↑</div>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-[calc(var(--site-header-height)+1.5rem)] rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[#12121A] p-8">
                <div className="text-xs font-medium uppercase tracking-wide text-[rgba(234,240,255,0.55)]">Инвестиции</div>
                <div className="mt-2 text-4xl font-semibold text-white">{startup.price.toLocaleString("ru-RU")} ₽</div>
                <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)]">цель привлечения</div>
                <div className="mt-6 space-y-2 border-t border-white/10 pt-6 text-sm text-[rgba(234,240,255,0.85)]">
                  <div className="flex justify-between gap-3">
                    <span className="text-[rgba(234,240,255,0.55)]">Стадия</span>
                    <span className="font-medium text-white">{stageLabelsByLang[lang]?.[startup.stage] ?? startup.stage}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[rgba(234,240,255,0.55)]">Формат</span>
                    <span className="font-medium text-white">{formatLabelsByLang[lang]?.[startup.format] ?? startup.format}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[rgba(234,240,255,0.55)]">Локация</span>
                    <span className="font-medium text-white">
                      {startup.isOnline ? formatLabelsByLang[lang]?.online : formatLabelsByLang[lang]?.offline}
                    </span>
                  </div>
                </div>
                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="text-xs font-medium uppercase tracking-wide text-[rgba(234,240,255,0.55)]">Основатель</div>
                  <div className="mt-3">{ownerBlock}</div>
                </div>
                <Link
                  href={`/users/${startup.owner.id}`}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Связаться
                </Link>
                <Link href="/startup-analyzer" className="mt-3 block text-center text-sm text-[var(--accent)] hover:text-white">
                  Открыть анализатор
                </Link>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

