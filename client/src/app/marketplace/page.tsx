"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";

import { allowedCategories } from "@/lib/categories";
import { formatLabelsByLang, partnerRoleLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";

type TabKey = "startups" | "ideas" | "investors" | "partners";

type StartupItem = {
  id: string;
  title: string;
  description: string;
  tagline?: string;
  category: string;
  price: number;
  stage: string;
  format?: "online" | "offline" | "hybrid";
  isOnline: boolean;
};

type IdeaItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
  format?: "online" | "offline" | "hybrid";
};

type InvestorItem = {
  id: string;
  industry: string;
  description: string;
  amount: number;
};

type PartnerItem = {
  id: string;
  role: "supplier" | "reseller" | "integration" | "cofounder";
  industry: string;
  description: string;
};

type MarketplaceCardVM = {
  id: string;
  href: string;
  title: string;
  desc: string;
  pill?: { text: string; kind: "startup" | "idea" | "accent" };
  amount?: string;
  location?: string;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "startups", label: "Стартапы" },
  { key: "ideas", label: "Идеи" },
  { key: "investors", label: "Инвесторы" },
  { key: "partners", label: "Партнёры" },
];

const stageFilterValues = ["idea", "seed", "series_a", "series_b", "growth", "exit"] as const;
const formatFilterValues = ["online", "offline", "hybrid"] as const;
const partnerRoles = ["supplier", "reseller", "integration", "cofounder"] as const;

function tabFromSearchParams(sp: URLSearchParams): TabKey {
  const t = sp.get("tab");
  if (t === "ideas" || t === "investors" || t === "partners" || t === "startups") return t;
  return "startups";
}

function MarketplaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => tabFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    if (searchParams.get("tab") === "auctions") {
      router.replace("/auction");
    }
  }, [router, searchParams]);

  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  /** Пустой набор = не фильтровать. Иначе — карточка должна совпадать по формату (как при создании). */
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set());
  const [selectedPartnerRoles, setSelectedPartnerRoles] = useState<Set<string>>(new Set());
  const [postModalOpen, setPostModalOpen] = useState(false);

  const [startups, setStartups] = useState<StartupItem[] | null>(null);
  const [ideas, setIdeas] = useState<IdeaItem[] | null>(null);
  const [investors, setInvestors] = useState<InvestorItem[] | null>(null);
  const [partners, setPartners] = useState<PartnerItem[] | null>(null);

  function selectTab(key: TabKey) {
    router.replace(`/marketplace?tab=${key}`, { scroll: false });
  }

  function parseMoney(s: string) {
    const cleaned = (s || "").replace(/[^\d]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function fmtMoney(v: number) {
    return Number(v || 0).toLocaleString("ru-RU") + " ₽";
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

  useEffect(() => {
    if (!postModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPostModalOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [postModalOpen]);

  const totalCount = (startups?.length ?? 0) + (ideas?.length ?? 0) + (investors?.length ?? 0) + (partners?.length ?? 0);

  const cards: MarketplaceCardVM[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inds = selectedIndustries;
    const formats = selectedFormats;
    const partnerRolesSel = selectedPartnerRoles;
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
          if (!matchesBase([x.title, x.description, x.tagline ?? "", x.category])) return false;
          if (inds.size > 0 && !inds.has(x.category)) return false;
          if (stage && x.stage !== stage) return false;
          if (!matchesAmount(x.price)) return false;
          if (formats.size > 0) {
            const fmt = x.format ?? (x.isOnline ? "online" : "offline");
            if (!formats.has(fmt)) return false;
          }
          return true;
        })
        .map((x) => ({
          id: x.id,
          href: `/startups/${x.id}`,
          title: x.title,
          desc: (x.tagline && x.tagline.trim()) || x.description,
          pill: { text: stageLabelsByLang.ru?.[x.stage] ?? x.stage, kind: "startup" as const },
          amount: fmtMoney(x.price),
          location:
            x.format != null
              ? (formatLabelsByLang.ru?.[x.format] ?? x.format)
              : x.isOnline
                ? (formatLabelsByLang.ru?.online ?? "Онлайн")
                : (formatLabelsByLang.ru?.offline ?? "Офлайн"),
        }));
    }

    if (activeTab === "ideas") {
      const list = ideas ?? [];
      return list
        .filter((x) => {
          if (!matchesBase([x.title, x.description, x.category])) return false;
          if (inds.size > 0 && !inds.has(x.category)) return false;
          if (stage && x.stage !== stage) return false;
          if (!matchesAmount(x.price)) return false;
          if (formats.size > 0) {
            const fmt = x.format ?? "online";
            if (!formats.has(fmt)) return false;
          }
          return true;
        })
        .map((x) => ({
          id: x.id,
          href: `/ideas/${x.id}`,
          title: x.title,
          desc: x.description,
          pill: { text: stageLabelsByLang.ru?.[x.stage] ?? x.stage, kind: "idea" as const },
          amount: fmtMoney(x.price),
          location: x.format ? (formatLabelsByLang.ru?.[x.format] ?? x.format) : "",
        }));
    }

    if (activeTab === "investors") {
      const list = investors ?? [];
      return list
        .filter((x) => {
          if (!matchesBase([x.industry, x.description])) return false;
          if (inds.size > 0 && !inds.has(x.industry)) return false;
          if (!matchesAmount(x.amount)) return false;
          return true;
        })
        .map((x) => ({
          id: x.id,
          href: `/investors/${x.id}`,
          title: `Инвестор: ${fmtMoney(x.amount)}`,
          desc: x.description,
          pill: { text: "Запрос", kind: "accent" as const },
          amount: fmtMoney(x.amount),
          location: "",
        }));
    }

    const list = partners ?? [];
    return list
      .filter((x) => {
        if (!matchesBase([x.industry, x.role, x.description])) return false;
        if (inds.size > 0 && !inds.has(x.industry)) return false;
        if (partnerRolesSel.size > 0 && !partnerRolesSel.has(x.role)) return false;
        return true;
      })
      .map((x) => ({
        id: x.id,
        href: `/partners/${x.id}`,
        title: x.industry,
        desc: x.description,
        pill: { text: partnerRoleLabelsByLang.ru?.[x.role] ?? x.role, kind: "accent" as const },
        amount: "",
        location: "",
      }));
  }, [
    activeTab,
    amountMax,
    amountMin,
    ideas,
    investors,
    partners,
    search,
    selectedFormats,
    selectedPartnerRoles,
    selectedIndustries,
    stage,
    startups,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="border-b border-white/10 py-12">
        <h1 className="mb-3 text-5xl font-bold tracking-tighter md:text-6xl">Маркетплейс</h1>
        <p className="max-w-2xl text-xl text-gray-400">
          {totalCount > 0
            ? `Более ${totalCount} стартапов, идей, инвесторов и партнёров в одном месте`
            : "Стартапы, идеи, инвесторы и партнёры в одном месте — аукционы в отдельном разделе «Аукционы»"}
        </p>

        <div className="relative mt-8">
          <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-[#12121A] px-6 py-5 shadow-xl">
            <span className="text-xl text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Поиск по названию, отрасли, ключевому слову..."
              className="flex-1 bg-transparent text-lg outline-none placeholder-gray-500"
            />
            <button
              type="button"
              className="rounded-2xl bg-violet-600 px-8 py-3 font-medium hover:bg-violet-500"
              onClick={() => void ensureLoaded(activeTab)}
            >
              Найти
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto md:gap-8">
          {tabs.map((t) => {
            const active = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                className={[
                  "whitespace-nowrap px-6 py-3 text-lg transition",
                  active ? "border-b-[3px] border-[#7C3AED] font-semibold text-white" : "text-gray-400 hover:text-white",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setPostModalOpen(true)}
          className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 md:px-8 md:text-base"
        >
          Разместить
        </button>
      </div>

      {postModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-8"
          role="presentation"
          onClick={() => setPostModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
            className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#12121A] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-xl px-3 py-1 text-sm text-gray-400 transition hover:bg-white/10 hover:text-white"
              onClick={() => setPostModalOpen(false)}
            >
              ✕
            </button>
            <h2 id="post-modal-title" className="pr-10 text-2xl font-bold text-white">
              Что разместить?
            </h2>
            <p className="mt-2 text-sm text-gray-400">Выберите тип карточки — откроется форма создания.</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/add-startup"
                onClick={() => setPostModalOpen(false)}
                className="rounded-2xl border border-white/10 bg-[#1A1A24] px-5 py-4 text-left transition hover:border-violet-500/50 hover:bg-white/5"
              >
                <div className="font-semibold text-white">Стартап</div>
                <div className="mt-1 text-xs text-gray-500">Проект и привлечение инвестиций</div>
              </Link>
              <Link
                href="/add-idea"
                onClick={() => setPostModalOpen(false)}
                className="rounded-2xl border border-white/10 bg-[#1A1A24] px-5 py-4 text-left transition hover:border-violet-500/50 hover:bg-white/5"
              >
                <div className="font-semibold text-white">Идея</div>
                <div className="mt-1 text-xs text-gray-500">Концепт до продукта</div>
              </Link>
              <Link
                href="/add-investor"
                onClick={() => setPostModalOpen(false)}
                className="rounded-2xl border border-white/10 bg-[#1A1A24] px-5 py-4 text-left transition hover:border-violet-500/50 hover:bg-white/5"
              >
                <div className="font-semibold text-white">Инвестор</div>
                <div className="mt-1 text-xs text-gray-500">Запрос на инвестиции</div>
              </Link>
              <Link
                href="/add-partner"
                onClick={() => setPostModalOpen(false)}
                className="rounded-2xl border border-white/10 bg-[#1A1A24] px-5 py-4 text-left transition hover:border-violet-500/50 hover:bg-white/5"
              >
                <div className="font-semibold text-white">Партнёр</div>
                <div className="mt-1 text-xs text-gray-500">Поиск партнёра по роли</div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-8 pt-8">
        <div
          className="sticky top-[calc(var(--site-header-height)+0.75rem)] hidden h-fit min-w-0 w-72 rounded-3xl border border-white/10 bg-[#12121A] p-6 lg:block"
        >
          <h3 className="mb-6 flex items-center gap-2 font-semibold">⚙ Фильтры</h3>

          <div className="mb-6">
            <p className="mb-3 text-sm text-gray-400">Категория (как в карточке)</p>
            <div className="flex flex-wrap gap-2">
              {allowedCategories.map((x) => {
                const on = selectedIndustries.has(x.value);
                return (
                  <button
                    key={x.value}
                    type="button"
                    onClick={() => {
                      setSelectedIndustries((prev) => {
                        const next = new Set(prev);
                        if (next.has(x.value)) next.delete(x.value);
                        else next.add(x.value);
                        return next;
                      });
                    }}
                    className={[
                      "cursor-pointer rounded-2xl px-4 py-2 text-xs transition",
                      on ? "bg-violet-600" : "bg-white/10 hover:bg-violet-600",
                    ].join(" ")}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm text-gray-400">Стадия</p>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              <option value="">Любая стадия</option>
              {stageFilterValues.map((v) => (
                <option key={v} value={v}>
                  {stageLabelsByLang.ru?.[v] ?? v}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm text-gray-400">Сумма привлечения</p>
            <div className="flex min-w-0 flex-col gap-3">
              <input
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                type="text"
                placeholder="от 500 тыс"
                className="box-border min-w-0 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
              />
              <input
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                type="text"
                placeholder="до 50 млн"
                className="box-border min-w-0 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3"
              />
            </div>
          </div>

          {activeTab === "startups" || activeTab === "ideas" ? (
            <div>
              <p className="mb-3 text-sm text-gray-400">Формат (онлайн / офлайн / гибрид)</p>
              <div className="flex flex-col gap-2 text-sm">
                {formatFilterValues.map((f) => {
                  const on = selectedFormats.has(f);
                  const label = formatLabelsByLang.ru?.[f] ?? f;
                  return (
                    <label key={f} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedFormats((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(f);
                            else next.delete(f);
                            return next;
                          });
                        }}
                        className="accent-violet-500"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-white/40">Ничего не отмечено — показываем все форматы.</div>
            </div>
          ) : null}

          {activeTab === "partners" ? (
            <div className="mt-6">
              <p className="mb-3 text-sm text-gray-400">Роль партнёра</p>
              <div className="flex flex-col gap-2 text-sm">
                {partnerRoles.map((r) => {
                  const on = selectedPartnerRoles.has(r);
                  const label = partnerRoleLabelsByLang.ru?.[r] ?? r;
                  return (
                    <label key={r} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedPartnerRoles((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(r);
                            else next.delete(r);
                            return next;
                          });
                        }}
                        className="accent-violet-500"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-white/40">Ничего не отмечено — все роли.</div>
            </div>
          ) : null}
        </div>

        <div className="flex-1">
          {loading ? <div className="py-12 text-gray-400">Загрузка…</div> : null}
          {dbError ? <div className="py-12 text-gray-400">База данных недоступна</div> : null}

          {!loading && !dbError ? (
            cards.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">В этой категории пока ничего нет</div>
            ) : (
              <div className="flex flex-col gap-4">
                {cards.map((it) => (
                  <Link
                    key={it.id}
                    href={it.href}
                    className="card-hover flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#161618] p-6 transition hover:border-violet-500/25 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold leading-snug text-white md:text-2xl">{it.title}</h3>
                      <p className="mt-2 text-base leading-relaxed text-gray-400">{it.desc}</p>
                      <div className="mt-4 text-sm">
                        {it.amount ? (
                          <span>
                            <span className="text-gray-500">Нужно:</span>{" "}
                            <span className="font-semibold text-white">{it.amount}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                      {it.pill ? (
                        <span
                          className={[
                            "whitespace-nowrap rounded-2xl px-4 py-1.5 text-xs font-medium",
                            it.pill.kind === "idea"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : it.pill.kind === "accent"
                                ? "bg-violet-500/20 text-violet-300"
                                : "bg-emerald-500/20 text-emerald-400",
                          ].join(" ")}
                        >
                          {it.pill.text}
                        </span>
                      ) : null}
                      {it.location ? (
                        <span className="text-sm font-medium text-violet-400 sm:text-right">{it.location}</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : null}

          <div className="mt-16 pb-24 text-center text-sm text-gray-500">
            <div>© {new Date().getFullYear()} StartupHub.ru — Маркетплейс</div>
            <div className="mt-2">Демо-версия страницы Маркетплейс с фильтрами, табами и поиском</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-7xl px-6 py-16 text-center text-gray-400">Загрузка маркетплейса…</div>}
    >
      <MarketplaceInner />
    </Suspense>
  );
}
