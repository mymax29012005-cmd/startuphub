"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import type { AuctionCardModel } from "@/components/cards/AuctionCard";
import {
  PlatformSpotlightSection,
  type SpotlightIdea,
  type SpotlightInvestor,
  type SpotlightStartup,
} from "@/components/home/PlatformSpotlightSection";

type Stats = {
  startupsCount: number;
  ideasCount: number;
  activeAuctions: number;
  investorsCount: number;
  partnersCount: number;
};

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<AuctionCardModel[]>([]);
  const [spotStartup, setSpotStartup] = useState<SpotlightStartup | null>(null);
  const [spotIdea, setSpotIdea] = useState<SpotlightIdea | null>(null);
  const [spotInvestor, setSpotInvestor] = useState<SpotlightInvestor | null>(null);
  const [counters, setCounters] = useState<{ activeProjects: number; projectsTotal: number; investorsPartners: number }>({
    activeProjects: 0,
    projectsTotal: 0,
    investorsPartners: 0,
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
        const [stR, idR, invR] = await Promise.all([
          fetch("/api/v1/startups", { cache: "no-store" }),
          fetch("/api/v1/ideas", { cache: "no-store" }),
          fetch("/api/v1/investors", { cache: "no-store" }),
        ]);
        if (stR.ok) {
          const st = (await stR.json()) as SpotlightStartup[];
          if (!cancelled) setSpotStartup(st[0] ?? null);
        }
        if (idR.ok) {
          const id = (await idR.json()) as SpotlightIdea[];
          if (!cancelled) setSpotIdea(id[0] ?? null);
        }
        if (invR.ok) {
          const inv = (await invR.json()) as SpotlightInvestor[];
          if (!cancelled) setSpotInvestor(inv[0] ?? null);
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
    const targetActiveProjects = Math.max(0, stats?.startupsCount ?? 0);
    const targetProjectsTotal = Math.max(0, (stats?.startupsCount ?? 0) + (stats?.ideasCount ?? 0));
    const targetInvestorsPartners = Math.max(0, (stats?.investorsCount ?? 0) + (stats?.partnersCount ?? 0));

    let raf = 0;
    const start = performance.now();
    const ms = 1200;
    const from = { ...counters };
    function tick(now: number) {
      const t = Math.min(1, (now - start) / ms);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = {
        activeProjects: Math.round(from.activeProjects + (targetActiveProjects - from.activeProjects) * ease),
        projectsTotal: Math.round(from.projectsTotal + (targetProjectsTotal - from.projectsTotal) * ease),
        investorsPartners: Math.round(from.investorsPartners + (targetInvestorsPartners - from.investorsPartners) * ease),
      };
      setCounters(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.startupsCount, stats?.ideasCount, stats?.investorsCount, stats?.partnersCount]);

  useEffect(() => {
    // "How it works" scroll reveal (like redesign.html)
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-how-card]"));
    if (!cards.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.classList.add("how-show");
          else el.classList.remove("how-show");
        }
      },
      { threshold: 0.28 },
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

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
      <section className="hero-bg relative flex min-h-[calc(100dvh-var(--site-header-height))] flex-col justify-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6 md:space-y-8">
              {!loading ? (
                <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur-md">
                  <span className="status-dot" aria-hidden />
                  Строим будущее стартапов
                </div>
              ) : null}
              <h1 className="hero-title text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl lg:leading-[1.05]">
                <span className="hero-shine" data-text="Запусти стартап.">
                  Запусти стартап.
                </span>
                <span className="hero-shine gradient-text block" data-text="Найди инвестиции.">
                  Найди инвестиции.
                </span>
                <span className="hero-shine" data-text="Продай долю.">
                  Продай долю.
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
                Платформа для стартаперов, инвесторов и покупателей бизнеса. Находи идеи, финансирование и партнёров в одном
                месте.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link
                  href="/add-startup"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#e11d48] px-8 py-4 text-center font-semibold text-white transition hover:opacity-90 md:px-10 md:py-5 md:text-lg"
                >
                  Разместить проект
                </Link>
                <Link
                  href="/auction"
                  className="inline-flex items-center justify-center rounded-full border-2 border-[#7c3aed] px-8 py-4 text-center font-semibold text-white transition hover:bg-[#7c3aed]/15 md:px-10 md:py-5 md:text-lg"
                >
                  Смотреть аукционы
                </Link>
              </div>
            </div>

            <div className="glass border border-white/10 rounded-3xl p-8 relative card-hover">
              <div className="text-2xl font-bold text-white mb-6">Статистика платформы</div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Активных проектов</div>
                    <div className="counter stat-number stat-green text-3xl font-bold">
                      {loading && !stats ? "—" : counters.activeProjects.toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-[#00f5d4] rounded-full shadow-[0_0_20px_rgba(0,245,212,0.8)]" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Количество проектов</div>
                    <div className="counter stat-number stat-rose text-3xl font-bold">
                      {loading && !stats ? "—" : counters.projectsTotal.toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-[#e11d48] rounded-full shadow-[0_0_20px_rgba(225,29,72,0.75)]" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Инвесторы и партнёры</div>
                    <div className="counter stat-number stat-violet text-3xl font-bold">
                      {loading && !stats ? "—" : counters.investorsPartners.toLocaleString("ru-RU")}
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
            <p className="text-white/60 text-lg">
              Платформа объединяет основателей стартапов, инвесторов и предпринимателей. Всё необходимое для развития проекта — в одном месте.
            </p>
          </div>
          <div className="how-timeline mt-10">
            {[
              {
                n: 1,
                nBg: "bg-[#7c3aed]/20 text-[#a78bfa]",
                icon: "🚀",
                title: "Создайте профиль",
                text: "Расскажите о себе, своём опыте и направлениях деятельности. Профиль помогает участникам платформы быстро понять, с кем они взаимодействуют.",
              },
              {
                n: 2,
                nBg: "bg-[#e11d48]/20 text-[#fb7185]",
                icon: "🧩",
                title: "Опубликуйте проект",
                text: "Разместите стартап, идею или действующий продукт. Опишите потенциал проекта, цели и условия сотрудничества.",
              },
              {
                n: 3,
                nBg: "bg-[#00f5d4]/15 text-[#00f5d4]",
                icon: "🤝",
                title: "Представьте проект сообществу",
                text: "Ваш проект становится доступен предпринимателям, инвесторам и специалистам, которые ищут новые возможности и перспективные идеи.",
              },
              {
                n: 4,
                nBg: "bg-[#f59e0b]/20 text-[#fbbf24]",
                icon: "📈",
                title: "Получайте предложения",
                text: "Участники платформы могут предложить инвестиции, партнёрство или участие в развитии проекта.",
              },
              {
                n: 5,
                nBg: "bg-[#ef4444]/20 text-[#fca5a5]",
                icon: "🧾",
                title: "Заключайте договорённости",
                text: "Обсуждайте условия сотрудничества и находите решения, которые помогут вашему проекту расти.",
              },
              {
                n: 6,
                nBg: "bg-[#3b82f6]/20 text-[#93c5fd]",
                icon: "🌐",
                title: "Развивайте бизнес",
                text: "Используйте платформу как точку взаимодействия с людьми, которые могут ускорить развитие вашего стартапа.",
              },
            ].map((s, idx) => (
              <div
                key={s.n}
                data-how-card
                className={[
                  "how-card glass border border-white/10 rounded-3xl p-8 card-hover",
                  idx % 2 === 0 ? "how-left" : "how-right",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.icon}</div>
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl font-bold ${s.nBg}`}>{s.n}</div>
                </div>
                <div className="mt-6 text-2xl font-bold text-white">{s.title}</div>
                <div className="mt-3 text-white/65 leading-relaxed">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PlatformSpotlightSection
        auction={auctions[0] ?? null}
        startup={spotStartup}
        idea={spotIdea}
        investor={spotInvestor}
        fmtMoney={fmtMoney}
        auctionTimeLabel={fmtTimeLeft}
        auctionGradient={auctionGradientByCategory}
      />

      <section className="hero-bg">
        <div className="relative mx-auto max-w-6xl px-4 py-28 md:py-36 text-center">
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
