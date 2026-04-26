"use client";

import Link from "next/link";
import React from "react";

import { stageLabelsByLang } from "@/lib/labelMaps";
import { useI18n } from "@/i18n/I18nProvider";

export type SpotlightStartup = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
};

export type SpotlightIdea = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stage: string;
};

export type SpotlightInvestor = {
  id: string;
  industry: string;
  description: string;
  amount: number;
  author?: { name: string; avatarUrl: string | null } | null;
};

type Props = {
  startup: SpotlightStartup | null;
  idea: SpotlightIdea | null;
  investor: SpotlightInvestor | null;
  fmtMoney: (v: number) => string;
};

function initials(title: string, category: string) {
  const t = (title || "").trim();
  if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  const c = (category || "SH").trim();
  return c.slice(0, 2).toUpperCase() || "SH";
}

export function PlatformSpotlightSection({ startup, idea, investor, fmtMoney }: Props) {
  const { t } = useI18n();
  const stStage = startup ? stageLabelsByLang.ru?.[startup.stage] ?? startup.stage : "";
  const idStage = idea ? stageLabelsByLang.ru?.[idea.stage] ?? idea.stage : "";

  return (
    <section className="section-black" id="platform-spotlight">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Сейчас на платформе</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-base">{t("home.spotlightSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/marketplace" className="font-medium text-white/60 transition hover:text-white">
              Маркетплейс →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="min-w-0">
            <div className="card-hover group min-w-0 cursor-default overflow-hidden rounded-3xl border border-white/10 bg-[#12121A] opacity-95">
              <div className="relative h-[180px] bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899]" aria-hidden />
              <div className="flex min-h-[140px] items-center justify-center p-6">
                <h3 className="text-center text-lg font-semibold leading-snug text-white">{t("home.auctionCardTeaser")}</h3>
              </div>
            </div>
          </div>

          {startup ? (
            <Link
              href={`/startups/${startup.id}`}
              className="card-hover group min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#12121A] transition hover:-translate-y-2 hover:shadow-[0_24px_48px_-12px_rgb(124_58_237/0.35)]"
            >
              <div className="relative flex h-[180px] items-center justify-center bg-gradient-to-br from-[#4F46E5] to-[#EC4899]">
                <div className="text-5xl font-bold text-white/90">{initials(startup.title, startup.category)}</div>
                <div className="absolute right-4 top-4 rounded-full bg-emerald-500/90 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  {stStage}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold leading-tight text-white">{startup.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-400">{startup.description}</p>
                <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
                  <div>
                    <div className="text-xs text-gray-500">Нужно привлечь</div>
                    <div className="text-lg font-semibold text-emerald-400">{fmtMoney(startup.price)} ₽</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">{startup.category}</div>
                </div>
              </div>
            </Link>
          ) : (
            <SpotlightEmpty label="Стартап" href="/marketplace?tab=startups" />
          )}

          {idea ? (
            <Link
              href={`/ideas/${idea.id}`}
              className="card-hover group min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#12121A] transition hover:-translate-y-2 hover:shadow-[0_24px_48px_-12px_rgb(124_58_237/0.35)]"
            >
              <div className="relative flex h-[180px] items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#06b6d4]">
                <div className="text-5xl font-bold text-white/90">{initials(idea.title, idea.category)}</div>
                <div className="absolute right-4 top-4 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  {idStage}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold leading-tight text-white">{idea.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-400">{idea.description}</p>
                <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
                  <div>
                    <div className="text-xs text-gray-500">Запрос</div>
                    <div className="text-lg font-semibold text-emerald-400">{fmtMoney(idea.price)} ₽</div>
                  </div>
                  <div className="text-right text-xs text-violet-300">{idea.category}</div>
                </div>
              </div>
            </Link>
          ) : (
            <SpotlightEmpty label="Идея" href="/marketplace?tab=ideas" />
          )}

          {investor ? (
            <div className="card-hover group min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#12121A] transition hover:-translate-y-2 hover:shadow-[0_24px_48px_-12px_rgb(124_58_237/0.35)]">
              <div className="relative flex h-[180px] items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-400">
                <div className="text-7xl leading-none">👔</div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold">
                    {(investor.author?.name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{investor.author?.name ?? "Инвестор"}</div>
                    <p className="text-sm text-emerald-400">Запрос на инвестиции</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-gray-300">{investor.description}</p>
                <div className="mt-2 text-xs text-gray-500">Фокус: {investor.industry}</div>
                <div className="mt-2 text-sm font-semibold text-emerald-400">от {fmtMoney(investor.amount)} ₽</div>
                <div className="mt-6 flex gap-3">
                  <Link
                    href={`/investors/${investor.id}`}
                    className="flex-1 rounded-2xl border border-violet-500 py-3 text-center text-sm font-medium text-violet-400 transition hover:bg-violet-500/10"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <SpotlightEmpty label="Инвестор" href="/marketplace?tab=investors" />
          )}
        </div>
      </div>
    </section>
  );
}

function SpotlightEmpty({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#12121A]/50 p-8 text-center text-sm text-white/45 transition hover:border-violet-500/40 hover:text-white/70"
    >
      Добавьте {label.toLowerCase()}
      <span className="mt-2 text-violet-400/80">Открыть раздел →</span>
    </Link>
  );
}
