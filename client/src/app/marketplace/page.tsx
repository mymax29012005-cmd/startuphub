"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";

import { MarketplaceIdeaRow, MarketplaceInvestorRow, MarketplacePartnerRow } from "@/components/marketplace/MarketplaceRows";
import { allowedCategories } from "@/lib/categories";
import { formatLabelsByLang, partnerRoleLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import type { IdeaProfileExtra, InvestorProfileExtra, PartnerProfileExtra } from "@/lib/marketplaceExtras";

type TabKey = "startups" | "ideas" | "investors" | "partners" | "my" | "moderation" | "users";

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
  owner?: { id: string; name: string; avatarUrl: string | null };
  profileExtra?: IdeaProfileExtra | null;
};

type InvestorItem = {
  id: string;
  industry: string;
  description: string;
  amount: number;
  status?: string;
  author?: { name: string; avatarUrl: string | null };
  profileExtra?: InvestorProfileExtra | null;
};

type PartnerItem = {
  id: string;
  role: "supplier" | "reseller" | "integration" | "cofounder";
  industry: string;
  description: string;
  author?: { name: string; avatarUrl: string | null };
  profileExtra?: PartnerProfileExtra | null;
};

type StartupCardVM = {
  id: string;
  href: string;
  title: string;
  desc: string;
  pill?: { text: string; kind: "startup" | "idea" | "accent" };
  amount?: string;
  location?: string;
};

const baseTabs: Array<{ key: Exclude<TabKey, "my" | "moderation">; label: string }> = [
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
  if (t === "ideas" || t === "investors" || t === "partners" || t === "startups" || t === "my" || t === "moderation" || t === "users") return t;
  return "startups";
}

type MeBrief = { id: string; role: "user" | "admin" };

type ModerationQueueItem = {
  type: "startup" | "idea" | "investor" | "partner" | "auction";
  id: string;
  status: "pending_moderation" | "needs_revision" | "rejected";
  title: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  revisionDate: string | null;
  adminComment: string | null;
  rejectedReason: string | null;
};

type MySubmissionItem = {
  type: "startup" | "idea" | "investor" | "partner" | "auction";
  id: string;
  title: string;
  moderationStatus: "draft" | "pending_moderation" | "needs_revision" | "rejected" | "published";
  adminComment: string | null;
  revisionDate: string | null;
  rejectedReason: string | null;
  updatedAt: string;
  createdAt: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  accountType: string;
  createdAt: string;
  emailVerifiedAt: string | null;
  bannedAt: string | null;
  bannedReason: string | null;
  deletedAt: string | null;
  deletedReason: string | null;
  startupsCount: number;
  ideasCount: number;
  investorRequestsCount: number;
  partnerRequestsCount: number;
};


function MarketplaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => tabFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("marketplace-cosmic-bg");
    document.documentElement.classList.add("marketplace-cosmic-bg");
    return () => {
      document.body.classList.remove("marketplace-cosmic-bg");
      document.documentElement.classList.remove("marketplace-cosmic-bg");
    };
  }, []);

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

  const [me, setMe] = useState<MeBrief | null>(null);
  const [moderationCount, setModerationCount] = useState<number>(0);
  const [queue, setQueue] = useState<ModerationQueueItem[] | null>(null);
  const [mySubmissions, setMySubmissions] = useState<MySubmissionItem[] | null>(null);
  const [modBusyId, setModBusyId] = useState<string | null>(null);
  const [modMsg, setModMsg] = useState<string | null>(null);
  const [modType, setModType] = useState<"" | ModerationQueueItem["type"]>("");
  const [modUserId, setModUserId] = useState("");
  const [modSelected, setModSelected] = useState<Set<string>>(new Set());

  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [modDialogMode, setModDialogMode] = useState<"revision" | "reject">("revision");
  const [modDialogText, setModDialogText] = useState("");
  const [modDialogItem, setModDialogItem] = useState<{ type: ModerationQueueItem["type"]; id: string } | null>(null);

  const [toast, setToast] = useState<{ text: string; kind: "ok" | "err" } | null>(null);

  const [usersQ, setUsersQ] = useState("");
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [usersBusyId, setUsersBusyId] = useState<string | null>(null);
  const [usersShowDeleted, setUsersShowDeleted] = useState(false);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<"ban" | "delete">("ban");
  const [userDialogReason, setUserDialogReason] = useState("");
  const [userDialogTarget, setUserDialogTarget] = useState<AdminUserRow | null>(null);

  const visibleTabs = useMemo(() => {
    const out: Array<{ key: TabKey; label: string }> = [...baseTabs];
    if (me?.id && me?.role !== "admin") out.push({ key: "my", label: "Ожидают подтверждения" });
    if (me?.role === "admin") {
      out.push({ key: "moderation", label: "На проверке" });
      out.push({ key: "users", label: "Список пользователей" });
    }
    return out;
  }, [me?.id, me?.role]);

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

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include", cache: "no-store", headers: { "Cache-Control": "no-store" } });
        if (!r.ok) return;
        const data = (await r.json()) as { id: string; role: "user" | "admin" };
        if (!cancelled) setMe({ id: data.id, role: data.role });
      } catch {
        // ignore
      }
    }
    void loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (me?.role !== "admin") return;
    let cancelled = false;
    async function tick() {
      try {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        const r = await fetch("/api/v1/moderation/queue/count", { credentials: "include", cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as { pending?: number; total?: number };
        if (!cancelled) setModerationCount(typeof data.pending === "number" ? data.pending : 0);
      } catch {
        // ignore
      }
    }
    // Only poll frequently while admin is on moderation tab. Otherwise, keep it light.
    void tick();
    const period = activeTab === "moderation" ? 30000 : 120000;
    const t = window.setInterval(() => void tick(), period);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [me?.role, activeTab]);

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
      if (tab === "my" && mySubmissions === null) {
        const r = await fetch("/api/v1/moderation/my", { credentials: "include", cache: "no-store" });
        if (!r.ok) throw new Error("db");
        setMySubmissions((await r.json()) as MySubmissionItem[]);
      }
      if (tab === "users" && users === null) {
        const qs = new URLSearchParams();
        if (usersQ.trim()) qs.set("q", usersQ.trim());
        if (usersShowDeleted) qs.set("showDeleted", "true");
        const r = await fetch(`/api/v1/admin/users?${qs.toString()}`, { credentials: "include", cache: "no-store" });
        const data = (await r.json().catch(() => ({}))) as { items?: AdminUserRow[]; total?: number; error?: string };
        if (!r.ok) throw new Error(data.error ?? "db");
        setUsers(Array.isArray(data.items) ? data.items : []);
        setUsersTotal(typeof data.total === "number" ? data.total : 0);
      }
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setDbError(false);
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (usersQ.trim()) qs.set("q", usersQ.trim());
      if (usersShowDeleted) qs.set("showDeleted", "true");
      const r = await fetch(`/api/v1/admin/users?${qs.toString()}`, { credentials: "include", cache: "no-store" });
      const data = (await r.json().catch(() => ({}))) as { items?: AdminUserRow[]; total?: number; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Ошибка");
      setUsers(Array.isArray(data.items) ? data.items : []);
      setUsersTotal(typeof data.total === "number" ? data.total : 0);
    } catch (e) {
      setToast({ kind: "err", text: e instanceof Error ? e.message : "Ошибка" });
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadModerationQueue() {
    setDbError(false);
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (modType) qs.set("type", modType);
      if (modUserId.trim()) qs.set("userId", modUserId.trim());
      qs.set("status", "all");
      const r = await fetch(`/api/v1/moderation/queue?${qs.toString()}`, { credentials: "include", cache: "no-store" });
      if (!r.ok) throw new Error("db");
      const all = (await r.json()) as ModerationQueueItem[];
      setQueue(all);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "moderation") {
      void loadModerationQueue();
    } else if (activeTab === "users") {
      void loadUsers();
    } else {
      void ensureLoaded(activeTab);
    }
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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const totalCount = (startups?.length ?? 0) + (ideas?.length ?? 0) + (investors?.length ?? 0) + (partners?.length ?? 0);

  const filterCtx = useMemo(() => {
    return {
      q: search.trim().toLowerCase(),
      inds: selectedIndustries,
      formats: selectedFormats,
      partnerRolesSel: selectedPartnerRoles,
      min: parseMoney(amountMin),
      max: parseMoney(amountMax),
    };
  }, [search, selectedIndustries, selectedFormats, selectedPartnerRoles, amountMin, amountMax]);

  function matchesBase(q: string, texts: string[]) {
    if (!q) return true;
    const blob = texts.join(" ").toLowerCase();
    return blob.includes(q);
  }

  function matchesAmount(min: number | null, max: number | null, v: number | null) {
    if (v == null) return true;
    if (min != null && v < min) return false;
    if (max != null && v > max) return false;
    return true;
  }

  function investorComparableAmount(x: InvestorItem) {
    const pe = x.profileExtra;
    if (pe?.checkMax != null) return pe.checkMax;
    if (pe?.checkMin != null) return pe.checkMin;
    return x.amount;
  }

  const startupCards: StartupCardVM[] = useMemo(() => {
    const { q, inds, formats, min, max } = filterCtx;
    const list = startups ?? [];
    return list
      .filter((x) => {
        if (!matchesBase(q, [x.title, x.description, x.tagline ?? "", x.category])) return false;
        if (inds.size > 0 && !inds.has(x.category)) return false;
        if (stage && x.stage !== stage) return false;
        if (!matchesAmount(min, max, x.price)) return false;
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
  }, [filterCtx, startups, stage]);

  const filteredIdeas: IdeaItem[] = useMemo(() => {
    const { q, inds, formats, min, max } = filterCtx;
    const list = ideas ?? [];
    return list.filter((x) => {
      const pe = x.profileExtra ?? null;
      if (
        !matchesBase(q, [
          x.title,
          x.description,
          x.category,
          pe?.city ?? "",
          ...(pe?.helpTags ?? []),
        ])
      )
        return false;
      if (inds.size > 0 && !inds.has(x.category)) return false;
      if (stage && x.stage !== stage) return false;
      if (!matchesAmount(min, max, x.price)) return false;
      if (formats.size > 0) {
        const fmt = x.format ?? "online";
        if (!formats.has(fmt)) return false;
      }
      return true;
    });
  }, [filterCtx, ideas, stage]);

  const filteredInvestors: InvestorItem[] = useMemo(() => {
    const { q, inds, min, max } = filterCtx;
    const list = investors ?? [];
    return list.filter((x) => {
      const pe = x.profileExtra ?? null;
      if (
        !matchesBase(q, [
          x.industry,
          x.description,
          pe?.investorName ?? "",
          pe?.investorTitle ?? "",
          ...(pe?.interests ?? []),
        ])
      )
        return false;
      if (inds.size > 0 && !inds.has(x.industry)) return false;
      if (!matchesAmount(min, max, investorComparableAmount(x))) return false;
      return true;
    });
  }, [filterCtx, investors]);

  const filteredPartners: PartnerItem[] = useMemo(() => {
    const { q, inds, partnerRolesSel } = filterCtx;
    const list = partners ?? [];
    return list.filter((x) => {
      const pe = x.profileExtra ?? null;
      const svc = (pe?.services ?? []).map((s) => s.title);
      if (
        !matchesBase(q, [
          x.industry,
          x.role,
          x.description,
          pe?.partnerName ?? "",
          pe?.partnerType ?? "",
          pe?.helpText ?? "",
          ...svc,
          ...(pe?.fitFor ?? []),
        ])
      )
        return false;
      if (inds.size > 0 && !inds.has(x.industry)) return false;
      if (partnerRolesSel.size > 0 && !partnerRolesSel.has(x.role)) return false;
      return true;
    });
  }, [filterCtx, partners]);

  const listIsEmpty =
    activeTab === "my"
      ? (mySubmissions?.length ?? 0) === 0
      : activeTab === "moderation"
        ? (queue?.length ?? 0) === 0
        : activeTab === "users"
          ? false
        : activeTab === "startups"
          ? startupCards.length === 0
          : activeTab === "ideas"
            ? filteredIdeas.length === 0
            : activeTab === "investors"
              ? filteredInvestors.length === 0
              : filteredPartners.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {toast ? (
        <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-24 pointer-events-none">
          <div
            className={[
              "pointer-events-none rounded-3xl border px-6 py-4 text-sm font-semibold shadow-2xl backdrop-blur-md",
              toast.kind === "ok"
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                : "border-rose-400/20 bg-rose-500/10 text-rose-200",
            ].join(" ")}
          >
            {toast.text}
          </div>
        </div>
      ) : null}
      <div className="border-b border-white/10 py-8 sm:py-12">
        <h1 className="mb-3 text-3xl font-bold tracking-tighter sm:text-4xl md:text-6xl">Маркетплейс</h1>
        <p className="max-w-2xl text-base text-gray-400 sm:text-lg md:text-xl">
          {totalCount > 0
            ? `Более ${totalCount} стартапов, идей, инвесторов и партнёров в одном месте`
            : "Стартапы, идеи, инвесторы и партнёры в одном месте — аукционы в отдельном разделе «Аукционы»"}
        </p>

        <div className="relative mt-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#12121A] px-4 py-4 shadow-xl sm:flex-row sm:items-center sm:px-6 sm:py-5">
            <span className="text-xl text-gray-400">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Поиск по названию, отрасли, ключевому слову..."
              className="w-full flex-1 bg-transparent text-base outline-none placeholder-gray-500 sm:w-auto sm:text-lg"
            />
            <button
              type="button"
              className="w-full rounded-2xl bg-violet-600 px-6 py-3 text-sm font-medium hover:bg-violet-500 sm:w-auto sm:px-8 sm:text-base"
              onClick={() => void ensureLoaded(activeTab)}
            >
              Найти
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 sm:mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4 overflow-visible">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-visible pr-2 py-2 sm:gap-6 md:gap-8">
          {visibleTabs.map((t) => {
            const active = t.key === activeTab;
            return (
              <Link
                key={t.key}
                href={`/marketplace?tab=${t.key}`}
                scroll={false}
                className={[
                  "relative overflow-visible whitespace-nowrap px-3 py-2 text-sm transition sm:px-6 sm:py-3 sm:text-lg",
                  active ? "border-b-[3px] border-[#7C3AED] font-semibold text-white" : "text-gray-400 hover:text-white",
                ].join(" ")}
              >
                {t.label}
                {t.key === "moderation" && moderationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.65)]" />
                ) : null}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setPostModalOpen(true)}
          className="relative z-10 w-full shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 sm:w-auto md:px-8 md:text-base"
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
                <div className="mt-1 text-xs text-gray-500">Профиль: чек, стадии, опыт</div>
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

      {modDialogOpen && modDialogItem ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 px-4 py-8" role="presentation" onClick={() => setModDialogOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#12121A] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl font-bold text-white">
                  {modDialogMode === "revision" ? "Отправить на доработку" : "Отклонить заявку"}
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  {modDialogMode === "revision"
                    ? "Комментарий увидит пользователь. Он сможет внести правки и отправить повторно."
                    : "Причина обязательна. Заявка будет отклонена."}
                </div>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
                onClick={() => setModDialogOpen(false)}
              >
                ✕
              </button>
            </div>

            {modDialogMode === "revision" ? (
              <div className="mt-6">
                <div className="text-xs text-white/40 mb-2">Шаблон</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Добавьте описание traction / команды / рынка",
                    "Уберите рекламный текст, эмодзи, капс",
                    "Нужно больше деталей по финансам / MVP",
                    "Нарушение правил публикации",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setModDialogText(t)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/10"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="text-xs text-white/40 mb-2">{modDialogMode === "revision" ? "Комментарий" : "Причина"}</div>
              <textarea
                value={modDialogText}
                onChange={(e) => setModDialogText(e.target.value)}
                className="w-full min-h-[120px] rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/40"
                placeholder={modDialogMode === "revision" ? "Напишите, что нужно исправить…" : "Опишите причину отклонения…"}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setModDialogOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!modDialogText.trim()}
                onClick={async () => {
                  const text = modDialogText.trim();
                  if (!text) return;
                  setModBusyId(modDialogItem.id);
                  setModMsg(null);
                  try {
                    const r =
                      modDialogMode === "revision"
                        ? await fetch("/api/v1/moderation/revision", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ item: modDialogItem, comment: text }),
                          })
                        : await fetch("/api/v1/moderation/reject", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ item: modDialogItem, reason: text }),
                          });
                    const data = (await r.json().catch(() => ({}))) as { error?: string };
                    if (!r.ok) throw new Error(data.error ?? "Ошибка");
                    setModDialogOpen(false);
                    setModDialogText("");
                    setModDialogItem(null);
                    await loadModerationQueue();
                    setToast({ kind: "ok", text: modDialogMode === "revision" ? "Отправлено на доработку" : "Отклонено" });
                  } catch (e) {
                    setToast({ kind: "err", text: e instanceof Error ? e.message : "Ошибка" });
                  } finally {
                    setModBusyId(null);
                  }
                }}
                className={[
                  "rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60",
                  modDialogMode === "revision"
                    ? "bg-amber-500/20 hover:bg-amber-500/25 text-amber-200 border border-amber-500/20"
                    : "bg-rose-500/20 hover:bg-rose-500/25 text-rose-200 border border-rose-500/20",
                ].join(" ")}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {userDialogOpen && userDialogTarget ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 px-4 py-8" role="presentation" onClick={() => setUserDialogOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#12121A] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl font-bold text-white">{userDialogMode === "ban" ? "Заблокировать пользователя" : "Удалить пользователя"}</div>
                <div className="mt-1 text-sm text-gray-400">
                  {userDialogMode === "ban"
                    ? "Пользователь не сможет писать в чат и отправлять карточки."
                    : "Аккаунт будет помечен удалённым, а все данные пользователя (карточки/чаты/избранное) будут удалены. При попытке входа увидит причину."}
                </div>
                <div className="mt-3 text-sm text-white/80">
                  {userDialogTarget.name} — {userDialogTarget.email ?? userDialogTarget.phone ?? userDialogTarget.id}
                </div>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
                onClick={() => setUserDialogOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              <div className="text-xs text-white/40 mb-2">Причина (обязательно)</div>
              <textarea
                value={userDialogReason}
                onChange={(e) => setUserDialogReason(e.target.value)}
                className="w-full min-h-[120px] rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/40"
                placeholder={userDialogMode === "ban" ? "Например: спам / мошенничество / нарушение правил…" : "Например: мультиаккаунт / спам / нарушение правил…"}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setUserDialogOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!userDialogReason.trim() || usersBusyId === userDialogTarget.id}
                onClick={async () => {
                  const reason = userDialogReason.trim();
                  if (!reason) return;
                  setUsersBusyId(userDialogTarget.id);
                  try {
                    const r =
                      userDialogMode === "ban"
                        ? await fetch(`/api/v1/admin/users/${encodeURIComponent(userDialogTarget.id)}/ban`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ reason }),
                          })
                        : await fetch(`/api/v1/admin/users/${encodeURIComponent(userDialogTarget.id)}`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ reason }),
                          });
                    const data = (await r.json().catch(() => ({}))) as { error?: string };
                    if (!r.ok) throw new Error(data.error ?? "Ошибка");
                    setUserDialogOpen(false);
                    setUserDialogReason("");
                    setUserDialogTarget(null);
                    await loadUsers();
                    setToast({ kind: "ok", text: userDialogMode === "ban" ? "Пользователь заблокирован" : "Пользователь удалён" });
                  } catch (e) {
                    setToast({ kind: "err", text: e instanceof Error ? e.message : "Ошибка" });
                  } finally {
                    setUsersBusyId(null);
                  }
                }}
                className={[
                  "rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-60",
                  userDialogMode === "ban"
                    ? "bg-amber-500/15 hover:bg-amber-500/20 text-amber-200 border border-amber-500/20"
                    : "bg-rose-500/15 hover:bg-rose-500/20 text-rose-200 border border-rose-500/20",
                ].join(" ")}
              >
                {usersBusyId === userDialogTarget.id ? "…" : userDialogMode === "ban" ? "Заблокировать" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-8 pt-8">
        <div className="sticky top-[calc(var(--site-header-height)+0.75rem)] hidden h-fit min-w-0 w-72 rounded-3xl border border-white/10 bg-[#12121A] p-6 lg:block">
          {activeTab === "my" || activeTab === "moderation" ? (
            <div className="text-sm text-gray-300">
              <div className="font-semibold text-white">{activeTab === "my" ? "Ваши заявки" : "Очередь модерации"}</div>
              <div className="mt-2 text-gray-400">
                {activeTab === "my"
                  ? "Здесь видны черновики и карточки на проверке/доработке."
                  : "Откройте карточку, чтобы увидеть финальный вид. Одобрите, отправьте на доработку или отклоните."}
              </div>
              {modMsg ? <div className="mt-3 text-xs text-emerald-300">{modMsg}</div> : null}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex-1">
          {loading ? <div className="py-12 text-gray-400">Загрузка…</div> : null}
          {dbError ? <div className="py-12 text-gray-400">База данных недоступна</div> : null}

          {!loading && !dbError ? (
            activeTab !== "my" && activeTab !== "moderation" && listIsEmpty ? (
              <div className="col-span-full py-12 text-center text-gray-400">В этой категории пока ничего нет</div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeTab === "my"
                  ? (mySubmissions ?? []).map((x) => {
                      const statusLabel =
                        x.moderationStatus === "draft"
                          ? "Черновик"
                          : x.moderationStatus === "pending_moderation"
                            ? "На модерации"
                            : x.moderationStatus === "needs_revision"
                              ? "Требует доработки"
                              : x.moderationStatus === "rejected"
                                ? "Отклонено"
                                : "Опубликовано";

                      const href =
                        x.type === "startup"
                          ? `/startups/${x.id}/edit`
                          : x.type === "idea"
                            ? `/ideas/${x.id}/edit`
                            : x.type === "investor"
                              ? `/investors/${x.id}/edit`
                            : x.type === "partner"
                              ? `/partners/${x.id}/edit`
                              : `/auction/${x.id}`;
                      const hrefWithReturnTo = `${href}?returnTo=${encodeURIComponent("/marketplace?tab=my")}`;

                      const canResubmit = x.moderationStatus === "needs_revision" || x.moderationStatus === "draft";
                      const note = x.adminComment || x.rejectedReason;
                      return (
                        <div key={x.type + ":" + x.id} className="rounded-3xl border border-white/10 bg-[#161618] p-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="text-xs text-white/40">{x.type.toUpperCase()}</div>
                              <div className="mt-1 truncate text-xl font-semibold text-white">{x.title}</div>
                              <div className="mt-2 text-sm text-gray-300">
                                Статус:{" "}
                                <span
                                  className={[
                                    "rounded-2xl px-3 py-1 text-xs font-semibold",
                                    x.moderationStatus === "needs_revision"
                                      ? "bg-amber-500/20 text-amber-300"
                                      : x.moderationStatus === "pending_moderation"
                                        ? "bg-violet-500/20 text-violet-300"
                                        : x.moderationStatus === "rejected"
                                          ? "bg-rose-500/20 text-rose-300"
                                          : "bg-white/10 text-white/70",
                                  ].join(" ")}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                              {note ? <div className="mt-3 text-sm text-gray-400">Комментарий: {note}</div> : null}
                            </div>
                            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                              <Link
                                href={hrefWithReturnTo}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                              >
                                Редактировать
                              </Link>
                              {canResubmit ? (
                                <button
                                  type="button"
                                  disabled={modBusyId === x.id}
                                  onClick={async () => {
                                    setModBusyId(x.id);
                                    setModMsg(null);
                                    try {
                                      const r = await fetch("/api/v1/moderation/submit", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ type: x.type, id: x.id }),
                                      });
                                      const data = (await r.json().catch(() => ({}))) as { error?: string };
                                      if (!r.ok) throw new Error(data.error ?? "Ошибка");
                                      setMySubmissions(null);
                                      await ensureLoaded("my");
                                      setModMsg("Отправлено на модерацию");
                                    } catch (e) {
                                      setModMsg(e instanceof Error ? e.message : "Ошибка");
                                    } finally {
                                      setModBusyId(null);
                                    }
                                  }}
                                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                  {modBusyId === x.id ? "…" : "Отправить повторно"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : null}

                {activeTab === "moderation"
                  ? (
                      <>
                        <div className="rounded-3xl border border-white/10 bg-[#161618] p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                              <div>
                                <div className="text-xs text-white/40 mb-1">Тип</div>
                                <select
                                  value={modType}
                                  onChange={(e) => {
                                    setModSelected(new Set());
                                    setModType(e.target.value as any);
                                  }}
                                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                                >
                                  <option value="">Все</option>
                                  <option value="startup">Стартап</option>
                                  <option value="idea">Идея</option>
                                  <option value="investor">Инвестор</option>
                                  <option value="partner">Партнёр</option>
                                  <option value="auction">Аукцион</option>
                                </select>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs text-white/40 mb-1">User ID (uuid)</div>
                                <input
                                  value={modUserId}
                                  onChange={(e) => setModUserId(e.target.value)}
                                  className="min-w-0 w-full sm:w-[320px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                                  placeholder="опционально"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  void loadModerationQueue();
                                }}
                                className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                              >
                                Применить
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={modSelected.size === 0}
                              onClick={async () => {
                                const items = (queue ?? [])
                                  .filter((x) => modSelected.has(`${x.type}:${x.id}`))
                                  .map((x) => ({ type: x.type, id: x.id }));
                                if (!items.length) return;
                                setModMsg(null);
                                setModBusyId("bulk");
                                try {
                                  const r = await fetch("/api/v1/moderation/approve/bulk", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ items }),
                                  });
                                  const data = (await r.json().catch(() => ({}))) as { error?: string };
                                  if (!r.ok) throw new Error(data.error ?? "Ошибка");
                                  setModSelected(new Set());
                                  await loadModerationQueue();
                                  setModMsg("Массовое одобрение выполнено");
                                } catch (e) {
                                  setModMsg(e instanceof Error ? e.message : "Ошибка");
                                } finally {
                                  setModBusyId(null);
                                }
                              }}
                              className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
                            >
                              Одобрить выбранные ({modSelected.size})
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const all = queue ?? [];
                          const active = all.filter((x) => x.status === "pending_moderation");
                          const revision = all.filter((x) => x.status === "needs_revision");
                          const rejected = all.filter((x) => x.status === "rejected");

                          function renderRow(x: ModerationQueueItem, opts: { showActions: boolean; showCheckbox: boolean }) {
                            const href =
                              x.type === "startup"
                                ? `/startups/${x.id}`
                                : x.type === "idea"
                                  ? `/ideas/${x.id}`
                                  : x.type === "investor"
                                    ? `/investors/${x.id}`
                                    : x.type === "partner"
                                      ? `/partners/${x.id}`
                                      : `/auction/${x.id}`;
                            const hrefWithReturnTo = `${href}?returnTo=${encodeURIComponent("/marketplace?tab=moderation")}`;
                            const overdue48h = Date.now() - new Date(x.createdAt).getTime() > 48 * 60 * 60 * 1000;
                            const selKey = `${x.type}:${x.id}`;
                            const on = modSelected.has(selKey);
                            const note = x.status === "rejected" ? x.rejectedReason : x.adminComment;

                            return (
                              <div key={x.type + ":" + x.id} className="rounded-3xl border border-white/10 bg-[#161618] p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                                      {opts.showCheckbox ? (
                                        <label className="flex items-center gap-2 mr-1">
                                          <input
                                            type="checkbox"
                                            checked={on}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              setModSelected((prev) => {
                                                const next = new Set(prev);
                                                if (checked) next.add(selKey);
                                                else next.delete(selKey);
                                                return next;
                                              });
                                            }}
                                            className="accent-violet-500"
                                          />
                                        </label>
                                      ) : null}
                                      <span className="rounded-xl bg-white/5 px-2 py-1">{x.type.toUpperCase()}</span>
                                      <span>от {x.userName}</span>
                                      {overdue48h && x.status === "pending_moderation" ? (
                                        <span className="rounded-xl bg-rose-500/20 px-2 py-1 text-rose-300">48ч+</span>
                                      ) : null}
                                      <span
                                        className={[
                                          "rounded-xl px-2 py-1",
                                          x.status === "pending_moderation"
                                            ? "bg-violet-500/15 text-violet-200"
                                            : x.status === "needs_revision"
                                              ? "bg-amber-500/15 text-amber-200"
                                              : "bg-rose-500/15 text-rose-200",
                                        ].join(" ")}
                                      >
                                        {x.status === "pending_moderation"
                                          ? "На модерации"
                                          : x.status === "needs_revision"
                                            ? "На доработке"
                                            : "Отклонено"}
                                      </span>
                                    </div>
                                    <Link href={hrefWithReturnTo} className="mt-2 block truncate text-xl font-semibold text-white hover:text-violet-300">
                                      {x.title}
                                    </Link>
                                    {note ? (
                                      <div className="mt-2 text-sm text-gray-400">
                                        {x.status === "rejected" ? "Причина: " : "Комментарий: "}
                                        {note}
                                      </div>
                                    ) : null}
                                  </div>

                                  {opts.showActions ? (
                                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                      <button
                                        type="button"
                                        disabled={modBusyId === x.id}
                                        onClick={async () => {
                                          setModBusyId(x.id);
                                          setModMsg(null);
                                          try {
                                            const r = await fetch("/api/v1/moderation/approve", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              credentials: "include",
                                              body: JSON.stringify({ type: x.type, id: x.id }),
                                            });
                                            const data = (await r.json().catch(() => ({}))) as { error?: string };
                                            if (!r.ok) throw new Error(data.error ?? "Ошибка");
                                            await loadModerationQueue();
                                            setModMsg("Одобрено");
                                          } catch (e) {
                                            setModMsg(e instanceof Error ? e.message : "Ошибка");
                                          } finally {
                                            setModBusyId(null);
                                          }
                                        }}
                                        className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
                                      >
                                        {modBusyId === x.id ? "…" : "Одобрить"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={modBusyId === x.id}
                                        onClick={() => {
                                          setModDialogMode("revision");
                                          setModDialogItem({ type: x.type, id: x.id });
                                          setModDialogText("Добавьте описание traction / команды / рынка");
                                          setModDialogOpen(true);
                                        }}
                                        className="rounded-2xl bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-60"
                                      >
                                        На доработку
                                      </button>
                                      <button
                                        type="button"
                                        disabled={modBusyId === x.id}
                                        onClick={() => {
                                          setModDialogMode("reject");
                                          setModDialogItem({ type: x.type, id: x.id });
                                          setModDialogText("Нарушение правил публикации");
                                          setModDialogOpen(true);
                                        }}
                                        className="rounded-2xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
                                      >
                                        Отклонить
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          }

                          const section = (title: string, items: ModerationQueueItem[], hint?: string) => (
                            <div className="mt-6">
                              <div className="mb-3 flex items-end justify-between gap-3">
                                <div>
                                  <div className="text-lg font-semibold text-white">{title}</div>
                                  {hint ? <div className="mt-1 text-xs text-white/40">{hint}</div> : null}
                                </div>
                                <div className="text-xs text-white/40">{items.length}</div>
                              </div>
                              {items.length === 0 ? (
                                <div className="rounded-3xl border border-white/10 bg-[#161618] p-6 text-gray-400">Пусто.</div>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  {items.map((x) =>
                                    renderRow(x, {
                                      showActions: x.status === "pending_moderation",
                                      showCheckbox: x.status === "pending_moderation",
                                    }),
                                  )}
                                </div>
                              )}
                            </div>
                          );

                          return (
                            <>
                              {section("Активные заявки", active, "Тут можно одобрить / отправить на доработку / отклонить.")}
                              {section("Отправлены на доработку", revision, "Пока пользователь не отправит повторно — карточка хранится здесь (без действий).")}
                              {section("Отклонённые", rejected, "Отклонённые заявки (без действий).")}
                            </>
                          );
                        })()}
                      </>
                    ) : null}

                {activeTab === "users" ? (
                  <>
                    <div className="rounded-3xl border border-white/10 bg-[#161618] p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="min-w-0">
                            <div className="text-xs text-white/40 mb-1">Поиск</div>
                            <input
                              value={usersQ}
                              onChange={(e) => setUsersQ(e.target.value)}
                              className="min-w-0 w-full sm:w-[360px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
                              placeholder="email / имя / телефон"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={usersShowDeleted}
                              onChange={(e) => setUsersShowDeleted(e.target.checked)}
                              className="accent-violet-500"
                            />
                            Показывать удалённых
                          </label>
                          <button
                            type="button"
                            onClick={() => void loadUsers()}
                            className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                          >
                            Обновить
                          </button>
                        </div>
                        <div className="text-xs text-white/40">Всего: {usersTotal}</div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4">
                      {(users ?? []).map((u) => {
                        const banned = !!u.bannedAt;
                        const deleted = !!u.deletedAt;
                        const badge = deleted ? "Удалён" : banned ? "Заблокирован" : "Активен";
                        const badgeCls = deleted
                          ? "bg-rose-500/15 text-rose-200"
                          : banned
                            ? "bg-amber-500/15 text-amber-200"
                            : "bg-emerald-500/15 text-emerald-200";
                        return (
                          <div key={u.id} className="rounded-3xl border border-white/10 bg-[#161618] p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                                  <span className={["rounded-xl px-2 py-1", badgeCls].join(" ")}>{badge}</span>
                                  {u.role === "admin" ? <span className="rounded-xl bg-violet-500/15 px-2 py-1 text-violet-200">ADMIN</span> : null}
                                  {u.emailVerifiedAt ? (
                                    <span className="rounded-xl bg-emerald-500/10 px-2 py-1 text-emerald-200">email ok</span>
                                  ) : (
                                    <span className="rounded-xl bg-white/5 px-2 py-1 text-white/70">email pending</span>
                                  )}
                                </div>
                                <div className="mt-2 truncate text-xl font-semibold text-white">{u.name}</div>
                                <div className="mt-1 text-sm text-gray-300">
                                  {u.email ?? "—"} {u.phone ? <span className="text-gray-500">· {u.phone}</span> : null}
                                </div>
                                <div className="mt-3 text-xs text-white/50">
                                  Стартапы: {u.startupsCount} · Идеи: {u.ideasCount} · Инвесторы: {u.investorRequestsCount} · Партнёры: {u.partnerRequestsCount}
                                </div>
                                {u.bannedAt ? <div className="mt-2 text-sm text-amber-200">Причина блокировки: {u.bannedReason ?? "—"}</div> : null}
                                {u.deletedAt ? <div className="mt-2 text-sm text-rose-200">Причина удаления: {u.deletedReason ?? "—"}</div> : null}
                              </div>
                              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                {!deleted ? (
                                  banned ? (
                                    <button
                                      type="button"
                                      disabled={usersBusyId === u.id}
                                      onClick={async () => {
                                        setUsersBusyId(u.id);
                                        try {
                                          const r = await fetch(`/api/v1/admin/users/${encodeURIComponent(u.id)}/unban`, {
                                            method: "POST",
                                            credentials: "include",
                                          });
                                          const data = (await r.json().catch(() => ({}))) as { error?: string };
                                          if (!r.ok) throw new Error(data.error ?? "Ошибка");
                                          await loadUsers();
                                          setToast({ kind: "ok", text: "Пользователь разблокирован" });
                                        } catch (e) {
                                          setToast({ kind: "err", text: e instanceof Error ? e.message : "Ошибка" });
                                        } finally {
                                          setUsersBusyId(null);
                                        }
                                      }}
                                      className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                                    >
                                      Разбанить
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={usersBusyId === u.id}
                                      onClick={() => {
                                        setUserDialogMode("ban");
                                        setUserDialogTarget(u);
                                        setUserDialogReason("Нарушение правил публикации");
                                        setUserDialogOpen(true);
                                      }}
                                      className="rounded-2xl bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                                    >
                                      Забанить
                                    </button>
                                  )
                                ) : null}
                                <button
                                  type="button"
                                  disabled={usersBusyId === u.id || u.role === "admin"}
                                  onClick={() => {
                                    setUserDialogMode("delete");
                                    setUserDialogTarget(u);
                                    setUserDialogReason("Нарушение правил платформы");
                                    setUserDialogOpen(true);
                                  }}
                                  className="rounded-2xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(users ?? []).length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-[#161618] p-6 text-gray-400">Пользователи не найдены.</div>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {activeTab === "startups"
                  ? startupCards.map((it) => (
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
                    ))
                  : null}
                {activeTab === "ideas" ? filteredIdeas.map((x) => <MarketplaceIdeaRow key={x.id} idea={x} />) : null}
                {activeTab === "investors" ? filteredInvestors.map((x) => <MarketplaceInvestorRow key={x.id} item={x} />) : null}
                {activeTab === "partners" ? filteredPartners.map((x) => <MarketplacePartnerRow key={x.id} item={x} />) : null}
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
