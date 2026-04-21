"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { accountTypeLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { extractTelegram, stripMetaLines } from "@/lib/profileBio";
import { useI18n } from "@/i18n/I18nProvider";
import type { Lang } from "@/i18n/dictionaries";

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
};

type StartupListItem = {
  id: string;
  title: string;
  description: string;
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
    return <div className="bg-[#0A0A0F] min-h-screen pt-28 max-w-7xl mx-auto px-6 pb-16 text-gray-400">Загрузка…</div>;
  }

  if (error === "404" || !user) {
    return (
      <div className="bg-[#0A0A0F] min-h-screen pt-28 max-w-7xl mx-auto px-6 pb-16 text-[rgba(234,240,255,0.72)]">
        {error === "404" ? t("userPublic.notFound") : t("userPublic.loadError")}
      </div>
    );
  }

  const isSelf = viewerId != null && viewerId === user.id;

  return (
    <div className="bg-[#0A0A0F] text-white min-h-screen">
      <div className="pt-10 max-w-7xl mx-auto px-6 pb-16">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="md:w-80 shrink-0 w-full">
            <div className="relative">
              <div className="w-48 h-48 mx-auto md:mx-0 rounded-3xl overflow-hidden border-4 border-violet-500/30 shadow-2xl bg-white/5">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/40 text-sm">Нет фото</div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center md:text-left">
              <h1 className="text-4xl font-bold">{user.name}</h1>
              <p className="text-violet-400 text-lg mt-1">{subtitle}</p>
              <p className="text-gray-400 mt-1">Профиль StartupHub</p>
            </div>

            <div className="mt-8 flex justify-center md:justify-start gap-4 flex-wrap">
              {!isSelf ? (
                <Link
                  href={`/chat/${user.id}`}
                  className="flex-1 md:flex-none min-w-[10rem] px-8 py-4 rounded-3xl font-semibold text-center bg-gradient-to-r from-violet-600 to-rose-500 hover:brightness-110 transition"
                >
                  {t("userPublic.chatCta")}
                </Link>
              ) : (
                <span className="text-sm text-gray-400">{t("userPublic.chatSelf")}</span>
              )}
              <Link
                href={`/users/${user.id}/startups`}
                className="flex-1 md:flex-none px-8 py-4 border border-white/30 hover:bg-white/10 rounded-3xl font-medium text-center"
              >
                Стартапы
              </Link>
              <Link
                href={`/users/${user.id}/ideas`}
                className="flex-1 md:flex-none px-8 py-4 border border-white/30 hover:bg-white/10 rounded-3xl font-medium text-center"
              >
                Идеи
              </Link>
            </div>
          </div>

          <div className="flex-1 space-y-10 min-w-0">
            <div>
              <h2 className="text-xl font-semibold mb-3">О себе</h2>
              <p className="text-gray-300 leading-relaxed">
                {bioText ? bioText : t("userPublic.bioEmpty")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-violet-400">{user.startupsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Стартапов</div>
              </div>
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-emerald-400">{user.ideasCount}</div>
                <div className="text-sm text-gray-400 mt-2">Идей</div>
              </div>
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-rose-400">{exitsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Успешный exit</div>
              </div>
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-amber-400">{bidsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Ставок (аукционы)</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Проекты</h2>
                <Link href={`/users/${user.id}/startups`} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                  Все стартапы →
                </Link>
              </div>

              {startups.length === 0 ? (
                <div className="text-sm text-gray-400">Пока нет опубликованных стартапов.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {startups.map((s) => {
                    const stageLabel = stageLabelsByLang[lang]?.[s.stage] ?? s.stage;
                    const pill = s.auction ? "Аукцион" : "Активен";
                    return (
                      <Link
                        key={s.id}
                        href={`/startups/${s.id}`}
                        className="card-hover bg-[#12121A] border border-white/10 rounded-3xl p-6 block"
                      >
                        <div className="flex justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{s.title}</div>
                            <div className="text-sm text-emerald-400 mt-1 truncate">
                              {stageLabel} • {pill}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-2xl whitespace-nowrap">
                              {s.category}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mt-4 line-clamp-3">{s.description}</p>
                        <div className="mt-6 text-xs text-gray-500">
                          {s.auction
                            ? `Текущая ставка: ${s.auction.currentPrice.toLocaleString("ru-RU")} ₽`
                            : `Цена: ${s.price.toLocaleString("ru-RU")} ₽`}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <span>👤</span> Роль
            </h3>
            <div className="flex flex-wrap gap-3">
              <span className="bg-white/10 px-5 py-2 rounded-3xl text-sm">
                {accountTypeLabelsByLang[lang]?.[user.accountType] ?? user.accountType}
              </span>
              {user.role === "admin" ? <Badge>admin</Badge> : null}
            </div>
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <span>📅</span> На платформе
            </h3>
            <p className="text-gray-300 text-lg">{memberSince}</p>
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
            <h3 className="font-semibold mb-6">Контакты</h3>
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
  );
}
