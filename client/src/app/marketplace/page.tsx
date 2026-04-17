"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { stageLabelsByLang } from "@/lib/labelMaps";

type TabKey = "startups" | "ideas" | "auctions" | "investors" | "partners";

type StartupItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
  isOnline: boolean;
};

type IdeaItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
};

type AuctionItem = {
  id: string;
  currentPrice: number;
  startsAt?: string;
  endsAt?: string | null;
  startup: { id: string; title: string; category: string; description: string };
};

type InvestorItem = {
  id: string;
  industry: string;
  description: string;
  amount: number;
};

type PartnerItem = {
  id: string;
  role: string;
  industry: string;
  description: string;
};

type MarketplaceCardVM = {
  id: string;
  href: string;
  title: string;
  desc: string;
  pill?: { text: string; kind: "startup" | "idea" | "auction" };
  amount?: string;
  location?: string;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "startups", label: "Стартапы" },
  { key: "ideas", label: "Идеи" },
  { key: "auctions", label: "Аукционы" },
  { key: "investors", label: "Инвесторы" },
  { key: "partners", label: "Партнёры" },
];

const industries = ["AI & ML", "Fintech", "SaaS", "E-commerce", "Green Tech", "HealthTech"] as const;
const geos = ["Москва", "Санкт-Петербург", "Новосибирск", "Казахстан", "Беларусь", "Онлайн"] as const;

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("startups");
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedGeos, setSelectedGeos] = useState<Set<string>>(new Set(["Москва", "Санкт-Петербург"]));

  const [startups, setStartups] = useState<StartupItem[] | null>(null);
  const [ideas, setIdeas] = useState<IdeaItem[] | null>(null);
  const [auctions, setAuctions] = useState<AuctionItem[] | null>(null);
  const [investors, setInvestors] = useState<InvestorItem[] | null>(null);
  const [partners, setPartners] = useState<PartnerItem[] | null>(null);

  function parseMoney(s: string) {
    const cleaned = (s || "").replace(/[^\d]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function fmtMoney(v: number) {
    return Number(v || 0).toLocaleString("ru-RU") + " ₽";
  }

  function fmtTimeLeft(a: AuctionItem) {
    const now = Date.now();
    const ends = a.endsAt ? new Date(a.endsAt).getTime() : NaN;
    const starts = a.startsAt ? new Date(a.startsAt).getTime() : NaN;

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

  async function ensureLoaded(tab: TabKey) {
    setDbError(false);
    setLoading(true);
    try {
      if (tab === "startups" && startups === null) {
        const r = await fetch("/api/v1/startups", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        setStartups((await r.json()) as StartupItem[]);
      }
      if (tab === "ideas" && ideas === null) {
        const r = await fetch("/api/v1/ideas", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        setIdeas((await r.json()) as IdeaItem[]);
      }
      if (tab === "auctions" && auctions === null) {
        const r = await fetch("/api/v1/auctions", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        setAuctions((await r.json()) as AuctionItem[]);
      }
      if (tab === "investors" && investors === null) {
        const r = await fetch("/api/v1/investors", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        setInvestors((await r.json()) as InvestorItem[]);
      }
      if (tab === "partners" && partners === null) {
        const r = await fetch("/api/v1/partners", { cache: "no-store" });
        if (!r.ok) throw new Error("db");
        setPartners((await r.json()) as PartnerItem[]);
      }
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void ensureLoaded(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const totalCount = (startups?.length ?? 0) + (ideas?.length ?? 0) + (auctions?.length ?? 0) + (investors?.length ?? 0) + (partners?.length ?? 0);

  const cards: MarketplaceCardVM[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inds = selectedIndustries;
    const geo = selectedGeos;
    const min = parseMoney(amountMin);
    const max = parseMoney(amountMax);

    function matchesBase(texts: string[]) {
      if (!q) return true;
      const blob = texts.join(" ").toLowerCase();
      return blob.includes(q);
    }

    function matchesAmount(v: number | null) {
      if (v == null) return true;
      if (min != null && v < min) return false;
      if (max != null && v > max) return false;
      return true;
    }

    if (activeTab === "startups") {
      const list = startups ?? [];
      return list
        .filter((x) => {
          if (!matchesBase([x.title, x.description, x.category])) return false;
          if (inds.size > 0 && !Array.from(inds).some((i) => x.category.toLowerCase().includes(i.toLowerCase()))) return false;
          if (stage && x.stage !== stage) return false;
          if (!matchesAmount(x.price)) return false;
          const loc = x.isOnline ? "Онлайн" : "";
          if (geo.size > 0 && loc && !geo.has(loc)) return false;
          return true;
        })
        .map((x) => ({
          id: x.id,
          href: `/startups/${x.id}`,
          title: x.title,
          desc: x.description,
          pill: { text: stageLabelsByLang.ru?.[x.stage] ?? x.stage, kind: "startup" },
          amount: fmtMoney(x.price),
          location: x.isOnline ? "Онлайн" : "",
        }));
    }

    if (activeTab === "ideas") {
      const list = ideas ?? [];
      return list
        .filter((x) => {
          if (!matchesBase([x.title, x.description, x.category])) return false;
          if (inds.size > 0 && !Array.from(inds).some((i) => x.category.toLowerCase().includes(i.toLowerCase()))) return false;
          if (stage && x.stage !== stage) return false;
          if (!matchesAmount(x.price)) return false;
          return true;
        })
        .map((x) => ({
          id: x.id,
          href: `/ideas/${x.id}`,
          title: x.title,
          desc: x.description,
          pill: { text: stageLabelsByLang.ru?.[x.stage] ?? x.stage, kind: "idea" },
          amount: fmtMoney(x.price),
          location: "",
        }));
    }

    if (activeTab === "auctions") {
      const list = auctions ?? [];
      return list
        .filter((x) => matchesBase([x.startup.title, x.startup.description, x.startup.category]))
        .map((x) => ({
          id: x.id,
          href: `/auction/${x.id}`,
          title: x.startup.title,
          desc: `Текущая ставка ${fmtMoney(x.currentPrice)}`,
          pill: { text: fmtTimeLeft(x) || "Аукцион", kind: "auction" },
          amount: fmtMoney(x.currentPrice),
          location: "",
        }));
    }

    if (activeTab === "investors") {
      const list = investors ?? [];
      return list
        .filter((x) => {
          if (!matchesBase([x.industry, x.description])) return false;
          if (inds.size > 0 && !Array.from(inds).some((i) => x.industry.toLowerCase().includes(i.toLowerCase()))) return false;
          if (!matchesAmount(x.amount)) return false;
          return true;
        })
        .map((x) => ({
          id: x.id,
          href: `/investors/${x.id}`,
          title: `Инвестор: ${fmtMoney(x.amount)}`,
          desc: x.description,
          amount: fmtMoney(x.amount),
          location: "",
        }));
    }

    const list = partners ?? [];
    return list
      .filter((x) => {
        if (!matchesBase([x.industry, x.role, x.description])) return false;
        if (inds.size > 0 && !Array.from(inds).some((i) => x.industry.toLowerCase().includes(i.toLowerCase()))) return false;
        return true;
      })
      .map((x) => ({
        id: x.id,
        href: `/partners/${x.id}`,
        title: x.industry,
        desc: x.description,
        amount: "",
        location: "",
      }));
  }, [activeTab, amountMax, amountMin, ideas, investors, partners, search, selectedGeos, selectedIndustries, stage, startups, auctions]);

  return (
    <div className="pt-20 max-w-7xl mx-auto px-6">
      <div className="py-12 border-b border-white/10">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-3">Маркетплейс</h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          {totalCount > 0 ? `Более ${totalCount} стартапов, идей, аукционов, инвесторов и партнёров в одном месте` : "Стартапы, идеи, аукционы, инвесторы и партнёры в одном месте"}
        </p>

        <div className="mt-8 relative">
          <div className="bg-[#12121A] border border-white/10 rounded-3xl px-6 py-5 flex items-center gap-4 shadow-xl">
            <span className="text-xl text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Поиск по названию, отрасли, ключевому слову..."
              className="flex-1 bg-transparent outline-none text-lg placeholder-gray-500"
            />
            <button
              type="button"
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl font-medium"
              onClick={() => void ensureLoaded(activeTab)}
            >
              Найти
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 border-b border-white/10 pb-4 mt-8 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={[
                "px-6 py-3 text-lg whitespace-nowrap transition",
                active ? "border-b-[3px] border-[#7C3AED] text-white font-semibold" : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-8 pt-8">
        <div className="w-72 min-w-0 hidden lg:block bg-[#12121A] border border-white/10 rounded-3xl p-6 h-fit sticky top-28">
          <h3 className="font-semibold mb-6 flex items-center gap-2">⚙ Фильтры</h3>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Отрасль</p>
            <div className="flex flex-wrap gap-2">
              {industries.map((x) => {
                const on = selectedIndustries.has(x);
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => {
                      setSelectedIndustries((prev) => {
                        const next = new Set(prev);
                        if (next.has(x)) next.delete(x);
                        else next.add(x);
                        return next;
                      });
                    }}
                    className={[
                      "cursor-pointer text-xs px-4 py-2 rounded-2xl transition",
                      on ? "bg-violet-600" : "bg-white/10 hover:bg-violet-600",
                    ].join(" ")}
                  >
                    {x}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Стадия</p>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-white"
            >
              <option value="">Любая стадия</option>
              <option value="idea">Идея</option>
              <option value="pre-seed">Pre-Seed</option>
              <option value="seed">Seed</option>
              <option value="series-a">Series A</option>
            </select>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Сумма привлечения</p>
            <div className="flex flex-col gap-3 min-w-0">
              <input
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                type="text"
                placeholder="от 500 тыс"
                className="w-full min-w-0 box-border bg-white/10 border border-white/10 rounded-2xl px-4 py-3"
              />
              <input
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                type="text"
                placeholder="до 50 млн"
                className="w-full min-w-0 box-border bg-white/10 border border-white/10 rounded-2xl px-4 py-3"
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-3">География</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {geos.map((g) => {
                const on = selectedGeos.has(g);
                return (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedGeos((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(g);
                          else next.delete(g);
                          return next;
                        });
                      }}
                      className="accent-violet-500"
                    />
                    {g}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-white/40">
              Сейчас гео доступно только там, где данные есть (например, “Онлайн” для некоторых карточек).
            </div>
          </div>
        </div>

        <div className="flex-1">
          {loading ? <div className="text-gray-400 py-12">Загрузка…</div> : null}
          {dbError ? <div className="text-gray-400 py-12">База данных недоступна</div> : null}

          {!loading && !dbError ? (
            cards.length === 0 ? (
              <div className="text-gray-400 col-span-full text-center py-12">В этой категории пока ничего нет</div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cards.map((it) => (
                  <Link
                    key={it.id}
                    href={it.href}
                    className="card-hover bg-[#12121A] border border-white/10 rounded-3xl overflow-hidden p-6 block"
                  >
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <h3 className="font-semibold text-xl leading-snug">{it.title}</h3>
                      {it.pill ? (
                        <span
                          className={[
                            "text-xs px-4 py-1 rounded-2xl whitespace-nowrap",
                            it.pill.kind === "auction"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-emerald-500/20 text-emerald-400",
                          ].join(" ")}
                        >
                          {it.pill.text}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-gray-400 mb-6 line-clamp-3">{it.desc}</p>
                    <div className="flex justify-between text-sm gap-4">
                      <div className="min-w-0">
                        {it.amount ? (
                          <span className="truncate">
                            <span className="text-gray-400">Нужно:</span> <span className="font-medium">{it.amount}</span>
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>
                      <div className="text-violet-400 truncate">{it.location ?? ""}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : null}

          <div className="mt-16 pb-24 text-center text-gray-500 text-sm">
            <div>© {new Date().getFullYear()} StartupHub.ru — Маркетплейс</div>
            <div className="mt-2">Демо-версия страницы Маркетплейс с фильтрами, табами и поиском</div>
          </div>
        </div>
      </div>
    </div>
  );
}

