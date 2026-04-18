"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { RadarChart } from "@/components/analyzer/RadarChart";
import { CashflowBars } from "@/components/analyzer/CashflowBars";
import { useI18n } from "@/i18n/I18nProvider";
import { formatLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";

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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/marketplace?tab=ideas" className="text-[var(--accent)] hover:text-white text-sm font-medium">
          ← Назад к идеям
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
                    body: JSON.stringify({ type: "idea", id }),
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

      {loading ? (
        <div className="text-[rgba(234,240,255,0.72)]">Загрузка…</div>
      ) : dbError ? (
        <div className="text-[rgba(234,240,255,0.72)]">База данных недоступна.</div>
      ) : !idea ? (
        <div className="text-[rgba(234,240,255,0.72)]">Идея не найдена.</div>
      ) : (
        <Card className="p-6 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{idea.category}</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white leading-tight">{idea.title}</h1>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)]">
                {formatLabelsByLang[lang]?.[idea.format] ?? idea.format} ·{" "}
                {stageLabelsByLang[lang]?.[idea.stage] ?? idea.stage}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[rgba(234,240,255,0.72)]">Цена</div>
              <div className="text-2xl font-semibold text-white">{idea.price.toLocaleString("ru-RU")} ₽</div>
            </div>
          </div>

          <div className="mt-6">{ownerBlock}</div>

          {idea.analysis ? (
            <div className="mt-6 rounded-3xl border border-[rgba(175,110,255,0.25)] bg-[rgba(175,110,255,0.07)] p-5">
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
            <div className="mt-6">
              <div className="text-sm font-semibold text-white">Файлы</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {idea.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="glass rounded-3xl p-4 border border-[rgba(255,255,255,0.12)] hover:border-[rgba(110,168,255,0.35)] transition text-sm text-white/90"
                  >
                    {a.filename}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <div className="text-sm font-semibold text-white">Описание</div>
            <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">{idea.description}</div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 glass rounded-3xl border border-[rgba(255,255,255,0.12)]">
              <div className="text-sm font-semibold text-white">Проблема</div>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                {idea.problem ? idea.problem : "—"}
              </div>
            </Card>
            <Card className="p-5 glass rounded-3xl border border-[rgba(255,255,255,0.12)] md:col-span-1">
              <div className="text-sm font-semibold text-white">Решение</div>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                {idea.solution ? idea.solution : "—"}
              </div>
            </Card>
            <Card className="p-5 glass rounded-3xl border border-[rgba(255,255,255,0.12)] md:col-span-1">
              <div className="text-sm font-semibold text-white">Рынок</div>
              <div className="mt-2 text-sm text-[rgba(234,240,255,0.72)] leading-relaxed">
                {idea.market ? idea.market : "—"}
              </div>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}

