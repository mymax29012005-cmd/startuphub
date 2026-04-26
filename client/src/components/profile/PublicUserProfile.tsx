"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { accountTypeLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { extractTelegram, parseBioMeta, stripMetaLines } from "@/lib/profileBio";
import { useI18n } from "@/i18n/I18nProvider";
import type { Lang } from "@/i18n/dictionaries";
import { formatIndustryLine } from "@/lib/industryHierarchy";

export type PublicUserActivity = {
  kind: string;
  at: string;
  title: string;
  href: string | null;
  detail: string | null;
};

export type PublicUserPayload = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  accountType: "founder" | "investor" | "partner" | "buyer";
  role: "user" | "admin";
  createdAt: string;
  startupsCount: number;
  ideasCount: number;
  bannedAt?: string | null;
  bannedReason?: string | null;
  deletedAt?: string | null;
  deletedReason?: string | null;
};

type StartupListItem = {
  id: string;
  title: string;
  description: string;
  sector?: string;
  category: string;
  price: number;
  stage: string;
  auction: null | { currentPrice: number; endsAt: string };
};

function formatWhen(iso: string, lang: Lang) {
  try {
    const locale = lang === "zh" ? "zh-CN" : lang === "en" ? "en-US" : "ru-RU";
    return new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function activityDescription(t: (k: string) => string, a: PublicUserActivity) {
  const prefix = t(`userPublic.activity.${a.kind}`);
  const label = prefix.startsWith("userPublic.") ? a.kind : prefix;
  if (a.kind === "user_registered") {
    return label;
  }
  if (a.kind === "bid_placed") {
    return `${label}: «${a.title}»${a.detail != null ? ` — ${a.detail}` : ""}`;
  }
  if (a.kind === "review_written") {
    return `${label} ${a.title}${a.detail != null ? ` (${a.detail}★)` : ""}`;
  }
  if (a.kind === "favorite_added") {
    return `${label}: «${a.title}»`;
  }
  return `${label}: «${a.title}»`;
}

export function UserActivityFeed({ activities }: { activities: PublicUserActivity[] }) {
  const { lang, t } = useI18n();

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-white mb-3">{t("userPublic.activityTitle")}</h2>
      <Card className="p-6">
        {activities.length === 0 ? (
          <div className="text-sm text-[rgba(234,240,255,0.72)]">{t("userPublic.activityEmpty")}</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activities.map((a, idx) => (
              <li
                key={`${a.at}-${a.kind}-${idx}`}
                className="text-sm border-b border-[rgba(255,255,255,0.08)] pb-3 last:border-0 last:pb-0"
              >
                <div className="text-xs text-[rgba(234,240,255,0.55)] mb-1">{formatWhen(a.at, lang)}</div>
                {a.href ? (
                  <Link href={a.href} className="text-[rgba(234,240,255,0.92)] hover:text-white">
                    {activityDescription(t, a)}
                  </Link>
                ) : (
                  <span className="text-[rgba(234,240,255,0.92)]">{activityDescription(t, a)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

type Props = {
  userId: string;
  viewerId?: string | null;
};

export function PublicUserProfile({ userId, viewerId }: Props) {
  const { lang, t } = useI18n();
  const [user, setUser] = useState<PublicUserPayload | null>(null);
  const [activities, setActivities] = useState<PublicUserActivity[]>([]);
  const [startups, setStartups] = useState<StartupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"load" | "404" | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("profile-cosmic-bg");
    document.documentElement.classList.add("profile-cosmic-bg");
    return () => {
      document.body.classList.remove("profile-cosmic-bg");
      document.documentElement.classList.remove("profile-cosmic-bg");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/v1/users/${userId}`, { cache: "no-store" });
        if (r.status === 404) {
          if (!cancelled) setError("404");
          return;
        }
        if (!r.ok) {
          if (!cancelled) setError("load");
          return;
        }
        const data = (await r.json()) as { user: PublicUserPayload; activities: PublicUserActivity[] };
        if (!cancelled) {
          setUser(data.user);
          setActivities(data.activities ?? []);
        }
      } catch {
        if (!cancelled) setError("load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const st = await fetch(`/api/v1/startups?ownerId=${encodeURIComponent(userId)}`, { cache: "no-store" });
        if (st.ok) {
          const list = (await st.json()) as StartupListItem[];
          if (!cancelled) setStartups(list.slice(0, 4));
        }
      } catch {
        // ignore
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const subtitle = useMemo(() => {
    if (!user) return "";
    return accountTypeLabelsByLang[lang]?.[user.accountType] ?? user.accountType;
  }, [lang, user]);

  const bioText = useMemo(() => stripMetaLines(user?.bio ?? null), [user?.bio]);
  const tg = extractTelegram(user?.bio ?? null);
  const meta = useMemo(() => parseBioMeta(user?.bio ?? null), [user?.bio]);
  const locationLine = useMemo(() => [meta.country?.trim(), meta.city?.trim()].filter(Boolean).join(", "), [meta.city, meta.country]);

  const exitsCount = useMemo(() => startups.filter((s) => s.stage === "exit").length, [startups]);
  const bidsCount = useMemo(() => activities.filter((a) => a.kind === "bid_placed").length, [activities]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "—";
    try {
      return new Date(user.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return "—";
    }
  }, [user?.createdAt, lang]);

  if (loading) {
    return <div className="min-h-screen pt-28 max-w-7xl mx-auto px-6 pb-16 text-gray-400">Загрузка…</div>;
  }

  if (error === "404" || !user) {
    return (
      <div className="min-h-screen pt-28 max-w-7xl mx-auto px-6 pb-16 text-[rgba(234,240,255,0.72)]">
        {error === "404" ? t("userPublic.notFound") : t("userPublic.loadError")}
      </div>
    );
  }

  const isSelf = viewerId != null && viewerId === user.id;
  const isBanned = Boolean((user as any).bannedAt);
  const banReason = typeof (user as any).bannedReason === "string" ? String((user as any).bannedReason).trim() : "";

  return (
    <div className="text-white min-h-screen">
      <div className="pt-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-[#12121A] p-7 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="w-28 h-28 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-3xl overflow-hidden border-2 border-violet-500/25 shadow-2xl bg-white/5 shrink-0">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/40 text-sm">Нет фото</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold truncate">
                    <span className="hero-shine gradient-text" data-text={user.name}>
                      {user.name}
                    </span>
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isBanned ? (
                      <span className="group relative inline-flex items-center">
                        <span className="inline-flex items-center rounded-xl border border-yellow-400/30 bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-200">
                          Забанен
                        </span>
                        {banReason ? (
                          <span className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-[320px] -translate-x-1/2 -translate-y-full rounded-2xl border border-white/10 bg-[#0f0f17]/95 px-4 py-3 text-left text-xs text-gray-200 shadow-2xl backdrop-blur-md group-hover:block">
                            Причина: {banReason}
                            <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-r border-b border-white/10 bg-[#0f0f17]/95" />
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                        Активен
                      </span>
                    )}
                  </div>
                  <p className="text-violet-400 text-lg mt-1">{subtitle}</p>
                  <p className="text-gray-400 mt-1">{locationLine ? locationLine : "Профиль StartupHub"}</p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
                {!isSelf ? (
                  <Link
                    href={`/chat/${user.id}`}
                    className="w-full sm:w-auto px-7 py-4 rounded-3xl font-semibold text-white bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.18)]"
                  >
                    {t("userPublic.chatCta")}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-400 sm:self-center">{t("userPublic.chatSelf")}</div>
                )}
                <Link
                  href={`/users/${user.id}/startups`}
                  className="w-full sm:w-auto px-7 py-4 rounded-3xl font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition text-center"
                >
                  Стартапы
                </Link>
                <Link
                  href={`/users/${user.id}/ideas`}
                  className="w-full sm:w-auto px-7 py-4 rounded-3xl font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition text-center"
                >
                  Идеи
                </Link>
              </div>
            </div>

            <div className="mt-7">
              <div className="text-sm font-semibold text-white/90">
                <span className="hero-shine gradient-text" data-text="О себе">
                  О себе
                </span>
              </div>
              <p className="mt-3 text-gray-300 leading-relaxed">{bioText ? bioText : t("userPublic.bioEmpty")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {(
              [
                { k: "startups", n: user.startupsCount, color: "text-violet-400", label: "Стартапов", tip: "Количество выложенных стартапов" },
                {
                  k: "projects",
                  n: user.startupsCount + user.ideasCount,
                  color: "text-emerald-400",
                  label: "Проектов",
                  tip: "Стартапы + идеи (всего проектов)",
                },
                { k: "bids", n: bidsCount, color: "text-rose-400", label: "Ставок", tip: "Ставки в аукционах" },
              ] as const
            ).map((x) => (
              <div
                key={x.k}
                className="group relative card-hover transition bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center hover:border-violet-500/25"
              >
                <div className={["text-4xl font-bold", x.color].join(" ")}>{x.n}</div>
                <div className="text-sm text-gray-400 mt-2">{x.label}</div>

                <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-[260px] -translate-x-1/2 -translate-y-3/4 rounded-2xl border border-white/10 bg-[#0f0f17]/95 px-4 py-3 text-left text-xs text-gray-200 shadow-2xl backdrop-blur-md group-hover:block">
                  {x.tip}
                  <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-r border-b border-white/10 bg-[#0f0f17]/95" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#12121A] p-7 sm:p-8">
            <div className="flex items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-semibold">
                <span className="hero-shine gradient-text" data-text="Проекты">
                  Проекты
                </span>
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-xs text-white/40">На платформе с {memberSince}</div>
                <Link href={`/users/${user.id}/startups`} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                  Все стартапы →
                </Link>
              </div>
            </div>

            {startups.length === 0 ? (
              <div className="text-sm text-gray-400">Пока нет опубликованных стартапов.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {startups.map((s) => {
                  const stageLabel = stageLabelsByLang[lang]?.[s.stage] ?? s.stage;
                  const pill = s.auction ? "Аукцион" : "Активен";
                  return (
                    <Link
                      key={s.id}
                      href={`/startups/${s.id}`}
                      className="card-hover bg-white/5 border border-white/10 rounded-3xl p-6 block hover:border-violet-500/25 transition"
                    >
                      <div className="flex justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{s.title}</div>
                          <div className="text-sm text-emerald-400 mt-1 truncate">
                            {stageLabel} • {pill}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-2xl max-w-[min(200px,45%)] truncate">
                            {formatIndustryLine(s.sector, s.category)}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mt-4 line-clamp-3">{s.description}</p>
                      <div className="mt-6 text-xs text-gray-500">
                        {s.auction ? `Текущая ставка: ${s.auction.currentPrice.toLocaleString("ru-RU")} ₽` : `Цена: ${s.price.toLocaleString("ru-RU")} ₽`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
              <h3 className="font-semibold mb-6">
                <span className="hero-shine gradient-text" data-text="Навыки и экспертиза">
                  Навыки и экспертиза
                </span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {(meta.skills.length ? meta.skills : [accountTypeLabelsByLang[lang]?.[user.accountType] ?? user.accountType]).map((x) => (
                  <span key={x} className="bg-white/10 px-5 py-2 rounded-3xl text-sm">
                    {x}
                  </span>
                ))}
                {user.role === "admin" ? <Badge>admin</Badge> : null}
              </div>
              <div className="mt-4 text-xs text-white/40">Успешных exit: {exitsCount}</div>
            </div>

            <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
              <h3 className="font-semibold mb-6">
                <span className="hero-shine gradient-text" data-text="Ищу">
                  Ищу
                </span>
              </h3>
              <ul className="space-y-4 text-gray-300">
                {(meta.lookingFor.length ? meta.lookingFor : ["—"]).map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="text-violet-400 mt-1">→</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
              <h3 className="font-semibold mb-6">
                <span className="hero-shine gradient-text" data-text="Контакты">
                  Контакты
                </span>
              </h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="text-xl text-gray-400">✈</div>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-400">Telegram</div>
                    <div className="truncate">{tg ?? "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <UserActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
