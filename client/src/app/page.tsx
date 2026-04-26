"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

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

const HOW_IT_WORKS_CARDS = [
  {
    n: 1,
    nBg: "bg-[#7c3aed]/20 text-[#a78bfa]",
    title: "Создайте профиль, которому доверяют",
    text: "Сильный профиль помогает быстрее заинтересовать инвесторов и партнёров. Чем понятнее вы показываете опыт, роль и цели, тем выше шанс на серьёзный диалог.",
  },
  {
    n: 2,
    nBg: "bg-[#e11d48]/20 text-[#fb7185]",
    title: "Покажите проект в выгодном свете",
    text: "Понятная подача идеи увеличивает шанс на отклик. Когда ценность, рынок и потенциал роста сформулированы ясно, проект воспринимается сильнее.",
  },
  {
    n: 3,
    nBg: "bg-[#00f5d4]/15 text-[#00f5d4]",
    title: "Станьте заметнее для нужных людей",
    text: "Проект видят инвесторы, предприниматели и потенциальные партнёры. Это помогает быстрее выйти не на случайную аудиторию, а на тех, кому ваша идея действительно интересна.",
  },
  {
    n: 4,
    nBg: "bg-[#f59e0b]/20 text-[#fbbf24]",
    title: "Получайте предложения и отклики",
    text: "Платформа помогает быстрее выйти на диалог, а не искать контакты вручную. Вместо долгого холодного поиска вы сразу переходите к заинтересованным людям.",
  },
  {
    n: 5,
    nBg: "bg-[#ef4444]/20 text-[#fca5a5]",
    title: "Обсуждайте сотрудничество предметно",
    text: "Можно быстрее переходить к конкретике, условиям и следующему шагу. Это сокращает путь от первого интереса до реальных договорённостей.",
  },
  {
    n: 6,
    nBg: "bg-[#3b82f6]/20 text-[#93c5fd]",
    title: "Превращайте интерес в рост",
    text: "Конечная цель — не просто просмотры, а реальные партнёрства, инвестиции и развитие проекта. Платформа должна ощущаться как инструмент роста, а не просто витрина объявлений.",
  },
] as const;

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotStartup, setSpotStartup] = useState<SpotlightStartup | null>(null);
  const [spotIdea, setSpotIdea] = useState<SpotlightIdea | null>(null);
  const [spotInvestor, setSpotInvestor] = useState<SpotlightInvestor | null>(null);
  const [counters, setCounters] = useState<{ projectsTotal: number; startupsCount: number; investorsPartners: number }>({
    projectsTotal: 0,
    startupsCount: 0,
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
    const targetStartupsCount = Math.max(0, stats?.startupsCount ?? 0);
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
        projectsTotal: Math.round(from.projectsTotal + (targetProjectsTotal - from.projectsTotal) * ease),
        startupsCount: Math.round(from.startupsCount + (targetStartupsCount - from.startupsCount) * ease),
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

  function fmtMoney(v: number) {
    return Number(v || 0).toLocaleString("ru-RU");
  }

  return (
    <div className="min-h-screen">
      <section className="hero-bg relative flex min-h-[calc(100dvh-var(--site-header-height))] flex-col justify-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6 md:space-y-8">
              {!loading ? (
                <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/10 px-5 py-2 text-sm text-white/80 backdrop-blur-md">
                  <span className="status-dot" aria-hidden />
                  Строим будущее стартапов
                </div>
              ) : null}
              <h1 className="hero-title text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[1.05]">
                <span className="hero-shine" data-text="Запусти стартап.">
                  Запусти стартап.
                </span>
                <span className="hero-shine gradient-text block" data-text="Найди инвестиции.">
                  Найди инвестиции.
                </span>
                <span className="hero-shine block" data-text="Собери сильных партнёров.">
                  Собери сильных партнёров.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
                Startup Hub — платформа, где основатели находят инвестиции, партнёров и возможности для роста проекта в одном
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
                  href="/marketplace?tab=startups"
                  className="inline-flex items-center justify-center rounded-full border-2 border-[#7c3aed] px-8 py-4 text-center font-semibold text-white transition hover:bg-[#7c3aed]/15 md:px-10 md:py-5 md:text-lg"
                >
                  Смотреть проекты
                </Link>
              </div>
            </div>

              <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 relative card-hover">
              <div className="text-xl sm:text-2xl font-bold text-white mb-6">Статистика платформы</div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Всего проектов</div>
                    <div className="counter stat-number stat-green text-3xl font-bold">
                      {loading && !stats ? "—" : counters.projectsTotal.toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-[#00f5d4] rounded-full shadow-[0_0_20px_rgba(0,245,212,0.8)]" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-sm">Активных стартапов</div>
                    <div className="counter stat-number stat-rose text-3xl font-bold">
                      {loading && !stats ? "—" : counters.startupsCount.toLocaleString("ru-RU")}
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

      <section className="section-dark overflow-x-clip">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-8 md:pb-10">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Как Startup Hub помогает проекту расти</h2>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Размещайте проект, получайте внимание инвесторов и партнёров, договаривайтесь о сотрудничестве и быстрее переходите от
              идеи к росту.
            </p>
          </div>
        </div>

        <ul
          className="how-stack"
          style={{ "--how-numcards": HOW_IT_WORKS_CARDS.length } as React.CSSProperties}
        >
          {HOW_IT_WORKS_CARDS.map((s) => (
            <li
              key={s.n}
              className="how-stack-card-wrap"
              style={{ "--how-index": s.n } as React.CSSProperties}
            >
              <div className="how-stack-card-inner card-hover">
                <div className="how-stack-card-copy flex flex-col justify-center px-8 py-10 sm:px-10 sm:py-12 md:px-14 md:py-14 lg:py-16">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${s.nBg}`}>
                      {s.n}
                    </div>
                    <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/55">Шаг {s.n}</span>
                  </div>
                  <h3 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                    {s.title}
                  </h3>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-white/[0.88] sm:text-lg md:text-xl">{s.text}</p>
                </div>
                <div className={`how-stack-card-visual how-stack-card-visual--${s.n}`} aria-hidden>
                  {s.n === 3 ? (
                    <>
                      <span className="how-human how-human--mini how-radar how-radar-1" />
                      <span className="how-human how-human--mini how-radar how-radar-2" />
                      <span className="how-human how-human--mini how-radar how-radar-3" />
                      <span className="how-human how-human--mini how-radar how-radar-5" />
                    </>
                  ) : null}
                  {s.n === 5 ? (
                    <div className="how-stack-chat">
                      <div className="how-stack-chat-stream">
                        <span className="how-chat-bubble how-chat-bubble--out how-chat-s1" />
                        <span className="how-chat-bubble how-chat-bubble--in how-chat-s2" />
                        <span className="how-chat-bubble how-chat-bubble--in how-chat-s3" />
                        <span className="how-chat-bubble how-chat-bubble--out how-chat-s4 how-chat-bubble--tall" />
                        <span className="how-chat-bubble how-chat-bubble--in how-chat-s5" />
                        <span className="how-chat-bubble how-chat-bubble--out how-chat-s6" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <PlatformSpotlightSection startup={spotStartup} idea={spotIdea} investor={spotInvestor} fmtMoney={fmtMoney} />

      <section className="hero-bg relative flex min-h-[calc(100dvh-var(--site-header-height))] flex-col justify-center overflow-hidden">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-14 text-center sm:px-6">
          <div className="text-3xl font-bold text-white mb-6 sm:text-4xl md:text-5xl">Готов вывести проект на новый этап?</div>
          <div className="text-base text-white/70 mb-10 max-w-3xl mx-auto sm:text-xl md:text-2xl">
            Разместите стартап, найдите инвесторов и партнёров и начните двигаться к росту быстрее — в одном пространстве.
          </div>
          <Link
            href="/register"
            className="inline-flex w-full sm:w-auto items-center justify-center px-10 sm:px-12 py-5 rounded-2xl font-semibold bg-white text-black hover:opacity-95 transition"
          >
            Начать бесплатно
          </Link>
        </div>
      </section>
    </div>
  );
}
