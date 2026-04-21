"use client";

import React, { use as useReact, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { DeleteResourceButton } from "@/components/DeleteResourceButton";
import { formatCheckRangeRub, type InvestorProfileExtra } from "@/lib/marketplaceExtras";
import { stageLabelsByLang } from "@/lib/labelMaps";

type Me = { id: string; role: "user" | "admin" };

type InvestorDetail = {
  id: string;
  industry: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  attachments?: Array<{
    id: string;
    url: string;
    filename: string;
    mimeType: string | null;
    size: number | null;
    createdAt: string;
  }>;
  profileExtra?: InvestorProfileExtra | null;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0] ?? "?";
  const b = p[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useReact(params);
  const [me, setMe] = useState<Me | null>(null);
  const [item, setItem] = useState<InvestorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const m = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (m.ok && !c) setMe((await m.json()) as Me);
      } catch {
        // ignore
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setDbError(false);
      try {
        const r = await fetch(`/api/v1/investors/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        const data = (await r.json()) as InvestorDetail;
        if (!cancelled) setItem(data);
      } catch {
        if (!cancelled) setDbError(true);
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
    if (!me || !item) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/v1/favorites", { credentials: "include" });
        if (!r.ok) return;
        const data: unknown = await r.json();
        const isFav =
          Array.isArray(data) &&
          data.some((f) => {
            if (!f || typeof f !== "object") return false;
            const rec = f as Record<string, unknown>;
            if (rec.type !== "investor") return false;
            const inv = rec.investor;
            if (inv && typeof inv === "object") {
              const invId = (inv as Record<string, unknown>).id;
              if (invId === item.id) return true;
            }
            return rec.investorRequestId === item.id;
          });
        if (!cancelled) setFavorited(Boolean(isFav));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me, item]);

  const display = useMemo(() => {
    if (!item) return null;
    const pe = item.profileExtra ?? null;
    const name = (pe?.investorName?.trim() || item.author.name || "Инвестор").trim();
    const title = (pe?.investorTitle?.trim() || item.industry).trim();
    const check = formatCheckRangeRub(pe, item.amount);
    const stages = (pe?.stages ?? []).map((s) => stageLabelsByLang.ru?.[s] ?? s);
    const interests = pe?.interests ?? [];
    return { name, title, check, stages, interests, pe };
  }, [item]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/marketplace?tab=investors" className="text-sm text-gray-400 transition hover:text-white">
            ← Назад в маркетплейс
          </Link>
          <div className="flex items-center gap-2">
            {me && item && (me.role === "admin" || me.id === item.author.id) ? (
              <Link href={`/investors/${id}/edit`}>
                <Button variant="secondary" className="h-10">
                  Редактировать
                </Button>
              </Link>
            ) : null}
            {me && item && (me.role === "admin" || me.id === item.author.id) ? (
              <DeleteResourceButton apiUrl={`/api/v1/investors/${id}`} onDeleted={() => router.push("/marketplace?tab=investors")} />
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400">Загрузка…</div>
        ) : dbError ? (
          <div className="text-gray-400">База данных недоступна.</div>
        ) : !item || !display ? (
          <div className="text-gray-400">Профиль не найден.</div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-3xl font-bold sm:h-24 sm:w-24 sm:text-4xl">
                    {initials(display.name)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{display.name}</h1>
                    <p className="mt-1 text-lg text-emerald-400 sm:mt-2 sm:text-2xl">{display.title}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-semibold sm:mb-5 sm:text-3xl">Обо мне</h2>
                <p className="text-base leading-relaxed text-gray-300 sm:text-lg">{item.description}</p>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-semibold sm:mb-5 sm:text-3xl">Инвестиционные критерии</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl bg-[#12121A] p-6">
                    <div className="text-sm text-gray-400">Чек</div>
                    <div className="mt-2 text-xl font-semibold sm:text-2xl">{display.check}</div>
                  </div>
                  <div className="rounded-3xl bg-[#12121A] p-6">
                    <div className="text-sm text-gray-400">Стадии</div>
                    <div className="mt-2 text-xl font-semibold sm:text-2xl">{display.stages.length ? display.stages.join(" · ") : "—"}</div>
                  </div>
                  <div className="rounded-3xl bg-[#12121A] p-6">
                    <div className="text-sm text-gray-400">Количество сделок</div>
                    <div className="mt-2 text-xl font-semibold sm:text-2xl">
                      {display.pe?.dealsCount != null ? String(display.pe.dealsCount) : "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-[#12121A] p-6">
                    <div className="text-sm text-gray-400">Успешных выходов</div>
                    <div className="mt-2 text-xl font-semibold sm:text-2xl">
                      {display.pe?.exitsCount != null ? String(display.pe.exitsCount) : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {display.interests.length ? (
                <div>
                  <h2 className="mb-4 text-2xl font-semibold sm:mb-5 sm:text-3xl">Интересы</h2>
                  <div className="flex flex-wrap gap-3">
                    {display.interests.map((t) => (
                      <span key={t} className="rounded-3xl bg-white/10 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.attachments && item.attachments.length ? (
                <div>
                  <h2 className="mb-5 text-3xl font-semibold">Файлы</h2>
                  <div className="grid gap-2">
                    {item.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-3xl border border-white/10 bg-[#12121A] p-4 text-sm text-white/90 transition hover:border-emerald-500/40"
                      >
                        {a.filename}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#12121A] p-8">
                <h3 className="mb-6 text-xl font-semibold">Готов инвестировать</h3>
                <Button
                  type="button"
                  className="mb-4 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 py-6 text-lg font-semibold hover:brightness-110"
                  onClick={() => {
                    if (!item) return;
                    if (!me) {
                      router.push("/login");
                      return;
                    }
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const link = origin ? `${origin}/investors/${item.id}` : `/investors/${item.id}`;
                    const prefill = `Здравствуйте! Пишу по вашему профилю инвестора: ${link}\n`;
                    router.push(`/chat/${item.author.id}?prefill=${encodeURIComponent(prefill)}`);
                  }}
                >
                  Написать инвестору
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-3xl border border-white/30 py-6 text-base hover:bg-white/10"
                  disabled={loadingFav}
                  onClick={async () => {
                    if (!item) return;
                    if (!me) {
                      router.push("/login");
                      return;
                    }
                    setLoadingFav(true);
                    try {
                      const r = await fetch("/api/v1/favorites/toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ type: "investor", id: item.id }),
                      });
                      if (!r.ok) return;
                      const j = await r.json().catch(() => null);
                      if (j && typeof j.favorited === "boolean") setFavorited(j.favorited);
                      else setFavorited((v) => !v);
                    } finally {
                      setLoadingFav(false);
                    }
                  }}
                >
                  {favorited ? "Убрать из избранного" : "Добавить в избранное"}
                </Button>
                <div className="mt-10 text-center text-xs text-gray-500">
                  Статус: <span className="text-white/80">{item.status}</span>
                  <br />
                  Опубликовано: {new Date(item.createdAt).toLocaleString("ru-RU")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
