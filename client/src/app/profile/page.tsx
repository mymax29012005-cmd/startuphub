"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { UserActivityFeed, type PublicUserActivity } from "@/components/profile/PublicUserProfile";
import { accountTypeLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { extractTelegram, parseBioMeta, stripMetaLines } from "@/lib/profileBio";
import { useI18n } from "@/i18n/I18nProvider";

type Me = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
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

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useI18n();

  const [me, setMe] = useState<Me | null>(null);
  const [activities, setActivities] = useState<PublicUserActivity[]>([]);
  const [startups, setStartups] = useState<StartupListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as Me;
        if (!cancelled) setMe(data);

        if (data?.id) {
          const [pr, st] = await Promise.all([
            fetch(`/api/v1/users/${data.id}`, { cache: "no-store" }),
            fetch(`/api/v1/startups?ownerId=${encodeURIComponent(data.id)}`, { cache: "no-store" }),
          ]);
          if (pr.ok) {
            const payload = (await pr.json()) as { activities?: PublicUserActivity[] };
            if (!cancelled) setActivities(payload.activities ?? []);
          }
          if (st.ok) {
            const list = (await st.json()) as StartupListItem[];
            if (!cancelled) setStartups(list.slice(0, 4));
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const subtitle = useMemo(() => {
    if (!me) return "";
    const base = accountTypeLabelsByLang[lang]?.[me.accountType] ?? me.accountType;
    return `${base}`;
  }, [lang, me]);

  const profileFill = useMemo(() => {
    if (!me) return 0;
    let score = 0;
    if (me.name && me.name !== "Новый пользователь") score += 25;
    if (me.avatarUrl) score += 25;
    if (me.bio && stripMetaLines(me.bio).length > 0) score += 25;
    if (me.phone) score += 15;
    if (me.email) score += 10;
    return Math.min(100, score);
  }, [me]);

  const exitsCount = useMemo(() => startups.filter((s) => s.stage === "exit").length, [startups]);
  const bidsCount = useMemo(() => activities.filter((a) => a.kind === "bid_placed").length, [activities]);

  async function onLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  }

  async function onShare() {
    const url = `${window.location.origin}/users/${me?.id ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      window.alert("Ссылка на профиль скопирована");
    } catch {
      window.prompt("Ссылка на профиль", url);
    }
  }

  if (loading) {
    return <div className="pt-28 max-w-7xl mx-auto px-6 pb-16 text-gray-400">Загрузка…</div>;
  }

  if (!me) {
    return (
      <div className="pt-28 max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8 text-gray-300">
          Чтобы открыть профиль, пожалуйста,{" "}
          <Link className="text-violet-400 hover:text-violet-300" href="/login">
            войдите
          </Link>
          .
        </div>
      </div>
    );
  }

  const tg = extractTelegram(me.bio);
  const meta = parseBioMeta(me.bio);
  const bioText = stripMetaLines(me.bio);
  const locationLine = [meta.country?.trim(), meta.city?.trim()].filter(Boolean).join(", ");

  return (
    <div className="bg-[#0A0A0F] text-white min-h-screen">
      <nav className="bg-[rgba(10,10,15,0.95)] backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 min-w-0">
            <span className="logo-dot inline-block h-4 w-4 shrink-0 rounded-full" />
            <span className="text-2xl font-semibold tracking-tight truncate">StartupHub</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link className="hover:text-violet-400" href="/">
              Главная
            </Link>
            <Link className="hover:text-violet-400" href="/marketplace">
              Маркетплейс
            </Link>
            <span className="text-violet-400 font-semibold">Профиль</span>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="px-6 py-3 text-sm font-medium rounded-2xl border border-white/30 hover:bg-white/10"
          >
            Выйти
          </button>
        </div>
      </nav>

      <div className="pt-10 max-w-7xl mx-auto px-4 pb-16 sm:px-6">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="md:w-80 shrink-0 w-full">
            <div className="relative">
              <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto md:mx-0 rounded-3xl overflow-hidden border-4 border-violet-500/30 shadow-2xl bg-white/5">
                {me.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatarUrl} alt={me.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/40 text-sm">Нет фото</div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold">{me.name}</h1>
              <p className="text-violet-400 text-lg mt-1">{subtitle}</p>
              <p className="text-gray-400 mt-1">{locationLine ? locationLine : "Профиль StartupHub"}</p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-3 sm:gap-4">
              <Link
                href="/profile/settings"
                className="w-full sm:flex-1 md:w-auto md:flex-none px-7 py-4 bg-white/10 hover:bg-white/20 rounded-3xl font-medium flex items-center justify-center gap-2"
              >
                ✎ Редактировать
              </Link>
              <button
                type="button"
                onClick={() => void onShare()}
                className="w-full sm:flex-1 md:w-auto md:flex-none px-7 py-4 border border-white/30 hover:bg-white/10 rounded-3xl font-medium"
              >
                Поделиться
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-10 min-w-0">
            <div>
              <h2 className="text-xl font-semibold mb-3">О себе</h2>
              <p className="text-gray-300 leading-relaxed">
                {bioText ? bioText : "Расскажите о себе — это поможет инвесторам и партнёрам быстрее понять, чем вы занимаетесь."}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-violet-400">{me.startupsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Стартапов</div>
              </div>
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-emerald-400">{exitsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Успешный exit</div>
              </div>
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-rose-400">{bidsCount}</div>
                <div className="text-sm text-gray-400 mt-2">Откликов (ставки)</div>
              </div>
              <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
                <div className="text-4xl font-bold text-amber-400">{profileFill}%</div>
                <div className="text-sm text-gray-400 mt-2">Заполненность профиля</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold">Мои проекты</h2>
                <Link href="/add-startup" className="text-violet-400 hover:text-violet-300 flex items-center gap-2 text-sm font-medium">
                  + Добавить проект
                </Link>
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
                          {s.auction ? `Текущая ставка: ${s.auction.currentPrice.toLocaleString("ru-RU")} ₽` : `Цена: ${s.price.toLocaleString("ru-RU")} ₽`}
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
            <h3 className="font-semibold mb-6">Навыки и экспертиза</h3>
            <div className="flex flex-wrap gap-3">
              {(meta.skills.length ? meta.skills : [accountTypeLabelsByLang[lang]?.[me.accountType] ?? me.accountType]).map((x) => (
                <span key={x} className="bg-white/10 px-5 py-2 rounded-3xl text-sm">
                  {x}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
            <h3 className="font-semibold mb-6">Ищу</h3>
            <ul className="space-y-4 text-gray-300">
              {(meta.lookingFor.length
                ? meta.lookingFor
                : [
                    "Инвестиции и партнёров — через карточки и маркетплейс",
                    "Обратную связь по стартапу/идее",
                    "Сделки и переговоры (в рамках правил платформы)",
                  ]
              ).map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="text-violet-400 mt-1">→</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#12121A] border border-white/10 rounded-3xl p-8">
            <h3 className="font-semibold mb-6">Контакты</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="text-xl text-gray-400">✉</div>
                <div className="min-w-0">
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="truncate">{me.email ?? "—"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xl text-gray-400">📱</div>
                <div className="min-w-0">
                  <div className="text-sm text-gray-400">Телефон</div>
                  <div className="truncate">{me.phone ?? "—"}</div>
                </div>
              </div>
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

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/profile/startups" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
            Мои стартапы
          </Link>
          <span className="text-white/20">•</span>
          <Link href="/profile/ideas" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
            Мои идеи
          </Link>
          <span className="text-white/20">•</span>
          <Link href={`/users/${me.id}`} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
            Публичный профиль
          </Link>
        </div>

        <UserActivityFeed activities={activities} />
      </div>
    </div>
  );
}
