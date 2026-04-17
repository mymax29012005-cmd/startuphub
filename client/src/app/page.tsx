"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import type { AuctionCardModel } from "@/components/cards/AuctionCard";

type Stats = {
  startupsCount: number;
  ideasCount: number;
  activeAuctions: number;
};

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionCardModel[]>([]);
  const [counters, setCounters] = useState<{ projects: number; auctions: number; deals: number }>({
    projects: 0,
    auctions: 0,
    deals: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/stats", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Stats;
        if (!cancelled) setStats(data);
      } catch {
        // ignore (DB down)
      } finally {
        if (!cancelled) setLoading(false);
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
      try {
        const aR = await fetch("/api/v1/auctions", { cache: "no-store" });
        const a = await aR.json();
        if (!cancelled) setAuctions((a ?? []).slice(0, 3));
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
    const targetProjects = Math.max(0, (stats?.startupsCount ?? 0) + (stats?.ideasCount ?? 0));
    const targetAuctions = Math.max(0, stats?.activeAuctions ?? 0);
    const targetDeals = 0; // пока метрики нет в API — оставляем 0, но красиво анимируем

    let raf = 0;
    const start = performance.now();
    const ms = 1200;
    const from = { ...counters };
    function tick(now: number) {
      const t = Math.min(1, (now - start) / ms);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = {
        projects: Math.round(from.projects + (targetProjects - from.projects) * ease),
        auctions: Math.round(from.auctions + (targetAuctions - from.auctions) * ease),
        deals: Math.round(from.deals + (targetDeals - from.deals) * ease),
      };
      setCounters(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.startupsCount, stats?.ideasCount, stats?.activeAuctions]);

  function scrollToAuctions() {
    const el = document.getElementById("active-auctions");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fmtMoney(v: number) {
    return Number(v || 0).toLocaleString("ru-RU");
  }

  function fmtDateTime(iso?: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function fmtTimeLeft(a: AuctionCardModel) {
    const endsIso = a.endsAt ?? null;
    const startsIso = a.startsAt ?? null;
    const now = Date.now();

    const ends = endsIso ? new Date(endsIso).getTime() : NaN;
    const starts = startsIso ? new Date(startsIso).getTime() : NaN;

    if (!Number.isNaN(ends) && ends > now) {
      const mins = Math.max(0, Math.floor((ends - now) / 60000));
      const days = Math.floor(mins / (60 * 24));
      const hours = Math.floor((mins % (60 * 24)) / 60);
      const mm = mins % 60;
      if (days >= 1) return `Осталось ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`;
      if (hours >= 1) return `Осталось ${hours}ч ${mm}м`;
      return `Осталось ${mm}м`;
    }

    if (!Number.isNaN(starts) && starts > now) {
      const mins = Math.max(0, Math.floor((starts - now) / 60000));
      const hours = Math.floor(mins / 60);
      const mm = mins % 60;
      if (hours >= 1) return `Старт через ${hours}ч ${mm}м`;
      return `Старт через ${mm}м`;
    }

    return "";
  }

  function auctionGradientByCategory(category: string) {
    const c = (category || "").toLowerCase();
    if (c.includes("ai") || c.includes("ии") || c.includes("ml")) return "from-[#7c3aed] to-[#e11d48]";
    if (c.includes("eco") || c.includes("эко") || c.includes("green")) return "from-[#f59e0b] to-[#fb7185]";
    return "from-[#2563eb] to-[#06b6d4]";
  }

  return (
    <div className="min-h-screen">
      <section className="hero-bg">
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white">
                Запусти стартап.
                <span className="gradient-text block">Найди инвестиции.</span>
                Продай долю.
              </h1>
              <p className="mt-6 text-xl text-white/80 leading-relaxed">
                Платформа для стартаперов, инвесторов и покупателей бизнеса. Находи идеи, финансирование и партнёров в одном
                месте.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/add-startup"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-[#7c3aed] to-[#e11d48] hover:opacity-90 transition"
                >
                  Разместить проект
                </Link>
                <button
                  type="button"
                  onClick={scrollToAuctions}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-white border-2 border-[#7c3aed] hover:bg-[#7c3aed]/15 transition"
                >
                  Смотреть аукционы
                </button>
              </div>
            </div>

            <div className="glass border border-white/10 rounded-3xl p-8 relative card-hover">
              <div className="text-2xl font-bold text-white mb-6">Статистика платформы</div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Активных проектов</div>
                    <div className="counter text-3xl font-bold text-white">
                      {loading && !stats ? "—" : counters.projects.toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-[#00f5d4] rounded-full shadow-[0_0_20px_rgba(0,245,212,0.8)]" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Аукционов сейчас</div>
                    <div className="counter text-3xl font-bold text-white">
                      {loading && !stats ? "—" : counters.auctions.toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-[#e11d48] rounded-full shadow-[0_0_20px_rgba(225,29,72,0.75)]" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Сделок на этой неделе</div>
                    <div className="counter text-3xl font-bold text-white">
                      {loading && !stats ? "—" : counters.deals.toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-[#7c3aed] rounded-full shadow-[0_0_20px_rgba(124,58,237,0.75)]" />
                </div>
              </div>

              {!loading && !stats ? (
                <div className="mt-6 text-sm text-white/70">
                  Сейчас база данных недоступна — часть данных может не отображаться.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section-dark">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Как это работает</h2>
            <p className="text-white/60 text-lg">Простой путь от идеи до сделки за 4 шага</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                n: 1,
                nBg: "bg-[#7c3aed]/20 text-[#a78bfa]",
                title: "Создай профиль",
                text: "За 60 секунд расскажи о себе и своём проекте",
              },
              {
                n: 2,
                nBg: "bg-[#e11d48]/20 text-[#fb7185]",
                title: "Размести проект",
                text: "Или сразу выставь долю на аукцион",
              },
              {
                n: 3,
                nBg: "bg-[#00f5d4]/15 text-[#00f5d4]",
                title: "Получай отклики",
                text: "От инвесторов и партнёров в реальном времени",
              },
              {
                n: 4,
                nBg: "bg-[#f59e0b]/20 text-[#fbbf24]",
                title: "Закрой сделку",
                text: "Прозрачно и безопасно через платформу",
              },
            ].map((s) => (
              <div key={s.n} className="glass border border-white/10 rounded-3xl p-8 card-hover">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-bold ${s.nBg}`}>
                  {s.n}
                </div>
                <div className="mt-6 text-2xl font-bold text-white">{s.title}</div>
                <div className="mt-3 text-white/65 leading-relaxed">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="active-auctions" className="section-black">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-4xl font-bold text-white">Активные аукционы</div>
            </div>
            <Link href="/auction" className="text-sm font-medium text-white/60 hover:text-white transition">
              Все аукционы →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {auctions.map((a) => (
              <Link
                key={a.id}
                href={`/auction/${a.id}`}
                className="glass border border-white/10 rounded-3xl overflow-hidden block card-hover"
                aria-label={`Открыть аукцион: ${a.startup.title}`}
              >
                <div className={`h-44 bg-gradient-to-r ${auctionGradientByCategory(a.startup.category)} relative`}>
                  {fmtTimeLeft(a) ? (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full bg-black/55 text-white/85 border border-white/10">
                      {fmtTimeLeft(a)}
                    </div>
                  ) : null}
                </div>

                <div className="p-8">
                  <div className="text-xl font-bold text-white leading-snug">{a.startup.title}</div>
                  <div className="mt-2 text-white/50 text-sm">{a.startup.category}</div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-white/75 text-sm">Текущая ставка:</div>
                    <div className="text-[#00f5d4] font-bold">{fmtMoney(a.currentPrice)} ₽</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-bg">
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="text-4xl font-bold text-white mb-2">Готов запустить свой проект</div>
          <div className="text-4xl font-bold text-white mb-6">или найти инвестицию?</div>
          <div className="text-xl text-white/70 mb-10">Присоединяйся к тысячам основателей и инвесторов уже сегодня</div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-12 py-4 rounded-2xl font-semibold bg-white text-black hover:opacity-95 transition"
          >
            Начать бесплатно
          </Link>
        </div>
      </section>
    </div>
  );
}
