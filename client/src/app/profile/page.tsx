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
  investorRequestsCount?: number;
  partnerRequestsCount?: number;
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("profile-cosmic-bg");
    document.documentElement.classList.add("profile-cosmic-bg");
    return () => {
      document.body.classList.remove("profile-cosmic-bg");
      document.documentElement.classList.remove("profile-cosmic-bg");
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

  const meta = useMemo(() => parseBioMeta(me?.bio ?? null), [me?.bio]);
  const tg = useMemo(() => extractTelegram(me?.bio ?? null), [me?.bio]);
  const bioText = useMemo(() => stripMetaLines(me?.bio ?? null), [me?.bio]);
  const locationLine = useMemo(() => [meta.country?.trim(), meta.city?.trim()].filter(Boolean).join(", "), [meta.city, meta.country]);

  const readiness = useMemo(() => {
    if (!me) {
      return { pct: 0, filledSegments: 0, segments: 10, hint: "" };
    }
    const hasListing =
      (me.startupsCount ?? 0) +
        (me.ideasCount ?? 0) +
        (me.investorRequestsCount ?? 0) +
        (me.partnerRequestsCount ?? 0) >
      0;

    const segments = 10;
    const profileSegments = segments - 1; // last segment is "first listing"
    const filledProfile = Math.min(profileSegments, Math.floor((profileFill / 100) * profileSegments));
    const filledSegments = filledProfile + (hasListing ? 1 : 0);
    const pct = Math.round((filledSegments / segments) * 100);

    const missing: string[] = [];
    if (!me.avatarUrl) missing.push("фото");
    if (!me.bio || stripMetaLines(me.bio).length === 0) missing.push("описание");
    if (!me.phone) missing.push("телефон");
    if (!tg?.trim()) missing.push("Telegram");
    if (!meta.skills.length) missing.push("навыки");
    if (!meta.lookingFor.length) missing.push("что ищу");
    if (!meta.country?.trim() || !meta.city?.trim()) missing.push("страна/город");

    let hint = "";
    if (profileFill < 100) {
      const top = missing.slice(0, 3);
      hint = top.length ? `Заполните профиль: добавьте ${top.join(", ")}.` : "Заполните профиль до конца.";
    } else if (!hasListing) {
      hint = "Профиль готов. Следующий шаг — выложите первую карточку в маркетплейсе.";
    } else {
      hint = "Отлично! Профиль активен.";
    }

    return { pct, filledSegments, segments, hint, hasListing };
  }, [me, meta, profileFill, tg]);

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

  return (
    <div className="text-white min-h-screen">
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
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-[#12121A] p-7 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="w-28 h-28 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-3xl overflow-hidden border-2 border-violet-500/25 shadow-2xl bg-white/5 shrink-0">
                  {me.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={me.avatarUrl} alt={me.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/40 text-sm">Нет фото</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold truncate">{me.name}</h1>
                  <p className="text-violet-400 text-lg mt-1">{subtitle}</p>
                  <p className="text-gray-400 mt-1">{locationLine ? locationLine : "Профиль StartupHub"}</p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
                <Link
                  href="/profile/settings"
                  className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 rounded-3xl font-medium flex items-center justify-center gap-2"
                >
                  ✎ Редактировать
                </Link>
                <button
                  type="button"
                  onClick={() => void onShare()}
                  className="w-full sm:w-auto px-7 py-4 border border-white/30 hover:bg-white/10 rounded-3xl font-medium"
                >
                  Поделиться
                </button>
              </div>
            </div>

            <div className="mt-7">
              <div className="text-sm font-semibold text-white/90">О себе</div>
              <p className="mt-3 text-gray-300 leading-relaxed">
                {bioText ? bioText : "Расскажите о себе — это поможет инвесторам и партнёрам быстрее понять, чем вы занимаетесь."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-4xl font-bold text-violet-400">{me.startupsCount}</div>
              <div className="text-sm text-gray-400 mt-2">Стартапа</div>
            </div>
            <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-4xl font-bold text-emerald-400">{me.startupsCount + me.ideasCount}</div>
              <div className="text-sm text-gray-400 mt-2">Проектов</div>
            </div>
            <div className="transition hover:-translate-y-1 bg-[#12121A] border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-4xl font-bold text-rose-400">
                {(me.investorRequestsCount ?? 0) + (me.partnerRequestsCount ?? 0)}
              </div>
              <div className="text-sm text-gray-400 mt-2">Запросов</div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#12121A] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-gray-400">Готовность профиля</div>
                <div className="mt-1 text-2xl font-semibold text-white">{readiness.pct}%</div>
              </div>
              <div className="text-right text-xs text-gray-400">
                {readiness.hasListing ? "Первое действие выполнено" : "Остался последний шаг"}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {Array.from({ length: readiness.segments }).map((_, i) => {
                const on = i < readiness.filledSegments;
                return (
                  <span
                    key={i}
                    className={[
                      "h-2 flex-1 rounded-full border",
                      on
                        ? i === readiness.segments - 1
                          ? "border-rose-500/40 bg-gradient-to-r from-rose-500 to-violet-500 shadow-[0_0_18px_rgba(225,29,72,0.22)]"
                          : "border-emerald-500/35 bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_16px_rgba(0,245,212,0.16)]"
                        : "border-white/10 bg-white/5",
                    ].join(" ")}
                  />
                );
              })}
            </div>

            <div className="mt-4 text-sm text-gray-300">{readiness.hint}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#12121A] p-7 sm:p-8">
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

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
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
