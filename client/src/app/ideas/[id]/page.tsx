"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { RadarChart } from "@/components/analyzer/RadarChart";
import { CashflowBars } from "@/components/analyzer/CashflowBars";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { ideaHeroGradientClass, type IdeaProfileExtra } from "@/lib/marketplaceExtras";

type IdeaDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
  format: string;
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
  problem: string | null;
  solution: string | null;
  market: string | null;
  profileExtra?: IdeaProfileExtra | null;
};

type Me = { id: string; role: "user" | "admin" };

export default function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { lang } = useI18n();
  const { id } = useReact(params);
  const [me, setMe] = useState<Me | null>(null);
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);

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
        const r = await fetch(`/api/v1/ideas/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("detail_not_ok");
        const data = (await r.json()) as IdeaDetail;
        if (!cancelled) setIdea(data);
      } catch {
        // Fallback: try to find the entity in list endpoint.
        try {
          const listR = await fetch(`/api/v1/ideas`, { cache: "no-store" });
          if (!listR.ok) throw new Error("list");
          const list = (await listR.json()) as IdeaDetail[];
          const found = list.find((x) => x.id === id) ?? null;
          if (!cancelled) setIdea(found);
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
          data.some((f: any) => f.type === "idea" && f.idea?.id === id);
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
    if (!idea) return null;
    return (
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-3xl bg-white/5 border border-[rgba(255,255,255,0.12)] overflow-hidden">
          {idea.owner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={idea.owner.avatarUrl} alt={idea.owner.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <Link
            href={`/users/${idea.owner.id}`}
            className="text-sm font-semibold text-white hover:text-[var(--accent)]"
          >
            {idea.owner.name}
          </Link>
          <div className="text-xs text-[rgba(234,240,255,0.72)]">Рейтинг: {idea.owner.rating.toFixed(1)}</div>
        </div>
      </div>
    );
  }, [idea]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/marketplace?tab=ideas" className="text-sm text-gray-400 transition hover:text-white">
            ← Назад в маркетплейс
          </Link>
          <div className="flex items-center gap-2">
            {me && idea && (me.role === "admin" || me.id === idea.owner.id) ? (
              <Link href={`/ideas/${id}/edit`}>
                <Button variant="secondary" className="h-10">
                  Редактировать
                </Button>
              </Link>
            ) : null}
            {me && idea && (me.role === "admin" || me.id === idea.owner.id) ? (
              <DeleteResourceButton
                apiUrl={`/api/v1/ideas/${id}`}
                onDeleted={() => router.push("/marketplace?tab=ideas")}
              />
            ) : null}
            {me ? (
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-2xl border border-white/15"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const next = !favorited;
                    const r = await fetch("/api/v1/favorites/toggle", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ type: "idea", id }),
                    });
                    if (!r.ok) return;
                    setFavorited(next);
                  } catch {
                    // ignore
                  }
                }}
              >
                <span className={favorited ? "text-[var(--accent-strong)]" : "text-gray-400"}>
                  {favorited ? "♥" : "♡"}
                </span>
              </Button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400">Загрузка…</div>
        ) : dbError ? (
          <div className="text-gray-400">База данных недоступна.</div>
        ) : !idea ? (
          <div className="text-gray-400">Идея не найдена.</div>
        ) : (
          <>
            <div
              className={[
                "relative mb-12 h-80 overflow-hidden rounded-3xl bg-gradient-to-br",
                ideaHeroGradientClass(idea.profileExtra?.coverGradient),
              ].join(" ")}
            >
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <span className="rounded-3xl bg-white/20 px-5 py-2 text-sm backdrop-blur-md">Идея</span>
                <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">{idea.title}</h1>
              </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-12">
              <div className="space-y-12 lg:col-span-8">
                <div>
                  <h2 className="mb-6 text-3xl font-semibold">Описание идеи</h2>
                  <p className="text-lg leading-relaxed text-gray-300">{idea.description}</p>
                </div>

                <div>
                  <h2 className="mb-6 text-3xl font-semibold">Что уже сделано</h2>
                  {(() => {
                    const done = idea.profileExtra?.doneItems?.filter(Boolean) ?? [];
                    const fallback = idea.solution?.trim()
                      ? idea.solution
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [];
                    const items = done.length ? done : fallback;
                    if (!items.length) {
                      return <p className="text-gray-400">Пока не заполнено — можно добавить при редактировании.</p>;
                    }
                    return (
                      <ul className="space-y-4 text-gray-300">
                        {items.map((line) => (
                          <li key={line} className="flex gap-3">
                            <span className="text-emerald-400">✓</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>

                <div>
                  <h2 className="mb-6 text-3xl font-semibold">Что нужно для реализации</h2>
                  <p className="text-lg leading-relaxed text-gray-300">
                    {idea.profileExtra?.needsText?.trim() || idea.problem?.trim() || "—"}
                  </p>
                </div>

                {idea.solution || idea.market ? (
                  <div className="rounded-3xl border border-white/10 bg-[#12121A] p-6">
                    <div className="text-sm font-semibold text-white">Дополнительно</div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {idea.solution ? (
                        <div>
                          <div className="text-xs text-gray-400">Решение</div>
                          <div className="mt-2 text-sm leading-relaxed text-gray-300">{idea.solution}</div>
                        </div>
                      ) : null}
                      {idea.market ? (
                        <div>
                          <div className="text-xs text-gray-400">Рынок</div>
                          <div className="mt-2 text-sm leading-relaxed text-gray-300">{idea.market}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-4">
                <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#12121A] p-8">
                  <h3 className="mb-6 text-xl font-semibold">Информация об идее</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-gray-400">Автор</div>
                      <div className="mt-1 font-medium">{idea.owner.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Город</div>
                      <div className="mt-1 font-medium">{idea.profileExtra?.city?.trim() || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Стадия</div>
                      <div className="mt-1 font-medium text-amber-400">{stageLabelsByLang[lang]?.[idea.stage] ?? idea.stage}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Формат</div>
                      <div className="mt-1 font-medium">{formatLabelsByLang[lang]?.[idea.format] ?? idea.format}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Ориентир цены</div>
                      <div className="mt-1 font-medium">{idea.price.toLocaleString("ru-RU")} ₽</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Нужна помощь</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(idea.profileExtra?.helpTags?.length ? idea.profileExtra.helpTags : [idea.category]).map((t) => (
                          <span key={t} className="rounded-2xl bg-white/10 px-4 py-1 text-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-6">{ownerBlock}</div>
                  <Button
                    type="button"
                    className="mt-10 w-full rounded-3xl bg-gradient-to-r from-violet-600 to-rose-500 py-5 text-base font-semibold hover:brightness-110"
                  >
                    Связаться с автором
                  </Button>
                </div>
              </div>
            </div>

            {idea.analysis ? (
            <div className="mt-12 rounded-3xl border border-[rgba(175,110,255,0.25)] bg-[rgba(175,110,255,0.07)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Отчёт анализатора</div>
                  <div className="mt-1 text-xs text-[rgba(234,240,255,0.72)]">
                    {new Date(idea.analysis.createdAt).toLocaleString("ru-RU")}
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
                    {idea.analysis.result?.successProbability != null
                      ? `${Math.round(Number(idea.analysis.result.successProbability) * 100)}%`
                      : "—"}
                  </div>
                </div>
                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">Риск</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {idea.analysis.result?.riskAvg != null
                      ? `${Math.round(Number(idea.analysis.result.riskAvg))}/100`
                      : "—"}
                  </div>
                </div>
                <div className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.10)]">
                  <div className="text-xs text-[rgba(234,240,255,0.72)]">Оценка (диапазон)</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {idea.analysis.result?.valuationLow != null && idea.analysis.result?.valuationHigh != null
                      ? `${Math.round(Number(idea.analysis.result.valuationLow)).toLocaleString("ru-RU")} ₽ – ${Math.round(
                          Number(idea.analysis.result.valuationHigh),
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
                          idea.analysis.result?.marketRisk != null
                            ? clamp(100 - Number(idea.analysis.result.marketRisk), 0, 100)
                            : 60,
                          idea.analysis.result?.unitEconomicsScore != null
                            ? clamp(Number(idea.analysis.result.unitEconomicsScore), 0, 100)
                            : 60,
                          idea.analysis.result?.tractionScore != null
                            ? clamp(Number(idea.analysis.result.tractionScore), 0, 100)
                            : 60,
                          idea.analysis.result?.teamMoatScore != null
                            ? clamp(Number(idea.analysis.result.teamMoatScore), 0, 100)
                            : 60,
                          idea.analysis.result?.financialScore != null
                            ? clamp(Number(idea.analysis.result.financialScore), 0, 100)
                            : 60,
                          idea.analysis.result?.riskAvg != null ? clamp(100 - Number(idea.analysis.result.riskAvg), 0, 100) : 60,
                        ]}
                      />
                    </div>

                    {Array.isArray(idea.analysis.result?.yearCashflows) ? (
                      <div className="mt-6">
                        <div className="text-sm font-semibold text-white">Денежные потоки (5 лет)</div>
                        <div className="mt-3">
                          <CashflowBars values={idea.analysis.result.yearCashflows.map((x: any) => Number(x) || 0)} />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="lg:col-span-3">
                    <div className="text-sm font-semibold text-white">Разбор риска</div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {(
                        [
                          { key: "market", label: "Рынок", v: idea.analysis.result?.marketRisk },
                          { key: "competition", label: "Конкуренция", v: idea.analysis.result?.competitionRisk },
                          { key: "execution", label: "Исполнение/команда", v: idea.analysis.result?.executionRisk },
                          { key: "financial", label: "Финансовая устойчивость", v: idea.analysis.result?.financialRisk },
                          { key: "regulatory", label: "Регуляторные риски", v: idea.analysis.result?.regulatoryRisk },
                          { key: "tech", label: "Технологические риски", v: idea.analysis.result?.techRisk },
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

            {idea.attachments && idea.attachments.length ? (
              <div className="mt-12">
                <h2 className="mb-4 text-2xl font-semibold">Файлы</h2>
                <div className="grid grid-cols-1 gap-2">
                  {idea.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-3xl border border-white/10 bg-[#12121A] p-4 text-sm text-white/90 transition hover:border-violet-500/40"
                    >
                      {a.filename}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

