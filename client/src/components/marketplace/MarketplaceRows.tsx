import Link from "next/link";
import React from "react";

import { formatLabelsByLang, partnerRoleLabelsByLang, stageLabelsByLang } from "@/lib/labelMaps";
import { formatCheckRangeRub, formatMoneyRub, type IdeaProfileExtra, type InvestorProfileExtra, type PartnerProfileExtra } from "@/lib/marketplaceExtras";

export type MarketplaceIdeaRowModel = {
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

export type MarketplaceInvestorRowModel = {
  id: string;
  industry: string;
  description: string;
  amount: number;
  status?: string;
  author?: { name: string; avatarUrl: string | null };
  profileExtra?: InvestorProfileExtra | null;
};

export type MarketplacePartnerRowModel = {
  id: string;
  role: "supplier" | "reseller" | "integration" | "cofounder" | string;
  industry: string;
  description: string;
  author?: { name: string; avatarUrl: string | null };
  profileExtra?: PartnerProfileExtra | null;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0] ?? "?";
  const b = p[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function MarketplaceIdeaRow({ idea }: { idea: MarketplaceIdeaRowModel }) {
  const pe = idea.profileExtra ?? null;
  const city = pe?.city?.trim();
  const tags = (pe?.helpTags ?? []).filter(Boolean).slice(0, 4);

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="card-hover group flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#161618] p-6 transition hover:border-amber-500/30 sm:flex-row sm:items-stretch sm:justify-between sm:gap-8"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-medium text-white/90">Идея</span>
          <span className="rounded-2xl bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
            {stageLabelsByLang.ru?.[idea.stage] ?? idea.stage}
          </span>
          {city ? (
            <span className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-medium text-white/80">{city}</span>
          ) : null}
        </div>
        <h3 className="mt-3 text-xl font-semibold leading-snug text-white md:text-2xl">{idea.title}</h3>
        <p className="mt-2 line-clamp-3 text-base leading-relaxed text-gray-400">{idea.description}</p>
        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-2xl bg-white/10 px-3 py-1 text-xs text-white/80">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col justify-between gap-4 border-t border-white/10 pt-4 sm:w-56 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        <div className="text-sm text-gray-400">
          Ориентир: <span className="font-semibold text-white">{formatMoneyRub(idea.price)}</span>
        </div>
        <div className="text-sm font-medium text-amber-300">
          {idea.format ? (formatLabelsByLang.ru?.[idea.format] ?? idea.format) : null}
        </div>
        <div className="text-xs text-gray-500">Категория: {idea.category}</div>
      </div>
    </Link>
  );
}

export function MarketplaceInvestorRow({ item }: { item: MarketplaceInvestorRowModel }) {
  const pe = item.profileExtra ?? null;
  const name = (pe?.investorName?.trim() || item.author?.name || "Инвестор").trim();
  const title = (pe?.investorTitle?.trim() || item.industry).trim();
  const check = formatCheckRangeRub(pe, item.amount);
  const stages = (pe?.stages ?? []).slice(0, 4);
  const interests = (pe?.interests ?? []).slice(0, 4);

  return (
    <Link
      href={`/investors/${item.id}`}
      className="card-hover flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#161618] p-6 transition hover:border-emerald-500/30 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-bold text-white">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold leading-snug text-white md:text-2xl">{name}</h3>
            <p className="mt-1 text-base font-medium text-emerald-400">{title}</p>
            <p className="mt-3 line-clamp-3 text-base leading-relaxed text-gray-400">{item.description}</p>
            {interests.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {interests.map((t) => (
                  <span key={t} className="rounded-3xl bg-white/10 px-4 py-2 text-xs text-white/85">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:w-72">
        <div className="rounded-3xl bg-[#12121A] p-4">
          <div className="text-xs text-gray-400">Чек</div>
          <div className="mt-1 text-sm font-semibold text-white">{check}</div>
        </div>
        <div className="rounded-3xl bg-[#12121A] p-4">
          <div className="text-xs text-gray-400">Стадии</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {stages.length ? stages.map((s) => stageLabelsByLang.ru?.[s] ?? s).join(", ") : "—"}
          </div>
        </div>
        <div className="rounded-3xl bg-[#12121A] p-4">
          <div className="text-xs text-gray-400">Сделок</div>
          <div className="mt-1 text-lg font-semibold text-white">{pe?.dealsCount != null ? String(pe.dealsCount) : "—"}</div>
        </div>
        <div className="rounded-3xl bg-[#12121A] p-4">
          <div className="text-xs text-gray-400">Выходов</div>
          <div className="mt-1 text-lg font-semibold text-white">{pe?.exitsCount != null ? String(pe.exitsCount) : "—"}</div>
        </div>
      </div>
    </Link>
  );
}

export function MarketplacePartnerRow({ item }: { item: MarketplacePartnerRowModel }) {
  const pe = item.profileExtra ?? null;
  const name = (pe?.partnerName?.trim() || item.author?.name || "Партнёр").trim();
  const sub = (pe?.partnerType?.trim() || partnerRoleLabelsByLang.ru?.[item.role as keyof typeof partnerRoleLabelsByLang.ru] || String(item.role)).trim();
  const services = (pe?.services ?? []).filter((s) => s.title?.trim()).slice(0, 4);

  return (
    <Link
      href={`/partners/${item.id}`}
      className="card-hover flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#161618] p-6 transition hover:border-cyan-500/30 sm:flex-row sm:items-start sm:justify-between sm:gap-8"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-xl font-bold text-white">
            {initials(name).slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold leading-snug text-white md:text-2xl">{name}</h3>
            <p className="mt-1 text-base font-medium text-cyan-400">{sub}</p>
            <p className="mt-3 line-clamp-3 text-base leading-relaxed text-gray-400">{item.description}</p>
          </div>
        </div>
        {services.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <div key={s.title} className="rounded-3xl bg-[#12121A] p-4">
                <div className="font-medium text-white/95">{s.title}</div>
                {s.note ? <div className="mt-2 text-sm text-gray-400">{s.note}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex w-full shrink-0 flex-col justify-center gap-3 sm:w-52 sm:text-right">
        <span className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-medium text-white/80 sm:self-end">
          {item.industry}
        </span>
        <span className="text-sm text-gray-500">Роль в запросе: {partnerRoleLabelsByLang.ru?.[item.role as any] ?? item.role}</span>
      </div>
    </Link>
  );
}
